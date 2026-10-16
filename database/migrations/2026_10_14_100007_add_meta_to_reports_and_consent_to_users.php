<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Barangays covered, period and signatories of a generated PDF.
        Schema::table('reports', function (Blueprint $table) {
            $table->json('meta')->nullable()->after('file_path');
        });

        // Data Privacy Act (RA 10173) consent captured at registration.
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('consented_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn('meta');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('consented_at');
        });
    }
};
