<?php

namespace Tests\Feature;

use App\Models\Barangay;
use App\Models\DisasterReport;
use App\Models\Donation;
use App\Models\Report;
use App\Models\User;
use App\Services\ReportPdfService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** G7 consolidated reports, G9 signatories, S5 donation scoping. */
class ReportGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_generates_a_consolidated_report_for_chosen_barangays(): void
    {
        Storage::fake('local');
        $super = User::factory()->superAdmin()->create();
        $alpha = Barangay::factory()->create(['name' => 'Barangay Alpha']);
        $bravo = Barangay::factory()->create(['name' => 'Barangay Bravo']);
        DisasterReport::factory()->count(2)->create(['barangay_id' => $alpha->id]);
        DisasterReport::factory()->create(['barangay_id' => $bravo->id]);

        $this->actingAs($super)->post('/reports/generate', [
            'kind' => 'incident',
            'barangay_ids' => [$alpha->id, $bravo->id],
            'prepared_by_name' => 'Ana Reyes',
            'prepared_by_position' => 'MDRRMO Staff',
            'noted_by_name' => 'Hon. Jose Cruz',
            'noted_by_position' => 'Punong Barangay',
        ])->assertRedirect('/reports');

        $report = Report::firstOrFail();
        $this->assertNull($report->barangay_id);
        $this->assertSame([$alpha->id, $bravo->id], $report->meta['barangay_ids']);
        $this->assertSame('Hon. Jose Cruz', $report->meta['signatories']['noted_by_name']);
        Storage::disk('local')->assertExists($report->file_path);
        $this->actingAs($super)->get("/reports/{$report->id}/download")->assertOk();
    }

    public function test_grouped_report_shows_subtotals_grand_total_and_signatories(): void
    {
        $alpha = Barangay::factory()->create(['name' => 'Barangay Alpha']);
        $bravo = Barangay::factory()->create(['name' => 'Barangay Bravo']);
        DisasterReport::factory()->count(2)->create(['barangay_id' => $alpha->id]);
        DisasterReport::factory()->create(['barangay_id' => $bravo->id]);

        $data = app(ReportPdfService::class)->viewData('incident', [], null, null, [
            'prepared_by_name' => 'Ana Reyes',
            'noted_by_name' => 'Hon. Jose Cruz',
            'noted_by_position' => 'Punong Barangay',
        ]);
        $html = view('reports.incident', $data)->render();

        $this->assertTrue($data['grouped']);
        $this->assertSame(3, $data['grand_total']['count']);
        $this->assertStringContainsString('All barangays (consolidated)', $html);
        $this->assertStringContainsString('Barangay Alpha', $html);
        $this->assertStringContainsString('Barangay Bravo', $html);
        $this->assertStringContainsString('Subtotal: 2 incident(s)', $html);
        $this->assertStringContainsString('Grand total: 3 incident(s)', $html);
        $this->assertStringContainsString('Noted by:', $html);
        $this->assertStringContainsString('Hon. Jose Cruz', $html);
        $this->assertStringContainsString('Punong Barangay', $html);
    }

    public function test_admin_reports_are_always_scoped_to_their_barangay(): void
    {
        Storage::fake('local');
        ['barangay' => $barangay, 'admin' => $admin] = $this->community();
        $other = Barangay::factory()->create();

        $this->actingAs($admin)->post('/reports/generate', [
            'kind' => 'received',
            'barangay_ids' => [$other->id],
        ])->assertRedirect('/reports');

        $report = Report::firstOrFail();
        $this->assertSame($barangay->id, $report->barangay_id);

        $otherAdmin = User::factory()->admin()->create(['barangay_id' => $other->id]);
        $this->actingAs($otherAdmin)->get("/reports/{$report->id}/download")->assertForbidden();
    }

    public function test_received_report_only_counts_the_barangays_own_donations(): void
    {
        $alpha = Barangay::factory()->create();
        $bravo = Barangay::factory()->create();
        Donation::factory()->create(['barangay_id' => $alpha->id, 'amount_cents' => 10000, 'payment_status' => 'paid']);
        Donation::factory()->create(['barangay_id' => $bravo->id, 'amount_cents' => 99900, 'payment_status' => 'paid']);
        Donation::factory()->create(['barangay_id' => $alpha->id, 'amount_cents' => 5000]); // unpaid pledge

        $data = app(ReportPdfService::class)->viewData('received', [$alpha->id], null, null);

        $this->assertSame(1, $data['grand_total']['count']);
        $this->assertSame(10000, $data['grand_total']['cash_cents']);
    }
}
