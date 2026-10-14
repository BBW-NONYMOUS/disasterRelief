<?php

namespace Database\Factories;

use App\Enums\ReportStatus;
use App\Models\Barangay;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DisasterReportFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reporter_id' => User::factory(),
            'barangay_id' => Barangay::factory(),
            'purok_id' => null,
            'type' => $this->faker->randomElement(['Flood', 'Fire', 'Earthquake', 'Landslide', 'Typhoon']),
            'description' => $this->faker->paragraph(),
            'affected_area' => $this->faker->streetName(),
            'status' => ReportStatus::Reported,
        ];
    }
}
