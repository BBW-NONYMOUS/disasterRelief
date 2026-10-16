<?php

namespace Database\Factories;

use App\Models\Barangay;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'barangay_id' => Barangay::factory(),
            'category' => 'Food',
            'name' => $this->faker->unique()->randomElement(['Rice', 'Sardines', 'Noodles', 'Corned Beef', 'Biscuits', 'Coffee']),
            'quantity' => 100,
            'unit' => 'pack',
        ];
    }
}
