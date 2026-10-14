<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class BarangayFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Barangay ' . $this->faker->unique()->word(),
            'code' => strtoupper($this->faker->unique()->bothify('BRG-###')),
            'lgu_name' => $this->faker->city() . ' LGU',
        ];
    }
}
