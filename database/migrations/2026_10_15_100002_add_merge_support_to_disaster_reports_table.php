<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * relief.md gap-fix: several residents report the same flood; the purok
     * president merges duplicates into one incident.
     */
    public function up(): void
    {
        Schema::table('disaster_reports', function (Blueprint $table) {
            $table->foreignId('merged_into_id')->nullable()->after('status')
                ->constrained('disaster_reports')->nullOnDelete();
            $table->timestamp('merged_at')->nullable()->after('merged_into_id');
        });
    }

    public function down(): void
    {
        Schema::table('disaster_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('merged_into_id');
            $table->dropColumn('merged_at');
        });
    }
};
