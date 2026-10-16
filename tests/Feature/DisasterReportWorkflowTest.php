<?php

namespace Tests\Feature;

use App\Enums\ReportStatus;
use App\Models\ActivityLog;
use App\Models\DisasterReport;
use App\Models\Purok;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** Objectives 4.3 / 5.1 (G5): Reported → Verified → Confirmed with a recorded timeline. */
class DisasterReportWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_is_verified_by_purok_president_then_confirmed_by_admin(): void
    {
        Storage::fake('public');
        ['barangay' => $barangay, 'purok' => $purok, 'admin' => $admin, 'president' => $president, 'resident' => $resident] = $this->community();

        $this->actingAs($resident)->post('/disaster-reports', [
            'barangay_id' => $barangay->id,
            'purok_id' => $purok->id,
            'type' => 'Flood',
            'description' => 'Knee-deep flood water along the creek since 3 AM.',
            'affected_area' => 'Creekside',
            'photos' => [UploadedFile::fake()->image('my-house-flood.jpg', 640, 480)],
        ])->assertRedirect('/disaster-reports');

        $report = DisasterReport::firstOrFail();
        $this->assertSame(ReportStatus::Reported, $report->status);

        // S6: stored under a random name, re-encoded by GD.
        $photo = $report->photos()->firstOrFail();
        Storage::disk('public')->assertExists($photo->path);
        $this->assertStringNotContainsString('my-house-flood', $photo->path);

        // The admin cannot skip purok verification while the purok has a president.
        $this->actingAs($admin)->post("/disaster-reports/{$report->id}/verify")->assertForbidden();
        $this->actingAs($admin)->post("/disaster-reports/{$report->id}/confirm")->assertSessionHas('error');
        $this->assertSame(ReportStatus::Reported, $report->fresh()->status);

        $this->actingAs($president)
            ->post("/disaster-reports/{$report->id}/verify", ['note' => 'Checked on site with the tanod.'])
            ->assertSessionHas('success');
        $report->refresh();
        $this->assertSame(ReportStatus::Verified, $report->status);
        $this->assertSame($president->id, $report->verified_by);
        $this->assertNotNull($report->verified_at);

        $this->actingAs($admin)->post("/disaster-reports/{$report->id}/confirm")->assertSessionHas('success');
        $report->refresh();
        $this->assertSame(ReportStatus::Confirmed, $report->status);
        $this->assertNotNull($report->confirmed_at);

        $this->assertSame(
            ['reported', 'verified', 'confirmed'],
            $report->history->map(fn ($entry) => $entry->status->value)->all(),
        );
        $this->assertSame('Checked on site with the tanod.', $report->history[1]->note);

        // S7: the status change is in the audit trail with its actor.
        $this->assertTrue(ActivityLog::where('subject_type', $report->getMorphClass())
            ->where('subject_id', $report->id)
            ->where('event', 'updated')
            ->where('causer_id', $admin->id)
            ->exists());
    }

    public function test_president_of_another_purok_cannot_verify(): void
    {
        ['barangay' => $barangay, 'purok' => $purok, 'resident' => $resident] = $this->community();
        $otherPurok = Purok::factory()->create(['barangay_id' => $barangay->id]);
        $otherPresident = User::factory()->purokPresident()->create(['barangay_id' => $barangay->id, 'purok_id' => $otherPurok->id]);

        $report = DisasterReport::factory()->create([
            'reporter_id' => $resident->id, 'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
        ]);

        $this->actingAs($otherPresident)->post("/disaster-reports/{$report->id}/verify")->assertForbidden();
    }

    public function test_admin_stands_in_when_the_purok_has_no_president(): void
    {
        ['barangay' => $barangay, 'admin' => $admin, 'resident' => $resident] = $this->community();
        $leaderless = Purok::factory()->create(['barangay_id' => $barangay->id]);

        $report = DisasterReport::factory()->create([
            'reporter_id' => $resident->id, 'barangay_id' => $barangay->id, 'purok_id' => $leaderless->id,
        ]);

        $this->actingAs($admin)->post("/disaster-reports/{$report->id}/verify")->assertSessionHas('success');
        $this->actingAs($admin)->post("/disaster-reports/{$report->id}/confirm")->assertSessionHas('success');
        $this->assertSame(ReportStatus::Confirmed, $report->fresh()->status);
    }

    public function test_rejection_requires_a_reason_and_is_final(): void
    {
        ['barangay' => $barangay, 'purok' => $purok, 'president' => $president, 'resident' => $resident, 'admin' => $admin] = $this->community();
        $report = DisasterReport::factory()->create([
            'reporter_id' => $resident->id, 'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
        ]);

        $this->actingAs($president)->post("/disaster-reports/{$report->id}/reject")->assertSessionHasErrors('note');
        $this->actingAs($president)->post("/disaster-reports/{$report->id}/reject", ['note' => 'Duplicate of report #1.'])
            ->assertSessionHas('success');
        $this->assertSame(ReportStatus::Rejected, $report->fresh()->status);

        $this->actingAs($admin)->post("/disaster-reports/{$report->id}/confirm")->assertSessionHas('error');
        $this->assertSame(ReportStatus::Rejected, $report->fresh()->status);
    }

    public function test_status_cannot_be_set_through_the_edit_form(): void
    {
        ['barangay' => $barangay, 'purok' => $purok, 'resident' => $resident] = $this->community();
        $report = DisasterReport::factory()->create([
            'reporter_id' => $resident->id, 'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
        ]);

        $this->actingAs($resident)->patch("/disaster-reports/{$report->id}", [
            'affected_area' => 'Creekside, lower part',
            'status' => 'resolved',
        ])->assertRedirect();

        $report->refresh();
        $this->assertSame('Creekside, lower part', $report->affected_area);
        $this->assertSame(ReportStatus::Reported, $report->status);
    }

    public function test_donors_only_see_confirmed_incidents(): void
    {
        ['barangay' => $barangay, 'resident' => $resident] = $this->community();
        $donor = User::factory()->donor()->create();

        $unverified = DisasterReport::factory()->create(['reporter_id' => $resident->id, 'barangay_id' => $barangay->id]);
        $confirmed = DisasterReport::factory()->create([
            'reporter_id' => $resident->id, 'barangay_id' => $barangay->id, 'status' => ReportStatus::Confirmed,
        ]);

        $this->actingAs($donor)->get("/disaster-reports/{$unverified->id}")->assertForbidden();
        $this->actingAs($donor)->get("/disaster-reports/{$confirmed->id}")->assertOk();
    }
}
