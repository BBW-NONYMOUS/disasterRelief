<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([RoleSeeder::class]);

        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@reliefnet.test',
            'password' => Hash::make('password'),
            'role' => UserRole::SuperAdmin,
            'phone' => '09161234567',
            'status' => 'active',
        ]);
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        $this->call([BarangaySeeder::class]);
    }
}
