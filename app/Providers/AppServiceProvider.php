<?php

namespace App\Providers;

use App\Models\AssistanceRequest;
use App\Models\DisasterReport;
use App\Models\Donation;
use App\Policies\AssistanceRequestPolicy;
use App\Policies\DisasterReportPolicy;
use App\Policies\DonationPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider;
use Illuminate\Support\Facades\Vite;

class AppServiceProvider extends AuthServiceProvider
{
    protected $policies = [
        DisasterReport::class => DisasterReportPolicy::class,
        Donation::class => DonationPolicy::class,
        AssistanceRequest::class => AssistanceRequestPolicy::class,
    ];

    public function register(): void {}

    public function boot(): void
    {
        $this->registerPolicies();
        Vite::prefetch(concurrency: 3);
    }
}
