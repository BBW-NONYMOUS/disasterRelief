<?php

use App\Http\Controllers\AccessControlController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AssistanceRequestController;
use App\Http\Controllers\BarangayController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DisasterReportController;
use App\Http\Controllers\DistributionController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\HouseholdController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentWebhookController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurokController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Data Privacy Act notice, linked from registration.
Route::get('/privacy', fn () => Inertia::render('Privacy'))->name('privacy');

// Payment webhook (no auth required; signature verified in the controller)
Route::post('/webhooks/payment', [PaymentWebhookController::class, 'handle'])->name('webhooks.payment');

/*
| Route groups enforce the coarse role boundary; `module:` checks the
| Super Admin's Access Control matrix; policies inside each controller
| enforce barangay/purok scoping and per-record rules.
*/
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard (role-aware)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Notifications
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Disaster reports — every role (policy scopes visibility).
    // Reported → Verified (Purok President) → Confirmed (Admin) → Resolved.
    Route::middleware('module:disaster_reports')->group(function () {
        Route::resource('disaster-reports', DisasterReportController::class);
        Route::post('/disaster-reports/{disasterReport}/verify', [DisasterReportController::class, 'verify'])
            ->middleware('role:purok_president,admin,super_admin')->name('disaster-reports.verify');
        Route::post('/disaster-reports/{disasterReport}/confirm', [DisasterReportController::class, 'confirm'])
            ->middleware('role:admin,super_admin')->name('disaster-reports.confirm');
        Route::post('/disaster-reports/{disasterReport}/reject', [DisasterReportController::class, 'reject'])
            ->middleware('role:purok_president,admin,super_admin')->name('disaster-reports.reject');
        Route::post('/disaster-reports/{disasterReport}/merge', [DisasterReportController::class, 'merge'])
            ->middleware('role:purok_president,admin,super_admin')->name('disaster-reports.merge');
        Route::post('/disaster-reports/{disasterReport}/resolve', [DisasterReportController::class, 'resolve'])
            ->middleware('role:admin,super_admin')->name('disaster-reports.resolve');
    });

    // Assistance requests — residents file; officials verify/approve; donors see approved needs.
    Route::middleware('module:assistance_requests')->group(function () {
        Route::resource('assistance-requests', AssistanceRequestController::class)->except(['edit', 'update']);
        Route::post('/assistance-requests/{assistanceRequest}/verify', [AssistanceRequestController::class, 'verify'])
            ->middleware('role:purok_president,admin,super_admin')->name('assistance-requests.verify');
        Route::post('/assistance-requests/{assistanceRequest}/approve', [AssistanceRequestController::class, 'approve'])
            ->middleware('role:admin,super_admin')->name('assistance-requests.approve');
        Route::post('/assistance-requests/{assistanceRequest}/reject', [AssistanceRequestController::class, 'reject'])
            ->middleware('role:purok_president,admin,super_admin')->name('assistance-requests.reject');
        Route::post('/assistance-requests/{assistanceRequest}/fulfill', [AssistanceRequestController::class, 'fulfill'])
            ->middleware('role:admin,super_admin')->name('assistance-requests.fulfill');
    });

    // System evaluation — every role can respond.
    Route::middleware('module:evaluations')->group(function () {
        Route::get('/evaluations/create', [EvaluationController::class, 'create'])->name('evaluations.create');
        Route::post('/evaluations', [EvaluationController::class, 'store'])->name('evaluations.store');
    });

    // Donations — donors give; barangay officials receive.
    Route::middleware(['role:donor,admin,super_admin', 'module:donations'])->group(function () {
        Route::resource('donations', DonationController::class)->except(['edit', 'update']);
        Route::post('/donations/{donation}/receive', [DonationController::class, 'receive'])
            ->middleware('role:admin,super_admin')->name('donations.receive');
        Route::post('/donations/{donation}/mark-distributed', [DonationController::class, 'markDistributed'])
            ->middleware('role:admin,super_admin')->name('donations.mark-distributed');
    });

    // Households and distributions — field officials.
    Route::middleware('role:admin,super_admin,purok_president')->group(function () {
        Route::middleware('module:households')->group(function () {
            Route::resource('households', HouseholdController::class);
            Route::post('/households/{household}/verify', [HouseholdController::class, 'verify'])
                ->middleware('role:purok_president')->name('households.verify');
        });

        Route::middleware('module:distributions')->group(function () {
            Route::resource('distributions', DistributionController::class)->except(['edit']);
            Route::patch('/distributions/{distribution}/transition', [DistributionController::class, 'transition'])
                ->name('distributions.transition');
            Route::get('/distributions/{distribution}/signature', [DistributionController::class, 'signature'])
                ->middleware('signed')->name('distributions.signature');
        });
    });

    // Barangay administration.
    Route::middleware('role:admin,super_admin')->group(function () {
        Route::resource('inventory', InventoryController::class)->middleware('module:inventory');

        Route::middleware('module:reports')->group(function () {
            Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
            Route::post('/reports/generate', [ReportController::class, 'generate'])->name('reports.generate');
            Route::get('/reports/{report}/download', [ReportController::class, 'download'])->name('reports.download');
        });

        // Admins manage community accounts in their barangay; see UserPolicy.
        Route::resource('users', UserController::class)->except(['destroy'])->middleware('module:users');
    });

    // Super Admin only.
    Route::middleware('role:super_admin')->group(function () {
        // Restrict access: suspend accounts and switch modules off per role.
        Route::post('/users/{user}/restrict', [UserController::class, 'restrict'])->name('users.restrict');
        Route::post('/users/{user}/restore', [UserController::class, 'restoreAccess'])->name('users.restore');
        Route::get('/access-control', [AccessControlController::class, 'index'])->name('access-control.index');
        Route::put('/access-control', [AccessControlController::class, 'update'])->name('access-control.update');

        Route::resource('barangays', BarangayController::class)->except(['show']);
        Route::resource('puroks', PurokController::class)->except(['show']);

        Route::get('/evaluations', [EvaluationController::class, 'index'])->name('evaluations.index');
        Route::get('/evaluations/export', [EvaluationController::class, 'export'])->name('evaluations.export');

        Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
    });
});

require __DIR__ . '/auth.php';
