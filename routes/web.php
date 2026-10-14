<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DisasterReportController;
use App\Http\Controllers\AssistanceRequestController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\DistributionController;
use App\Http\Controllers\HouseholdController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentWebhookController;
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

// Payment webhook (no auth required)
Route::post('/webhooks/payment', [PaymentWebhookController::class, 'handle'])->name('webhooks.payment');

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

    // Disaster Reports — all roles can view; residents can create
    Route::resource('disaster-reports', DisasterReportController::class);

    // Assistance Requests — residents can create
    Route::resource('assistance-requests', AssistanceRequestController::class);

    // Donations — donors manage their own
    Route::resource('donations', DonationController::class);

    // Households — purok presidents and admins
    Route::resource('households', HouseholdController::class);

    // Inventory — admins
    Route::resource('inventory', InventoryController::class);

    // Distributions — admins and purok presidents
    Route::resource('distributions', DistributionController::class);
    Route::patch('/distributions/{distribution}/transition', [DistributionController::class, 'transition'])
        ->name('distributions.transition');

    // Reports (PDF)
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::post('/reports/generate', [ReportController::class, 'generate'])->name('reports.generate');
    Route::get('/reports/{report}/download', [ReportController::class, 'download'])->name('reports.download');

    // User management — admin/super_admin
    Route::resource('users', UserController::class);
});

require __DIR__ . '/auth.php';
