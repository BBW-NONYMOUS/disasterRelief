<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('resident')->after('email');
            $table->string('phone', 20)->nullable()->after('role');
            $table->unsignedBigInteger('barangay_id')->nullable()->after('phone');
            $table->unsignedBigInteger('purok_id')->nullable()->after('barangay_id');
            $table->string('status')->default('active')->after('purok_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'phone', 'barangay_id', 'purok_id', 'status']);
        });
    }
};
