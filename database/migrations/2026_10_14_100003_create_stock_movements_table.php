<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
            $table->string('direction'); // in | out
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('balance_after');
            $table->string('reason');
            $table->nullableMorphs('source');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('note')->nullable();
            $table->timestamps();
        });

        // Opening balance so each item's ledger sums to its current quantity.
        DB::table('inventory_items')->where('quantity', '>', 0)->orderBy('id')->chunk(200, function ($items) {
            DB::table('stock_movements')->insert($items->map(fn ($item) => [
                'inventory_item_id' => $item->id,
                'direction' => 'in',
                'quantity' => $item->quantity,
                'balance_after' => $item->quantity,
                'reason' => 'opening_balance',
                'created_at' => now(),
                'updated_at' => now(),
            ])->all());
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
