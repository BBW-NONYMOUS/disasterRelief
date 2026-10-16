<?php

namespace Tests\Feature;

use App\Enums\AssistanceRequestStatus;
use App\Enums\ReportStatus;
use App\Models\AssistanceRequest;
use App\Models\Barangay;
use App\Models\DisasterReport;
use App\Models\Distribution;
use App\Models\Donation;
use App\Models\Household;
use App\Models\InventoryItem;
use App\Models\Purok;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Every page each seeded role can reach renders without a server error. */
class PageSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_role_can_open_its_pages(): void
    {
        // The demo world from `php artisan db:seed` (also proves the seeder still works).
        $this->seed(DatabaseSeeder::class);

        $poblacion = Barangay::where('code', 'BRG-001')->firstOrFail();
        $purok = Purok::where('barangay_id', $poblacion->id)->firstOrFail();
        $resident = User::where('email', 'resident@reliefnet.test')->firstOrFail();
        $household = Household::firstOrFail();

        $report = DisasterReport::factory()->create([
            'reporter_id' => $resident->id, 'barangay_id' => $poblacion->id, 'purok_id' => $purok->id,
            'status' => ReportStatus::Confirmed, 'latitude' => 12.5, 'longitude' => 121.5,
        ]);
        $report->history()->create(['status' => ReportStatus::Reported, 'actor_id' => $resident->id]);
        $request = AssistanceRequest::factory()->create([
            'requester_id' => $resident->id, 'purok_id' => $purok->id, 'barangay_id' => $poblacion->id,
            'status' => AssistanceRequestStatus::Approved, 'priority' => 'high',
        ]);
        $donation = Donation::factory()->goods()->create([
            'donor_id' => User::where('email', 'donor@reliefnet.test')->value('id'), 'barangay_id' => $poblacion->id,
        ]);
        $donation->donationItems()->create(['name' => 'Rice', 'category' => 'Food', 'unit' => 'kg', 'quantity' => 5]);
        $stock = InventoryItem::where('barangay_id', $poblacion->id)->firstOrFail();
        $distribution = Distribution::create([
            'barangay_id' => $poblacion->id, 'household_id' => $household->id, 'admin_id' => User::where('email', 'admin@reliefnet.test')->value('id'),
            'items' => 'Rice (1 kg)', 'quantity' => 1, 'status' => 'waiting',
        ]);

        $pages = [
            'superadmin@reliefnet.test' => [
                '/dashboard', '/disaster-reports', "/disaster-reports/{$report->id}", '/assistance-requests', "/assistance-requests/{$request->id}",
                '/donations', "/donations/{$donation->id}", '/distributions', "/distributions/{$distribution->id}", '/distributions/create',
                '/inventory', '/inventory/create', "/inventory/{$stock->id}", "/inventory/{$stock->id}/edit", '/households', '/households/create',
                '/reports', '/users', '/users/create', '/barangays', '/barangays/create', "/barangays/{$poblacion->id}/edit",
                '/puroks', '/puroks/create', "/puroks/{$purok->id}/edit", '/evaluations', '/activity-logs',
                '/access-control', '/users?role=admin', '/users?access=restricted', "/users/{$resident->id}",
            ],
            'admin@reliefnet.test' => [
                '/dashboard', '/disaster-reports', "/disaster-reports/{$report->id}", "/disaster-reports/{$report->id}/edit",
                '/assistance-requests', "/assistance-requests/{$request->id}", '/donations', "/donations/{$donation->id}",
                '/distributions', '/distributions/create', "/distributions/create?assistance_request_id={$request->id}", "/distributions/{$distribution->id}",
                '/inventory', '/inventory/create', "/inventory/{$stock->id}", '/households', "/households/{$household->id}", "/households/{$household->id}/edit",
                '/reports', '/users', '/users/create', "/users/{$resident->id}/edit", '/evaluations/create',
            ],
            'purok@reliefnet.test' => [
                '/dashboard', '/disaster-reports', "/disaster-reports/{$report->id}", '/assistance-requests', "/assistance-requests/{$request->id}",
                '/households', '/households/create', "/households/{$household->id}", '/distributions', '/distributions/create', '/evaluations/create',
            ],
            'resident@reliefnet.test' => [
                '/dashboard', '/disaster-reports', '/disaster-reports/create', "/disaster-reports/{$report->id}",
                '/assistance-requests', '/assistance-requests/create', "/assistance-requests/{$request->id}", '/evaluations/create', '/profile',
            ],
            'donor@reliefnet.test' => [
                '/dashboard', '/disaster-reports', "/disaster-reports/{$report->id}", '/assistance-requests', "/assistance-requests/{$request->id}",
                '/donations', '/donations/create', "/donations/{$donation->id}", '/evaluations/create',
            ],
        ];

        foreach ($pages as $email => $uris) {
            $user = User::where('email', $email)->firstOrFail();
            foreach ($uris as $uri) {
                $response = $this->actingAs($user)->get($uri);
                $this->assertSame(200, $response->getStatusCode(), "{$email} GET {$uri} returned {$response->getStatusCode()}");
            }
        }
    }
}
