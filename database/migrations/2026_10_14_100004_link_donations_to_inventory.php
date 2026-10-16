<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->foreignId('barangay_id')->nullable()->after('donor_id')->constrained()->nullOnDelete();
            $table->timestamp('received_at')->nullable()->after('status');
            $table->foreignId('received_by')->nullable()->after('received_at')->constrained('users')->nullOnDelete();
            $table->timestamp('distributed_at')->nullable()->after('received_by');
        });

        Schema::create('donation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('category');
            $table->string('name');
            $table->string('unit');
            $table->unsignedInteger('quantity'); // pledged
            $table->unsignedInteger('received_quantity')->nullable();
            $table->unsignedInteger('distributed_quantity')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donation_items');

        Schema::table('donations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('barangay_id');
            $table->dropConstrainedForeignId('received_by');
            $table->dropColumn(['received_at', 'distributed_at']);
        });
    }
};
