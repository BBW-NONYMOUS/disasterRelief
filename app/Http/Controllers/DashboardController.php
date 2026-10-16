<?php

namespace App\Http\Controllers;

use App\Enums\AssistanceRequestStatus;
use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Models\AssistanceRequest;
use App\Models\DisasterReport;
use App\Models\Distribution;
use App\Models\Donation;
use App\Models\Household;
use App\Models\InventoryItem;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private InventoryService $inventory) {}

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

        // Only plot still-active disasters; donors only see officially confirmed ones.
        $statuses = $role === UserRole::Donor ? [ReportStatus::Confirmed->value] : ReportStatus::active();
        $query->whereIn('status', $statuses);

        $reports = $query->latest()->limit(200)->get([
            'id', 'type', 'status', 'severity', 'latitude', 'longitude',
            'affected_area', 'barangay_id',
        ]);

        return [
            'map_reports' => $reports,
            'map_barangay_ids' => $barangayIds
                ?? DisasterReport::query()->distinct()->pluck('barangay_id')->all(),
            // Live events are filtered client-side with the same rule.
            'map_statuses' => $statuses,
        ];
    }

    private function superAdminData(): array
    {
        return [
            'stats' => [
                'total_reports' => DisasterReport::count(),
                'total_donations' => Donation::count(),
                'cash_received' => $this->peso(Donation::where('type', 'cash')->where('payment_status', 'paid')->sum('amount_cents')),
                'total_distributions' => Distribution::count(),
                'open_requests' => AssistanceRequest::whereIn('status', AssistanceRequestStatus::open())->count(),
                'total_users' => User::count(),
            ],
            'recent_reports' => DisasterReport::with(['reporter', 'barangay'])->latest()->limit(5)->get(),
            'recent_donations' => Donation::with('donor')->latest()->limit(5)->get(),
            'priority_requests' => $this->priorityQueue(null),
        ];
    }

    private function adminData($user): array
    {
        $barangayId = $user->barangay_id;
        $donations = Donation::where('barangay_id', $barangayId);

        return [
            'stats' => [
                'pending_reports' => DisasterReport::where('barangay_id', $barangayId)
                    ->whereIn('status', [ReportStatus::Reported->value, ReportStatus::Verified->value])->count(),
                'confirmed_reports' => DisasterReport::where('barangay_id', $barangayId)
                    ->where('status', ReportStatus::Confirmed->value)->count(),
                'open_requests' => AssistanceRequest::where('barangay_id', $barangayId)
                    ->whereIn('status', AssistanceRequestStatus::open())->count(),
                'pending_distributions' => Distribution::where('barangay_id', $barangayId)
                    ->where('status', 'waiting')->count(),
                'donations_received' => (clone $donations)->where(fn ($q) => $q
                    ->where(fn ($q) => $q->where('type', 'cash')->where('payment_status', 'paid'))
                    ->orWhere(fn ($q) => $q->where('type', 'goods')->whereNotNull('received_at')))->count(),
                'cash_received' => $this->peso((clone $donations)->where('type', 'cash')->where('payment_status', 'paid')->sum('amount_cents')),
                'goods_pledged' => (clone $donations)->where('type', 'goods')->whereNull('received_at')->count(),
                'goods_received' => (clone $donations)->where('type', 'goods')->whereNotNull('received_at')->count(),
                'inventory_items' => InventoryItem::where('barangay_id', $barangayId)->count(),
            ],
            'recent_reports' => DisasterReport::with(['reporter', 'purok'])
                ->where('barangay_id', $barangayId)->latest()->limit(5)->get(),
            'recent_distributions' => Distribution::with('household')
                ->where('barangay_id', $barangayId)->latest()->limit(5)->get(),
            'priority_requests' => $this->priorityQueue($barangayId),
            'low_stock_items' => $barangayId
                ? $this->inventory->getLowStockItems($barangayId)->take(8)->values()
                : [],
            'low_stock_threshold' => config('reliefnet.low_stock_threshold'),
        ];
    }

    private function purokPresidentData($user): array
    {
        $purokId = $user->purok_id;
        return [
            'stats' => [
                'reports_to_verify' => DisasterReport::where('purok_id', $purokId)
                    ->where('status', ReportStatus::Reported->value)->count(),
                'requests_to_verify' => AssistanceRequest::where('purok_id', $purokId)
                    ->where('status', AssistanceRequestStatus::Pending->value)->count(),
                'unverified_households' => Household::where('purok_id', $purokId)->whereNull('verified_at')->count(),
                'priority_households' => Household::where('purok_id', $purokId)
                    ->where('priority_flag', true)->count(),
                'total_households' => Household::where('purok_id', $purokId)->count(),
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
                'distributed_donations' => Donation::where('donor_id', $user->id)->where('status', 'distributed')->count(),
                'active_reports' => DisasterReport::where('status', ReportStatus::Confirmed->value)->count(),
            ],
            'my_donations' => Donation::where('donor_id', $user->id)->latest()->limit(5)->get(),
            'active_reports' => DisasterReport::with('barangay')
                ->where('status', ReportStatus::Confirmed->value)->latest()->limit(5)->get(),
            'open_needs' => AssistanceRequest::openNeeds()->take(6)->values(),
        ];
    }

    private function priorityQueue(?int $barangayId)
    {
        return AssistanceRequest::with(['purok:id,name', 'barangay:id,name'])
            ->whereIn('status', AssistanceRequestStatus::open())
            ->when($barangayId, fn ($q) => $q->where('barangay_id', $barangayId))
            ->prioritized()
            ->limit(5)
            ->get(['id', 'barangay_id', 'purok_id', 'type', 'quantity', 'urgency', 'priority', 'status', 'created_at']);
    }

    private function peso(int|string|null $cents): string
    {
        return '₱'.number_format(((int) $cents) / 100, 2);
    }
}
