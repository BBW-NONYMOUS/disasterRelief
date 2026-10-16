<?php

namespace App\Providers;

use App\Models\AssistanceRequest;
use App\Models\DisasterReport;
use App\Models\Distribution;
use App\Models\Donation;
use App\Models\Household;
use App\Models\InventoryItem;
use App\Models\User;
use App\Policies\AssistanceRequestPolicy;
use App\Policies\DisasterReportPolicy;
use App\Policies\DistributionPolicy;
use App\Policies\DonationPolicy;
use App\Policies\HouseholdPolicy;
use App\Policies\InventoryItemPolicy;
use App\Policies\UserPolicy;
use App\Services\RoleAccess;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;

class AppServiceProvider extends AuthServiceProvider
{
    protected $policies = [
        DisasterReport::class => DisasterReportPolicy::class,
        Donation::class => DonationPolicy::class,
        AssistanceRequest::class => AssistanceRequestPolicy::class,
        Household::class => HouseholdPolicy::class,
        Distribution::class => DistributionPolicy::class,
        InventoryItem::class => InventoryItemPolicy::class,
        User::class => UserPolicy::class,
    ];

    public function register(): void
    {
        // One instance per request so the role's granted modules are loaded once.
        $this->app->scoped(RoleAccess::class);
    }

    public function boot(): void
    {
        $this->registerPolicies();

        // Access Control levels sit above every policy: No Access denies all
        // abilities on the module's records, View Only denies all but viewing.
        // Returning null hands the decision to the policy as usual.
        Gate::before(function (User $user, string $ability, array $arguments) {
            $module = RoleAccess::moduleForSubject($arguments[0] ?? null);
            if (! $module) {
                return null;
            }

            $level = app(RoleAccess::class)->levelFor($user->role, $module);

            if ($level === RoleAccess::NONE) {
                return false;
            }

            if ($level === RoleAccess::VIEW && ! in_array($ability, ['view', 'viewAny'], true)) {
                return false;
            }

            return null;
        });

        Vite::prefetch(concurrency: 3);
    }
}