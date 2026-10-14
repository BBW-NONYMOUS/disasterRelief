<?php

namespace Database\Factories;

use App\Models\Purok;
use Illuminate\Database\Eloquent\Factories\Factory;

class HouseholdFactory extends Factory
{
    public function definition(): array
    {
        return [
            'purok_id' => Purok::factory(),
            'head_name' => $this->faker->name(),
            'address' => $this->faker->streetAddress(),
            'members_count' => $this->faker->numberBetween(1, 10),
            'priority_flag' => $this->faker->boolean(20),
            'status' => 'waiting',
        ];
    }
}
