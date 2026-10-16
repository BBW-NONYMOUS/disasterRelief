<?php

namespace Tests;

use App\Models\Barangay;
use App\Models\Household;
use App\Models\Purok;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** RefreshDatabase seeds the Spatie roles that registration and user management assign. */
    protected bool $seed = true;

    protected string $seeder = RoleSeeder::class;

    protected function setUp(): void
    {
        parent::setUp();

        // Page assets are not built for every new Inertia page in CI.
        $this->withoutVite();
    }

    /**
     * One barangay with one purok, its president, an admin and a resident —
     * the smallest world in which every workflow can run.
     *
     * @return array{barangay: Barangay, purok: Purok, admin: User, president: User, resident: User, household: Household}
     */
    protected function community(): array
    {
        $barangay = Barangay::factory()->create();
        $purok = Purok::factory()->create(['barangay_id' => $barangay->id]);

        $admin = User::factory()->admin()->create(['barangay_id' => $barangay->id]);
        $president = User::factory()->purokPresident()->create(['barangay_id' => $barangay->id, 'purok_id' => $purok->id]);
        $purok->update(['president_id' => $president->id]);
        $resident = User::factory()->create(['barangay_id' => $barangay->id, 'purok_id' => $purok->id]);
        $household = Household::factory()->create(['purok_id' => $purok->id]);

        return compact('barangay', 'purok', 'admin', 'president', 'resident', 'household');
    }
}
