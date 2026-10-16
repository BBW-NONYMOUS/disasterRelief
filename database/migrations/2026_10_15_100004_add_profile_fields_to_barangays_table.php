<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangays', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('lgu_name');
            $table->text('description')->nullable()->after('image_path');
            $table->string('captain_name')->nullable()->after('description');
            $table->string('contact_number', 30)->nullable()->after('captain_name');
            $table->string('email')->nullable()->after('contact_number');
            $table->string('hall_address')->nullable()->after('email');
            $table->unsignedInteger('population')->nullable()->after('hall_address');
            $table->decimal('land_area_km2', 8, 2)->nullable()->after('population');
        });
    }

    public function down(): void
    {
        Schema::table('barangays', function (Blueprint $table) {
            $table->dropColumn([
                'image_path', 'description', 'captain_name', 'contact_number',
                'email', 'hall_address', 'population', 'land_area_km2',
            ]);
        });
    }
};
