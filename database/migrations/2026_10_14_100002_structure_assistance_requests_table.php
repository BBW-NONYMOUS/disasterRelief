<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assistance_requests', function (Blueprint $table) {
            $table->foreignId('barangay_id')->nullable()->after('disaster_report_id')->constrained()->nullOnDelete();
            $table->foreignId('purok_id')->nullable()->after('barangay_id')->constrained()->nullOnDelete();
            $table->foreignId('household_id')->nullable()->after('purok_id')->constrained()->nullOnDelete();
            $table->string('type')->default('food')->after('household_id');
            $table->unsignedInteger('quantity')->default(1)->after('type');
            // Tagged by the Purok President on verify, finalised by the Admin on approve.
            $table->string('priority')->nullable()->after('urgency');
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('fulfilled_at')->nullable();
            $table->text('remarks')->nullable();

            $table->index(['barangay_id', 'status']);
        });

        // Scope existing requests to the requester's barangay/purok.
        DB::table('assistance_requests')->update([
            'barangay_id' => DB::raw('(select barangay_id from users where users.id = assistance_requests.requester_id)'),
            'purok_id' => DB::raw('(select purok_id from users where users.id = assistance_requests.requester_id)'),
        ]);
        DB::table('assistance_requests')->whereNull('barangay_id')->whereNotNull('disaster_report_id')->update([
            'barangay_id' => DB::raw('(select barangay_id from disaster_reports where disaster_reports.id = assistance_requests.disaster_report_id)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('assistance_requests', function (Blueprint $table) {
            $table->dropIndex(['barangay_id', 'status']);
            $table->dropConstrainedForeignId('barangay_id');
            $table->dropConstrainedForeignId('purok_id');
            $table->dropConstrainedForeignId('household_id');
            $table->dropConstrainedForeignId('verified_by');
            $table->dropConstrainedForeignId('approved_by');
            $table->dropColumn(['type', 'quantity', 'priority', 'verified_at', 'approved_at', 'fulfilled_at', 'remarks']);
        });
    }
};
