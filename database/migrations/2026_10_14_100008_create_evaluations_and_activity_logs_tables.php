<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One Likert response per user per criterion; resubmitting overwrites.
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->string('criterion');
            $table->unsignedTinyInteger('score');
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'criterion']);
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event');
            $table->nullableMorphs('subject');
            $table->foreignId('causer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('properties')->nullable();
            $table->timestamps();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('evaluations');
    }
};
