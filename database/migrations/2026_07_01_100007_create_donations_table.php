<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donor_id')->constrained('users')->cascadeOnDelete();
            $table->string('type');
            $table->unsignedBigInteger('amount_cents')->default(0);
            $table->text('items')->nullable();
            $table->string('delivery_method')->default('deliver');
            $table->timestamp('scheduled_at')->nullable();
            $table->string('payment_status')->default('pending');
            $table->string('payment_reference')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};
