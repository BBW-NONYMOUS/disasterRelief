<?php

namespace Database\Factories;

use App\Enums\AssistanceRequestStatus;
use App\Enums\AssistanceType;
use App\Models\Purok;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AssistanceRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'requester_id' => User::factory(),
            'purok_id' => Purok::factory(),
            'barangay_id' => fn (array $attributes) => Purok::find($attributes['purok_id'])?->barangay_id,
            'type' => $this->faker->randomElement(AssistanceType::cases()),
            'quantity' => $this->faker->numberBetween(1, 10),
            'goods_needed' => $this->faker->sentence(),
            'urgency' => 'normal',
            'status' => AssistanceRequestStatus::Pending,
        ];
    }
}
