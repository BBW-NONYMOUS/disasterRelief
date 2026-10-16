<?php

namespace Tests\Feature;

use App\Enums\ReportStatus;
use App\Models\DisasterReport;
use App\Models\Donation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** relief.md gap-fix: a donor's pledge can target a specific incident, not only a barangay. */
class DonationIncidentLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_donor_can_pledge_toward_a_confirmed_incident(): void
    {
        ['barangay' => $barangay, 'resident' => $resident] = $this->community();
        $donor = User::factory()->donor()->create();

        $report = DisasterReport::factory()->create([
            'barangay_id' => $barangay->id,
            'reporter_id' => $resident->id,
            'status' => ReportStatus::Confirmed,
        ]);

        $this->actingAs($donor)->post('/donations', [
            'barangay_id' => $barangay->id,
            'disaster_report_id' => $report->id,
            'type' => 'goods',
            'delivery_method' => 'deliver',
            'items' => [
                ['name' => 'Rice', 'category' => 'Food', 'quantity' => 10, 'unit' => 'kg'],
            ],
        ])->assertRedirect();

        $donation = Donation::firstOrFail();
        $this->assertSame($report->id, $donation->disaster_report_id);

        // The linked incident is shown back to the donor.
        $this->actingAs($donor)->get("/donations/{$donation->id}")
            ->assertInertia(fn (Assert $page) => $page
                ->component('Donations/Show')
                ->where('donation.disaster_report.id', $report->id));
    }

    public function test_incident_must_be_active_and_in_the_chosen_barangay(): void
    {
        ['barangay' => $barangay, 'resident' => $resident] = $this->community();
        $donor = User::factory()->donor()->create();

        // Rejected incidents cannot receive donations.
        $rejected = DisasterReport::factory()->create([
            'barangay_id' => $barangay->id,
            'reporter_id' => $resident->id,
            'status' => ReportStatus::Rejected,
        ]);

        $this->actingAs($donor)->post('/donations', [
            'barangay_id' => $barangay->id,
            'disaster_report_id' => $rejected->id,
            'type' => 'cash',
            'amount_cents' => 50000,
            'delivery_method' => 'deliver',
        ])->assertSessionHasErrors('disaster_report_id');

        // An incident in a different barangay is also refused.
        $elsewhere = DisasterReport::factory()->create(['status' => ReportStatus::Confirmed]);

        $this->actingAs($donor)->post('/donations', [
            'barangay_id' => $barangay->id,
            'disaster_report_id' => $elsewhere->id,
            'type' => 'cash',
            'amount_cents' => 50000,
            'delivery_method' => 'deliver',
        ])->assertSessionHasErrors('disaster_report_id');

        $this->assertSame(0, Donation::count());
    }
}
