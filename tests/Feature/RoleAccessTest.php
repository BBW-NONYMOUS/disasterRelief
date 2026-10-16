<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Barangay;
use App\Models\Purok;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** S1: the route groups enforce the coarse role boundary before any controller runs. */
class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public static function matrix(): array
    {
        return [
            'resident cannot manage users' => ['resident', '/users', 403],
            'resident cannot open inventory' => ['resident', '/inventory', 403],
            'resident cannot open distributions' => ['resident', '/distributions', 403],
            'resident cannot open households' => ['resident', '/households', 403],
            'resident cannot open reports' => ['resident', '/reports', 403],
            'resident cannot open donations' => ['resident', '/donations', 403],
            'resident can file reports' => ['resident', '/disaster-reports/create', 200],
            'resident can evaluate' => ['resident', '/evaluations/create', 200],
            'donor cannot open households' => ['donor', '/households', 403],
            'donor cannot open inventory' => ['donor', '/inventory', 403],
            'donor can view open needs' => ['donor', '/assistance-requests', 200],
            'donor can open donations' => ['donor', '/donations', 200],
            'purok president cannot open inventory' => ['purok_president', '/inventory', 403],
            'purok president cannot open users' => ['purok_president', '/users', 403],
            'purok president can open households' => ['purok_president', '/households', 200],
            'purok president can open distributions' => ['purok_president', '/distributions', 200],
            'admin cannot manage barangays' => ['admin', '/barangays', 403],
            'admin cannot read evaluation results' => ['admin', '/evaluations', 403],
            'admin cannot read audit log' => ['admin', '/activity-logs', 403],
            'admin can open inventory' => ['admin', '/inventory', 200],
            'admin can open users' => ['admin', '/users', 200],
            'admin can open reports' => ['admin', '/reports', 200],
            'super admin manages barangays' => ['super_admin', '/barangays', 200],
            'super admin manages puroks' => ['super_admin', '/puroks', 200],
            'super admin reads evaluations' => ['super_admin', '/evaluations', 200],
            'super admin reads audit log' => ['super_admin', '/activity-logs', 200],
        ];
    }

    #[DataProvider('matrix')]
    public function test_route_access_by_role(string $role, string $uri, int $status): void
    {
        $barangay = Barangay::factory()->create();
        $purok = Purok::factory()->create(['barangay_id' => $barangay->id]);
        $scoped = ! in_array($role, ['donor', 'super_admin'], true);

        $user = User::factory()->create([
            'role' => UserRole::from($role),
            'barangay_id' => $scoped ? $barangay->id : null,
            'purok_id' => $scoped ? $purok->id : null,
        ]);

        $this->actingAs($user)->get($uri)->assertStatus($status);
    }

    public function test_admin_cannot_open_a_household_in_another_barangay(): void
    {
        ['household' => $household] = $this->community();
        $otherAdmin = User::factory()->admin()->create(['barangay_id' => Barangay::factory()->create()->id]);

        $this->actingAs($otherAdmin)->get("/households/{$household->id}")->assertForbidden();
        $this->actingAs($otherAdmin)->patch("/households/{$household->id}", ['head_name' => 'Changed'])->assertForbidden();
        $this->assertNotSame('Changed', $household->fresh()->head_name);
    }
}
