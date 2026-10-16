<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('disaster_reports', function (Blueprint $table) {
            $table->timestamp('verified_at')->nullable()->after('status');
            $table->foreignId('verified_by')->nullable()->after('verified_at')->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable()->after('resolved_at');
        });

        Schema::create('report_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('disaster_report_id')->constrained()->cascadeOnDelete();
            $table->string('status');
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('note')->nullable();
            $table->timestamps();
        });

        // Rebuild the timeline for reports filed before the history table existed.
        DB::table('disaster_reports')->orderBy('id')->chunk(200, function ($reports) {
            $rows = [];
            foreach ($reports as $report) {
                $rows[] = $this->historyRow($report->id, 'reported', $report->reporter_id, $report->created_at);
                if ($report->confirmed_at) {
                    $rows[] = $this->historyRow($report->id, 'confirmed', null, $report->confirmed_at);
                }
                if ($report->resolved_at) {
                    $rows[] = $this->historyRow($report->id, 'resolved', null, $report->resolved_at);
                }
            }
            DB::table('report_status_histories')->insert($rows);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_status_histories');

        DB::table('disaster_reports')->where('status', 'verified')->update(['status' => 'reported']);
        DB::table('disaster_reports')->where('status', 'rejected')->update(['status' => 'resolved']);

        Schema::table('disaster_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verified_by');
            $table->dropColumn(['verified_at', 'rejected_at']);
        });
    }

    private function historyRow(int $reportId, string $status, ?int $actorId, $at): array
    {
        return [
            'disaster_report_id' => $reportId,
            'status' => $status,
            'actor_id' => $actorId,
            'note' => null,
            'created_at' => $at,
            'updated_at' => $at,
        ];
    }
};
