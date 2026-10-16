<?php

namespace App\Services;

use App\Enums\AssistanceRequestStatus;
use App\Enums\DistributionStatus;
use App\Enums\DonationStatus;
use App\Enums\HouseholdStatus;
use App\Exceptions\InsufficientStockException;
use App\Models\AssistanceRequest;
use App\Models\Distribution;
use App\Models\Donation;
use App\Models\DonationItem;
use App\Models\Household;
use App\Models\InventoryItem;
use App\Models\StockMovement;
use App\Models\User;
use App\Notifications\AssistanceRequestUpdated;
use App\Notifications\DonationUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use LogicException;

class DistributionService
{
    public function __construct(private InventoryService $inventory) {}

    /**
     * Creates the distribution and deducts every line from the barangay's
     * inventory in one transaction — any shortage rolls the whole thing back.
     *
     * @param  array<int, array{inventory_item_id: int, quantity: int}>  $lines
     *
     * @throws InsufficientStockException
     */
    public function create(Household $household, User $actor, array $lines, ?AssistanceRequest $request = null): Distribution
    {
        $barangayId = $household->purok->barangay_id;

        // Merge duplicate rows for the same stock item.
        $quantities = collect($lines)
            ->groupBy('inventory_item_id')
            ->map(fn ($rows) => (int) $rows->sum('quantity'));

        return DB::transaction(function () use ($household, $actor, $request, $barangayId, $quantities) {
            $stock = InventoryItem::whereIn('id', $quantities->keys())
                ->where('barangay_id', $barangayId)
                ->get()
                ->keyBy('id');

            if ($stock->count() !== $quantities->count()) {
                throw new LogicException('Some items are not in this barangay\'s inventory.');
            }

            $distribution = Distribution::create([
                'barangay_id' => $barangayId,
                'household_id' => $household->id,
                'assistance_request_id' => $request?->id,
                'admin_id' => $actor->id,
                'items' => $quantities->map(fn ($qty, $id) => "{$stock[$id]->name} ({$qty} {$stock[$id]->unit})")->implode(', '),
                'quantity' => $quantities->sum(),
                'status' => DistributionStatus::Waiting,
            ]);

            foreach ($quantities as $itemId => $qty) {
                $item = $stock[$itemId];
                $this->inventory->deductStock($item, $qty, $distribution, StockMovement::REASON_DISTRIBUTION);

                $distribution->distributionItems()->create([
                    'inventory_item_id' => $item->id,
                    'item_name' => $item->name,
                    'unit' => $item->unit,
                    'quantity' => $qty,
                ]);
            }

            return $distribution;
        });
    }

    public function start(Distribution $distribution): void
    {
        DB::transaction(function () use ($distribution) {
            $distribution->transitionTo(DistributionStatus::Ongoing);

            $household = $distribution->household;
            if ($household && $household->status === HouseholdStatus::Waiting) {
                $household->update(['status' => HouseholdStatus::Ongoing]);
            }
        });
    }

    /**
     * Completes the hand-over: requires the recipient's signature, traces the
     * goods back to donations (FIFO) and closes the linked assistance request.
     */
    public function complete(Distribution $distribution): void
    {
        if (! $distribution->signature_path) {
            throw new LogicException('Capture the recipient\'s signature before completing the distribution.');
        }

        $notifications = DB::transaction(function () use ($distribution) {
            $distribution->transitionTo(DistributionStatus::Completed);
            $distribution->update(['distributed_at' => now()]);

            $notifications = $this->allocateDonations($distribution);

            $request = $distribution->assistanceRequest;
            if ($request && $request->status->canTransitionTo(AssistanceRequestStatus::Fulfilled)) {
                $request->update(['status' => AssistanceRequestStatus::Fulfilled, 'fulfilled_at' => now()]);
                $notifications[] = fn () => $request->requester?->notify(
                    new AssistanceRequestUpdated($request, 'Your assistance request has been fulfilled.')
                );
            }

            return $notifications;
        });

        foreach ($notifications as $send) {
            $send();
        }
    }

    /** Cancels a not-yet-started distribution and returns its goods to stock. */
    public function cancel(Distribution $distribution): void
    {
        if ($distribution->status !== DistributionStatus::Waiting) {
            throw new LogicException('Only distributions that have not started can be cancelled.');
        }

        DB::transaction(function () use ($distribution) {
            foreach ($distribution->distributionItems()->with('inventoryItem')->get() as $line) {
                if ($line->inventoryItem) {
                    $this->inventory->stockIn(
                        $line->inventoryItem,
                        $line->quantity,
                        StockMovement::REASON_DISTRIBUTION_CANCELLED,
                        $distribution,
                    );
                }
            }

            $distribution->delete();
        });

        if ($distribution->signature_path) {
            Storage::disk('local')->delete($distribution->signature_path);
        }
    }

    /**
     * Attributes each distributed line to received donation items, oldest
     * first, and marks donations Distributed once all their goods are out.
     *
     * @return array<int, callable> notifications to send after commit
     */
    private function allocateDonations(Distribution $distribution): array
    {
        $touched = [];

        foreach ($distribution->distributionItems as $line) {
            if (! $line->inventory_item_id) {
                continue;
            }

            $remaining = $line->quantity;
            $candidates = DonationItem::where('inventory_item_id', $line->inventory_item_id)
                ->whereNotNull('received_quantity')
                ->whereColumn('distributed_quantity', '<', 'received_quantity')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            foreach ($candidates as $donationItem) {
                if ($remaining <= 0) {
                    break;
                }

                $take = min($remaining, $donationItem->received_quantity - $donationItem->distributed_quantity);
                $donationItem->increment('distributed_quantity', $take);
                $donationItem->allocations()->create(['distribution_item_id' => $line->id, 'quantity' => $take]);

                $touched[$donationItem->donation_id] = true;
                $remaining -= $take;
            }
        }

        $notifications = [];
        $donations = Donation::whereIn('id', array_keys($touched))->with('donationItems', 'donor')->get();

        foreach ($donations as $donation) {
            if ($donation->status === DonationStatus::Distributed) {
                continue;
            }

            if ($donation->donationItems->every(fn (DonationItem $item) => $item->isFullyDistributed())) {
                $donation->update(['status' => DonationStatus::Distributed, 'distributed_at' => now()]);
                $notifications[] = fn () => $donation->donor?->notify(
                    new DonationUpdated($donation, 'All goods from your donation have been distributed to affected households.')
                );
            }
        }

        return $notifications;
    }
}
