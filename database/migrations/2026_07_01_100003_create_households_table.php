<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('households', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purok_id')->constrained()->cascadeOnDelete();
            $table->string('head_name');
            $table->text('address');
            $table->unsignedTinyInteger('members_count')->default(1);
            $table->boolean('priority_flag')->default(false);
            $table->string('status')->default('waiting');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('households');
    }
};
