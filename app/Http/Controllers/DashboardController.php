<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\AssistanceRequest;
use App\Models\DisasterReport;
use App\Models\Distribution;
use App\Models\Donation;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user->role;

        $data = match ($role) {
            UserRole::SuperAdmin => $this->superAdminData(),
            UserRole::Admin => $this->adminData($user),
            UserRole::PurokPresident => $this->purokPresidentData($user),
            UserRole::Resident => $this->residentData($user),
            UserRole::Donor => $this->donorData($user),
        };

        return Inertia::render('Dashboard', $data + $this->mapData($user, $role));
    }

    /**
     * Markers + the barangay channels the live map should subscribe to,
     * scoped to what the role is allowed to see.
     */
    private function mapData($user, UserRole $role): array
    {
        $query = DisasterReport::query()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude');

        $barangayIds = match ($role) {
            UserRole::Admin, UserRole::Resident => [$user->barangay_id],
            UserRole::PurokPresident => [$user->barangay_id],
            default => null, // super admin + donor see all barangays
        };

        if ($barangayIds) {
            $query->whereIn('barangay_id', $barangayIds);
        }

        // Only plot still-active disasters on the situation map.
        $query->where('status', '!=', 'resolved');

        $reports = $query->latest()->limit(200)->get([
            'id', 'type', 'status', 'severity', 'latitude', 'longitude',
            'affected_area', 'barangay_id',
        ]);

        return [
            'map_reports' => $reports,
            'map_barangay_ids' => $barangayIds
                ?? DisasterReport::query()->distinct()->pluck('barangay_id')->all(),
        ];
    }

    private function superAdminData(): array
    {
        return [
            'stats' => [
                'total_reports' => DisasterReport::count(),
                'total_donations' => Donation::count(),
                'total_distributions' => Distribution::count(),
                'total_users' => \App\Models\User::count(),
            ],
            'recent_reports' => DisasterReport::with(['reporter', 'barangay'])->latest()->limit(5)->get(),
            'recent_donations' => Donation::with('donor')->latest()->limit(5)->get(),
        ];
    }

    private function adminData($user): array
    {
        $barangayId = $user->barangay_id;
        return [
            'stats' => [
                'pending_reports' => DisasterReport::where('barangay_id', $barangayId)
                    ->where('status', 'reported')->count(),
                'confirmed_reports' => DisasterReport::where('barangay_id', $barangayId)
                    ->where('status', 'confirmed')->count(),
                'inventory_items' => InventoryItem::where('barangay_id', $barangayId)->count(),
                'pending_distributions' => Distribution::where('barangay_id', $barangayId)
                    ->where('status', 'waiting')->count(),
            ],
            'recent_reports' => DisasterReport::with(['reporter', 'purok'])
                ->where('barangay_id', $barangayId)->latest()->limit(5)->get(),
            'recent_distributions' => Distribution::with('household')
                ->where('barangay_id', $barangayId)->latest()->limit(5)->get(),
        ];
    }

    private function purokPresidentData($user): array
    {
        $purokId = $user->purok_id;
        return [
            'stats' => [
                'total_reports' => DisasterReport::where('purok_id', $purokId)->count(),
                'priority_households' => \App\Models\Household::where('purok_id', $purokId)
                    ->where('priority_flag', true)->count(),
                'total_households' => \App\Models\Household::where('purok_id', $purokId)->count(),
            ],
            'recent_reports' => DisasterReport::with('reporter')
                ->where('purok_id', $purokId)->latest()->limit(5)->get(),
        ];
    }

    private function residentData($user): array
    {
        return [
            'stats' => [
                'my_reports' => DisasterReport::where('reporter_id', $user->id)->count(),
                'my_requests' => AssistanceRequest::where('requester_id', $user->id)->count(),
            ],
            'my_reports' => DisasterReport::where('reporter_id', $user->id)->latest()->limit(5)->get(),
            'my_requests' => AssistanceRequest::where('requester_id', $user->id)->latest()->limit(5)->get(),
        ];
    }

    private function donorData($user): array
    {
        return [
            'stats' => [
                'total_donations' => Donation::where('donor_id', $user->id)->count(),
                'active_reports' => DisasterReport::where('status', '!=', 'resolved')->count(),
            ],
            'my_donations' => Donation::where('donor_id', $user->id)->latest()->limit(5)->get(),
            'active_reports' => DisasterReport::with('barangay')
                ->where('status', '!=', 'resolved')->latest()->limit(5)->get(),
        ];
    }
}
