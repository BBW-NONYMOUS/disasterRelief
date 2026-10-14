<?php

namespace Database\Factories;

use App\Models\Barangay;
use Illuminate\Database\Eloquent\Factories\Factory;

class PurokFactory extends Factory
{
    public function definition(): array
    {
        return [
            'barangay_id' => Barangay::factory(),
            'name' => 'Purok ' . $this->faker->randomElement(['1', '2', '3', '4', '5', 'Sampaguita', 'Narra', 'Mabini']),
            'president_id' => null,
        ];
    }
}
