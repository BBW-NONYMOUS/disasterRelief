<?php

namespace Database\Factories;

use App\Enums\DonationStatus;
use App\Enums\PaymentStatus;
use App\Models\Barangay;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DonationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'donor_id' => User::factory()->donor(),
            'barangay_id' => Barangay::factory(),
            'type' => 'cash',
            'amount_cents' => 50000,
            'items' => null,
            'delivery_method' => 'deliver',
            'payment_status' => PaymentStatus::Pending,
            'status' => DonationStatus::Pending,
        ];
    }

    public function goods(): static
    {
        return $this->state(fn () => ['type' => 'goods', 'amount_cents' => 0]);
    }
}
