<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Barangay;
use App\Models\Household;
use App\Models\Purok;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BarangaySeeder extends Seeder
{
    public function run(): void
    {
        $barangay1 = Barangay::create([
            'name' => 'Barangay Poblacion',
            'code' => 'BRG-001',
            'lgu_name' => 'City of San Jose LGU',
        ]);

        $barangay2 = Barangay::create([
            'name' => 'Barangay San Isidro',
            'code' => 'BRG-002',
            'lgu_name' => 'City of San Jose LGU',
        ]);

        // Create admins
        $admin1 = User::create([
            'name' => 'Maria Santos',
            'email' => 'admin@reliefnet.test',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
            'phone' => '09171234567',
            'barangay_id' => $barangay1->id,
            'status' => 'active',
        ]);
        $admin1->assignRole(UserRole::Admin->value);

        $admin2 = User::create([
            'name' => 'Jose Reyes',
            'email' => 'admin2@reliefnet.test',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
            'phone' => '09179876543',
            'barangay_id' => $barangay2->id,
            'status' => 'active',
        ]);
        $admin2->assignRole(UserRole::Admin->value);

        // Puroks for barangay 1
        $purok1 = Purok::create(['barangay_id' => $barangay1->id, 'name' => 'Purok 1']);
        $purok2 = Purok::create(['barangay_id' => $barangay1->id, 'name' => 'Purok 2']);

        // Purok president
        $president = User::create([
            'name' => 'Pedro Cruz',
            'email' => 'purok@reliefnet.test',
            'password' => Hash::make('password'),
            'role' => UserRole::PurokPresident,
            'phone' => '09181234567',
            'barangay_id' => $barangay1->id,
            'purok_id' => $purok1->id,
            'status' => 'active',
        ]);
        $president->assignRole(UserRole::PurokPresident->value);
        $purok1->update(['president_id' => $president->id]);

        // Sample households
        $households1 = [
            ['head_name' => 'Juan Dela Cruz', 'address' => '12 Rizal St.', 'members_count' => 5, 'priority_flag' => true],
            ['head_name' => 'Ana Gomez', 'address' => '34 Mabini St.', 'members_count' => 3, 'priority_flag' => false],
            ['head_name' => 'Roberto Lim', 'address' => '56 Bonifacio Ave.', 'members_count' => 7, 'priority_flag' => true],
        ];

        foreach ($households1 as $h) {
            Household::create(array_merge($h, ['purok_id' => $purok1->id, 'status' => 'waiting']));
        }

        // Opening relief stock for Poblacion (recorded in the stock ledger).
        $inventory = app(InventoryService::class);
        foreach ([
            ['Food', 'Rice', 100, 'kg'],
            ['Food', 'Sardines', 200, 'can'],
            ['Water', 'Bottled water', 150, 'bottle'],
            ['Medicine', 'Paracetamol 500mg', 40, 'pack'],
            ['Hygiene', 'Hygiene kit', 8, 'pack'],
        ] as [$category, $name, $quantity, $unit]) {
            $inventory->addStock($barangay1->id, $category, $name, $quantity, $unit, null, null, StockMovement::REASON_OPENING_BALANCE);
        }

        // Sample residents and donors
        $resident = User::create([
            'name' => 'Liza Flores',
            'email' => 'resident@reliefnet.test',
            'password' => Hash::make('password'),
            'role' => UserRole::Resident,
            'phone' => '09191234567',
            'barangay_id' => $barangay1->id,
            'purok_id' => $purok1->id,
            'status' => 'active',
        ]);
        $resident->assignRole(UserRole::Resident->value);

        $donor = User::create([
            'name' => 'Carlos Tan',
            'email' => 'donor@reliefnet.test',
            'password' => Hash::make('password'),
            'role' => UserRole::Donor,
            'phone' => '09201234567',
            'status' => 'active',
        ]);
        $donor->assignRole(UserRole::Donor->value);
    }
}
