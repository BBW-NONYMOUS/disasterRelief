<?php

namespace Tests\Feature;

use App\Enums\AssistanceRequestStatus;
use App\Enums\DistributionStatus;
use App\Enums\DonationStatus;
use App\Enums\HouseholdStatus;
use App\Models\AssistanceRequest;
use App\Models\Distribution;
use App\Models\Donation;
use App\Models\InventoryItem;
use App\Models\Purok;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Objectives 3.5, 5.3, 7 (G3): donation → inventory → distribution → beneficiary, traced back to the donor. */
class DonationInventoryDistributionTest extends TestCase
{
    use RefreshDatabase;

    public function test_goods_flow_from_pledge_to_signed_hand_over(): void
    {
        Storage::fake('local');
        ['barangay' => $barangay, 'purok' => $purok, 'admin' => $admin, 'household' => $household, 'resident' => $resident] = $this->community();
        $donor = User::factory()->donor()->create();

        // 1. Donor pledges itemised goods to a barangay.
        $this->actingAs($donor)->post('/donations', [
            'barangay_id' => $barangay->id,
            'type' => 'goods',
            'delivery_method' => 'deliver',
            'items' => [
                ['name' => 'Rice', 'category' => 'Food', 'quantity' => 10, 'unit' => 'kg'],
                ['name' => 'Bottled water', 'category' => 'Water', 'quantity' => 24, 'unit' => 'bottle'],
            ],
        ])->assertRedirect();

        $donation = Donation::with('donationItems')->firstOrFail();
        $this->assertSame($barangay->id, $donation->barangay_id);
        [$rice, $water] = $donation->donationItems->all();

        // 2. Admin receives it; only 8 kg of rice actually arrived.
        $this->actingAs($admin)->post("/donations/{$donation->id}/receive", [
            'items' => [
                $rice->id => ['received_quantity' => 8],
                $water->id => ['received_quantity' => 24, 'expiry_date' => now()->addYear()->toDateString()],
            ],
        ])->assertSessionHas('success');

        $this->assertSame(DonationStatus::Delivered, $donation->fresh()->status);
        $riceStock = InventoryItem::where('name', 'Rice')->firstOrFail();
        $waterStock = InventoryItem::where('name', 'Bottled water')->firstOrFail();
        $this->assertSame(8, $riceStock->quantity);
        $this->assertSame(24, $waterStock->quantity);
        $this->assertDatabaseHas('stock_movements', [
            'inventory_item_id' => $riceStock->id, 'direction' => 'in', 'quantity' => 8, 'reason' => 'donation_received',
        ]);

        // 3. Over-drawing stock is rejected and nothing changes.
        $this->actingAs($admin)->post('/distributions', [
            'household_id' => $household->id,
            'items' => [['inventory_item_id' => $riceStock->id, 'quantity' => 9]],
        ])->assertSessionHasErrors('items');
        $this->assertSame(8, $riceStock->fresh()->quantity);
        $this->assertSame(0, Distribution::count());

        // 4. A valid distribution deducts stock and is tied to an approved request.
        $request = AssistanceRequest::factory()->create([
            'purok_id' => $purok->id, 'barangay_id' => $barangay->id, 'requester_id' => $resident->id,
            'household_id' => $household->id, 'status' => AssistanceRequestStatus::Approved, 'priority' => 'high',
        ]);

        $this->actingAs($admin)->post('/distributions', [
            'household_id' => $household->id,
            'assistance_request_id' => $request->id,
            'items' => [
                ['inventory_item_id' => $riceStock->id, 'quantity' => 8],
                ['inventory_item_id' => $waterStock->id, 'quantity' => 24],
            ],
        ])->assertRedirect();

        $distribution = Distribution::firstOrFail();
        $this->assertSame(0, $riceStock->fresh()->quantity);
        $this->assertSame(0, $waterStock->fresh()->quantity);
        $this->assertSame(2, $distribution->distributionItems()->count());
        $this->assertDatabaseHas('stock_movements', [
            'inventory_item_id' => $riceStock->id, 'direction' => 'out', 'quantity' => 8, 'reason' => 'distribution',
        ]);

        // 5. Starting moves the household to ongoing; completing needs a signature.
        $this->actingAs($admin)->patch("/distributions/{$distribution->id}/transition", ['status' => 'ongoing'])->assertSessionHas('success');
        $this->assertSame(HouseholdStatus::Ongoing, $household->fresh()->status);
        $this->actingAs($admin)->patch("/distributions/{$distribution->id}/transition", ['status' => 'completed'])->assertSessionHas('error');

        $this->actingAs($admin)->patch("/distributions/{$distribution->id}", [
            'signature' => UploadedFile::fake()->image('signature.png', 600, 200),
        ])->assertRedirect();

        $distribution->refresh();
        Storage::disk('local')->assertExists($distribution->signature_path);
        $this->assertDatabaseHas('beneficiaries', ['distribution_id' => $distribution->id, 'household_id' => $household->id]);

        $this->actingAs($admin)->patch("/distributions/{$distribution->id}/transition", ['status' => 'completed'])->assertSessionHas('success');
        $this->assertSame(DistributionStatus::Completed, $distribution->fresh()->status);

        // 6. The donation is traced to the hand-over and the request is closed.
        $this->assertSame(DonationStatus::Distributed, $donation->fresh()->status);
        $this->assertSame(8, $rice->fresh()->distributed_quantity);
        $this->assertSame(AssistanceRequestStatus::Fulfilled, $request->fresh()->status);

        // The donor sees where the goods went, but not who received them.
        $this->actingAs($donor)->get("/donations/{$donation->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('donation.status', 'distributed')
                ->where('donation_items.0.allocations.0.quantity', 8)
                ->where('donation_items.0.allocations.0.purok', $purok->name)
                ->where('donation_items.0.allocations.0.household', null));
    }

    public function test_cancelling_a_waiting_distribution_returns_the_stock(): void
    {
        ['barangay' => $barangay, 'admin' => $admin, 'household' => $household] = $this->community();
        $stock = InventoryItem::factory()->create(['barangay_id' => $barangay->id, 'quantity' => 50]);

        $this->actingAs($admin)->post('/distributions', [
            'household_id' => $household->id,
            'items' => [['inventory_item_id' => $stock->id, 'quantity' => 20]],
        ]);
        $this->assertSame(30, $stock->fresh()->quantity);

        $distribution = Distribution::firstOrFail();
        $this->actingAs($admin)->delete("/distributions/{$distribution->id}")->assertRedirect('/distributions');

        $this->assertSame(50, $stock->fresh()->quantity);
        $this->assertDatabaseHas('stock_movements', ['inventory_item_id' => $stock->id, 'reason' => 'distribution_cancelled', 'quantity' => 20]);
        $this->assertSame(0, Distribution::count());
    }

    public function test_inventory_from_another_barangay_cannot_be_distributed(): void
    {
        ['admin' => $admin, 'household' => $household] = $this->community();
        $foreignStock = InventoryItem::factory()->create(['quantity' => 50]);

        $this->actingAs($admin)->post('/distributions', [
            'household_id' => $household->id,
            'items' => [['inventory_item_id' => $foreignStock->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('items.0.inventory_item_id');

        $this->assertSame(50, $foreignStock->fresh()->quantity);
    }

    public function test_purok_president_records_distributions_only_for_their_purok(): void
    {
        ['barangay' => $barangay, 'president' => $president, 'household' => $household] = $this->community();
        $stock = InventoryItem::factory()->create(['barangay_id' => $barangay->id, 'quantity' => 10]);
        $otherPurok = Purok::factory()->create(['barangay_id' => $barangay->id]);
        $otherHousehold = \App\Models\Household::factory()->create(['purok_id' => $otherPurok->id]);

        $this->actingAs($president)->post('/distributions', [
            'household_id' => $otherHousehold->id,
            'items' => [['inventory_item_id' => $stock->id, 'quantity' => 1]],
        ])->assertForbidden();

        $this->actingAs($president)->post('/distributions', [
            'household_id' => $household->id,
            'items' => [['inventory_item_id' => $stock->id, 'quantity' => 1]],
        ])->assertRedirect();

        $this->assertSame(9, $stock->fresh()->quantity);
    }

    public function test_signature_is_only_served_through_a_signed_url(): void
    {
        Storage::fake('local');
        ['admin' => $admin, 'household' => $household, 'barangay' => $barangay] = $this->community();
        Storage::disk('local')->put('signatures/sig.png', 'png-bytes');
        $distribution = Distribution::create([
            'barangay_id' => $barangay->id, 'household_id' => $household->id, 'admin_id' => $admin->id,
            'items' => 'Rice (1 kg)', 'quantity' => 1, 'status' => DistributionStatus::Ongoing,
            'signature_path' => 'signatures/sig.png',
        ]);

        $this->actingAs($admin)->get(route('distributions.signature', $distribution))->assertForbidden();
        $this->actingAs($admin)
            ->get(URL::temporarySignedRoute('distributions.signature', now()->addMinutes(5), $distribution))
            ->assertOk();
    }
}
