<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('disaster_reports', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('affected_area');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('severity')->default('moderate')->after('longitude');
        });
    }

    public function down(): void
    {
        Schema::table('disaster_reports', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'severity']);
        });
    }
};
