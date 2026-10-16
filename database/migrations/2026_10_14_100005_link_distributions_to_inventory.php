<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('distributions', function (Blueprint $table) {
            $table->foreignId('assistance_request_id')->nullable()->after('household_id')->constrained()->nullOnDelete();
        });

        Schema::create('distribution_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distribution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->nullable()->constrained()->nullOnDelete();
            // Snapshot so reports stay readable if the stock row is later removed.
            $table->string('item_name');
            $table->string('unit');
            $table->unsignedInteger('quantity');
            $table->timestamps();
        });

        // Which donated goods ended up in which distribution (FIFO on completion).
        Schema::create('donation_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donation_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('distribution_item_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donation_allocations');
        Schema::dropIfExists('distribution_items');

        Schema::table('distributions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assistance_request_id');
        });
    }
};
