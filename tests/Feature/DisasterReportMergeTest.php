<?php

namespace Tests\Feature;

use App\Enums\ReportStatus;
use App\Models\AssistanceRequest;
use App\Models\DisasterReport;
use App\Models\Donation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** relief.md gap-fix: several residents report the same flood; the purok president merges duplicates. */
class DisasterReportMergeTest extends TestCase
{
    use RefreshDatabase;

    public function test_purok_president_merges_a_duplicate_and_its_requests_and_donations_follow(): void
    {
        ['barangay' => $barangay, 'purok' => $purok, 'president' => $president, 'resident' => $resident, 'household' => $household] = $this->community();

        $survivor = DisasterReport::factory()->create([
            'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
            'reporter_id' => $resident->id, 'status' => ReportStatus::Verified,
        ]);
        $duplicate = DisasterReport::factory()->create([
            'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
            'reporter_id' => $resident->id, 'status' => ReportStatus::Reported,
        ]);

        $request = AssistanceRequest::factory()->create([
            'disaster_report_id' => $duplicate->id, 'barangay_id' => $barangay->id,
            'purok_id' => $purok->id, 'requester_id' => $resident->id, 'household_id' => $household->id,
        ]);
        $donation = Donation::factory()->create([
            'barangay_id' => $barangay->id, 'disaster_report_id' => $duplicate->id,
        ]);

        $this->actingAs($president)
            ->post("/disaster-reports/{$duplicate->id}/merge", ['target_id' => $survivor->id])
            ->assertRedirect("/disaster-reports/{$survivor->id}");

        $duplicate->refresh();
        $this->assertSame(ReportStatus::Merged, $duplicate->status);
        $this->assertSame($survivor->id, $duplicate->merged_into_id);
        $this->assertNotNull($duplicate->merged_at);

        // Requests and pledges moved to the surviving incident.
        $this->assertSame($survivor->id, $request->fresh()->disaster_report_id);
        $this->assertSame($survivor->id, $donation->fresh()->disaster_report_id);

        // The merge is on the audit trail.
        $this->assertDatabaseHas('report_status_histories', [
            'disaster_report_id' => $duplicate->id,
            'status' => ReportStatus::Merged->value,
            'actor_id' => $president->id,
        ]);

        // A merged report is final.
        $this->actingAs($president)
            ->post("/disaster-reports/{$duplicate->id}/verify")
            ->assertSessionHas('error');
    }

    public function test_merge_target_must_be_active_same_barangay_and_not_itself(): void
    {
        ['barangay' => $barangay, 'purok' => $purok, 'president' => $president, 'resident' => $resident] = $this->community();

        $duplicate = DisasterReport::factory()->create([
            'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
            'reporter_id' => $resident->id, 'status' => ReportStatus::Reported,
        ]);

        // Self-merge refused.
        $this->actingAs($president)
            ->post("/disaster-reports/{$duplicate->id}/merge", ['target_id' => $duplicate->id])
            ->assertSessionHasErrors('target_id');

        // Other barangay refused.
        $elsewhere = DisasterReport::factory()->create(['status' => ReportStatus::Confirmed]);
        $this->actingAs($president)
            ->post("/disaster-reports/{$duplicate->id}/merge", ['target_id' => $elsewhere->id])
            ->assertSessionHasErrors('target_id');

        // Resolved incidents cannot absorb new duplicates.
        $resolved = DisasterReport::factory()->create([
            'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
            'reporter_id' => $resident->id, 'status' => ReportStatus::Resolved,
        ]);
        $this->actingAs($president)
            ->post("/disaster-reports/{$duplicate->id}/merge", ['target_id' => $resolved->id])
            ->assertSessionHasErrors('target_id');

        $this->assertSame(ReportStatus::Reported, $duplicate->fresh()->status);

        // Residents cannot merge at all.
        $survivor = DisasterReport::factory()->create([
            'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
            'reporter_id' => $resident->id, 'status' => ReportStatus::Verified,
        ]);
        $this->actingAs($resident)
            ->post("/disaster-reports/{$duplicate->id}/merge", ['target_id' => $survivor->id])
            ->assertForbidden();
    }
}
