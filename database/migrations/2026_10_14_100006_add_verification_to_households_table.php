<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('households', function (Blueprint $table) {
            $table->timestamp('verified_at')->nullable()->after('status');
            $table->foreignId('verified_by')->nullable()->after('verified_at')->constrained('users')->nullOnDelete();
        });

        // Align with HouseholdStatus / DistributionStatus (waiting, ongoing, completed).
        DB::table('households')->where('status', 'assistance_completed')->update(['status' => 'completed']);
    }

    public function down(): void
    {
        DB::table('households')->where('status', 'completed')->update(['status' => 'assistance_completed']);

        Schema::table('households', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verified_by');
            $table->dropColumn('verified_at');
        });
    }
};
