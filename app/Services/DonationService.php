<?php

namespace App\Services;

use App\Enums\DonationStatus;
use App\Models\Donation;
use App\Models\StockMovement;
use App\Models\User;
use App\Notifications\DonationUpdated;
use Illuminate\Support\Facades\DB;
use LogicException;

class DonationService
{
    public function __construct(private InventoryService $inventory) {}

    /**
     * Records the goods actually handed over and stocks them into the
     * receiving barangay's inventory.
     *
     * @param  array<int, array{received_quantity?: int, expiry_date?: ?string}>  $receipt  keyed by donation_item id
     */
    public function receive(Donation $donation, User $receiver, array $receipt): void
    {
        if (! $donation->isGoods()) {
            throw new LogicException('Only goods donations are received into inventory.');
        }

        if (! in_array($donation->status, [DonationStatus::Pending, DonationStatus::Confirmed], true)) {
            throw new LogicException('This donation has already been received.');
        }

        $barangayId = $donation->barangay_id ?? $receiver->barangay_id;
        if (! $barangayId) {
            throw new LogicException('Choose the receiving barangay before recording the donation.');
        }

        DB::transaction(function () use ($donation, $receiver, $receipt, $barangayId) {
            foreach ($donation->donationItems as $item) {
                $received = (int) ($receipt[$item->id]['received_quantity'] ?? $item->quantity);
                $attributes = ['received_quantity' => $received];

                if ($received > 0) {
                    $stock = $this->inventory->addStock(
                        $barangayId,
                        $item->category,
                        $item->name,
                        $received,
                        $item->unit,
                        $receipt[$item->id]['expiry_date'] ?? null,
                        $donation,
                        StockMovement::REASON_DONATION,
                    );
                    $attributes['inventory_item_id'] = $stock->id;
                }

                $item->update($attributes);
            }

            $donation->update([
                'barangay_id' => $barangayId,
                'status' => DonationStatus::Delivered,
                'received_at' => now(),
                'received_by' => $receiver->id,
            ]);
        });

        $donation->donor?->notify(new DonationUpdated(
            $donation,
            "Your goods donation #{$donation->id} was received and added to the barangay's relief inventory."
        ));
    }

    /** Cash is not stocked as goods; an official records when it was put to use. */
    public function markCashDistributed(Donation $donation): void
    {
        if ($donation->isGoods() || $donation->status !== DonationStatus::Confirmed) {
            throw new LogicException('Only confirmed (paid) cash donations can be marked as distributed.');
        }

        $donation->update(['status' => DonationStatus::Distributed, 'distributed_at' => now()]);

        $donation->donor?->notify(new DonationUpdated(
            $donation,
            "Your cash donation #{$donation->id} has been used for relief distribution."
        ));
    }
}
