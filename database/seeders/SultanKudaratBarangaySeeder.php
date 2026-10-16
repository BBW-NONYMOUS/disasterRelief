<?php

namespace Database\Seeders;

use App\Models\Barangay;
use Illuminate\Database\Seeder;

/**
 * Barangays of Sultan Kudarat municipalities (Region XII). Re-running updates rows in place (matched on code).
 *
 * Codes are the official 10-digit PSA PSGC codes where confirmed; "BGB-"/"ESP-" codes are placeholders
 * until the official PSGC code is confirmed — replace them in place and re-run.
 *
 * Run: php artisan db:seed --class=SultanKudaratBarangaySeeder
 */
class SultanKudaratBarangaySeeder extends Seeder
{
    /** LGU name => [[barangay name, code, population (2020 census)], ...] */
    private const MUNICIPALITIES = [
        // PSGC 1206501000
        'Municipality of Bagumbayan, Sultan Kudarat' => [
            ['Bai Sarifinang', '1206501001', 7443],
            ['Biwang', '1206501002', 5352],
            ['Busok', '1206501003', 3878],
            ['Chua', 'BGB-CHUA', 2449],
            ['Daguma', '1206501004', 4878],
            ['Daluga', 'BGB-DALUGA', 1613],
            ['Kabulanan', 'BGB-KABULANAN', 2004],
            ['Kanulay', 'BGB-KANULAY', 875],
            ['Kapaya', '1206501005', 5956],
            ['Kinayao', '1206501006', 2287],
            ['Masiag', '1206501008', 6371],
            ['Monteverde', 'BGB-MONTEVERDE', 1949],
            ['Poblacion', '1206501009', 5965],
            ['Santo Niño', 'BGB-STO-NINO', 3387],
            ['Sison', 'BGB-SISON', 2681],
            ['South Sepaka', '1206501010', 2543],
            ['Sumilil', 'BGB-SUMILIL', 2402],
            ['Titulok', 'BGB-TITULOK', 2045],
            ['Tuka', '1206501011', 4869],
        ],

        // PSGC 1206503000
        'Municipality of Esperanza, Sultan Kudarat' => [
            ['Ala', 'ESP-ALA', 2772],
            ['Daladap', 'ESP-DALADAP', 2947],
            ['Dukay', 'ESP-DUKAY', 2401],
            ['Guiamalia', 'ESP-GUIAMALIA', 2196],
            ['Ilian', 'ESP-ILIAN', 2737],
            ['Kangkong', 'ESP-KANGKONG', 2187],
            ['Laguinding', 'ESP-LAGUINDING', 2528],
            ['Magsaysay', 'ESP-MAGSAYSAY', 1282],
            ['Margues', 'ESP-MARGUES', 3974],
            ['New Panay', 'ESP-NEW-PANAY', 4068],
            ['Numo', 'ESP-NUMO', 2526],
            ['Paitan', 'ESP-PAITAN', 3963],
            ['Pamantingan', 'ESP-PAMANTINGAN', 4901],
            ['Poblacion', 'ESP-POBLACION', 8078],
            ['Sagasa', 'ESP-SAGASA', 4702],
            ['Salabaca', 'ESP-SALABACA', 4058],
            ['Saliao', 'ESP-SALIAO', 6153],
            ['Salumping', 'ESP-SALUMPING', 9374],
            ['Villamor', 'ESP-VILLAMOR', 3849],
        ],
    ];

    public function run(): void
    {
        foreach (self::MUNICIPALITIES as $lgu => $barangays) {
            foreach ($barangays as [$name, $code, $population]) {
                Barangay::updateOrCreate(
                    ['code' => $code],
                    ['name' => $name, 'lgu_name' => $lgu, 'population' => $population],
                );
            }
        }
    }
}
