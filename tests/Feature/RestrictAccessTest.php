<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\RoleAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Super Admin "restrict access": account suspension and the role privilege matrix. */
class RestrictAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_restricted_user_cannot_log_in_even_with_the_right_password(): void
    {
        $super = User::factory()->superAdmin()->create();
        ['resident' => $resident] = $this->community();

        $this->actingAs($super)->post("/users/{$resident->id}/restrict", ['reason' => 'Filed false reports.'])
            ->assertSessionHas('success');

        $resident->refresh();
        $this->assertSame('inactive', $resident->status);
        $this->assertSame($super->id, $resident->suspended_by);
        $this->assertSame('Filed false reports.', $resident->suspension_reason);

        auth()->logout();
        $this->post('/login', ['email' => $resident->email, 'password' => 'password'])
            ->assertSessionHasErrors(['email' => 'Your access to ReliefNet has been restricted. Please contact the system administrator.']);
        $this->assertGuest();
    }

    public function test_restriction_ends_an_open_session_on_the_next_request(): void
    {
        ['resident' => $resident] = $this->community();
        $this->actingAs($resident)->get('/dashboard')->assertOk();

        $resident->forceFill(['status' => 'inactive', 'suspended_at' => now()])->save();

        $this->get('/dashboard')->assertRedirect('/login')->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_restoring_access_lets_the_user_log_in_again(): void
    {
        $super = User::factory()->superAdmin()->create();
        ['resident' => $resident] = $this->community();
        $this->actingAs($super)->post("/users/{$resident->id}/restrict", ['reason' => 'Temporary hold.']);

        $this->actingAs($super)->post("/users/{$resident->id}/restore")->assertSessionHas('success');
        $this->assertSame('active', $resident->fresh()->status);
        $this->assertNull($resident->fresh()->suspended_at);

        auth()->logout();
        $this->post('/login', ['email' => $resident->email, 'password' => 'password'])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($resident);
    }

    public function test_only_the_super_admin_restricts_and_never_themselves(): void
    {
        $super = User::factory()->superAdmin()->create();
        ['admin' => $admin, 'resident' => $resident] = $this->community();

        $this->actingAs($admin)->post("/users/{$resident->id}/restrict", ['reason' => 'x'])->assertForbidden();
        $this->actingAs($super)->post("/users/{$super->id}/restrict", ['reason' => 'x'])->assertForbidden();
        $this->actingAs($super)->post("/users/{$resident->id}/restrict")->assertSessionHasErrors('reason');

        $this->assertSame('active', $resident->fresh()->status);
        $this->assertSame('active', $super->fresh()->status);
    }

    public function test_admins_can_no_longer_change_account_status_through_edit(): void
    {
        ['admin' => $admin, 'resident' => $resident] = $this->community();

        $this->actingAs($admin)->patch("/users/{$resident->id}", ['name' => $resident->name, 'status' => 'inactive']);

        $this->assertSame('active', $resident->fresh()->status);
    }

    public function test_super_admin_restricts_a_module_for_a_role(): void
    {
        $super = User::factory()->superAdmin()->create();
        ['admin' => $admin] = $this->community();

        $this->actingAs($admin)->get('/inventory')->assertOk();

        $this->actingAs($super)->put('/access-control', ['role' => 'admin', 'module' => 'inventory', 'level' => 'none'])
            ->assertSessionHas('success');

        $this->actingAs($admin)->get('/inventory')->assertForbidden();
        $this->actingAs($admin)->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->where('auth.user.modules', fn ($modules) => ! collect($modules)->contains('inventory')));

        $this->assertTrue(ActivityLog::where('event', 'access_changed')->where('causer_id', $super->id)->exists());

        $this->actingAs($super)->put('/access-control', ['role' => 'admin', 'module' => 'inventory', 'level' => 'full']);
        $this->actingAs($admin)->get('/inventory')->assertOk();
    }

    public function test_restricting_a_module_only_affects_that_role(): void
    {
        $super = User::factory()->superAdmin()->create();
        ['resident' => $resident, 'president' => $president] = $this->community();

        $this->actingAs($super)->put('/access-control', ['role' => 'resident', 'module' => 'disaster_reports', 'level' => 'none']);

        $this->actingAs($resident)->get('/disaster-reports')->assertForbidden();
        $this->actingAs($resident)->get('/disaster-reports/create')->assertForbidden();
        $this->actingAs($president)->get('/disaster-reports')->assertOk();
    }

    public function test_matrix_cannot_grant_new_modules_or_touch_the_super_admin(): void
    {
        $super = User::factory()->superAdmin()->create();

        $this->actingAs($super)->put('/access-control', ['role' => 'resident', 'module' => 'inventory', 'level' => 'full'])
            ->assertSessionHasErrors('module');
        $this->actingAs($super)->put('/access-control', ['role' => 'super_admin', 'module' => 'users', 'level' => 'none'])
            ->assertSessionHasErrors('role');

        $this->assertFalse(app(RoleAccess::class)->allows(UserRole::Resident, 'inventory'));
        $this->assertTrue(app(RoleAccess::class)->allows(UserRole::SuperAdmin, 'users'));
    }

    public function test_view_only_lets_a_role_read_but_not_change_a_module(): void
    {
        $super = User::factory()->superAdmin()->create();
        ['admin' => $admin, 'barangay' => $barangay] = $this->community();
        $item = \App\Models\InventoryItem::factory()->create(['barangay_id' => $barangay->id, 'quantity' => 40]);

        $this->actingAs($super)->put('/access-control', ['role' => 'admin', 'module' => 'inventory', 'level' => 'view'])
            ->assertSessionHas('success');

        // Reading still works…
        $this->actingAs($admin)->get('/inventory')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.access.inventory', 'view')
                ->where('auth.user.modules', fn ($modules) => collect($modules)->contains('inventory')));
        $this->actingAs($admin)->get("/inventory/{$item->id}")->assertOk();

        // …but forms and every change are blocked.
        $this->actingAs($admin)->get('/inventory/create')->assertForbidden();
        $this->actingAs($admin)->get("/inventory/{$item->id}/edit")->assertForbidden();
        $this->actingAs($admin)->post('/inventory', [
            'category' => 'Food', 'name' => 'Rice', 'quantity' => 5, 'unit' => 'kg',
        ])->assertForbidden();
        $this->actingAs($admin)->patch("/inventory/{$item->id}", ['quantity' => 0])->assertForbidden();
        $this->actingAs($admin)->delete("/inventory/{$item->id}")->assertForbidden();
        $this->assertSame(40, $item->fresh()->quantity);
    }

    public function test_view_only_hides_workflow_actions_on_records(): void
    {
        $super = User::factory()->superAdmin()->create();
        ['barangay' => $barangay, 'purok' => $purok, 'president' => $president, 'resident' => $resident] = $this->community();
        $report = \App\Models\DisasterReport::factory()->create([
            'reporter_id' => $resident->id, 'barangay_id' => $barangay->id, 'purok_id' => $purok->id,
        ]);

        $this->actingAs($president)->get("/disaster-reports/{$report->id}")
            ->assertInertia(fn (Assert $page) => $page->where('can.verify', true));

        $this->actingAs($super)->put('/access-control', ['role' => 'purok_president', 'module' => 'disaster_reports', 'level' => 'view']);

        $this->actingAs($president)->get("/disaster-reports/{$report->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('can.verify', false)->where('can.reject', false));
        $this->actingAs($president)->post("/disaster-reports/{$report->id}/verify")->assertForbidden();
        $this->assertSame('reported', $report->fresh()->status->value);
    }

    public function test_evaluations_only_offer_full_or_no_access(): void
    {
        $super = User::factory()->superAdmin()->create();

        $this->actingAs($super)->put('/access-control', ['role' => 'resident', 'module' => 'evaluations', 'level' => 'view'])
            ->assertSessionHasErrors('level');
        $this->actingAs($super)->put('/access-control', ['role' => 'resident', 'module' => 'evaluations', 'level' => 'none'])
            ->assertSessionHas('success');

        $this->assertSame('none', app(RoleAccess::class)->levelFor(UserRole::Resident, 'evaluations'));
    }

    public function test_access_control_screen_lists_all_five_roles_and_is_super_admin_only(): void
    {
        $super = User::factory()->superAdmin()->create();
        ['admin' => $admin] = $this->community();

        $this->actingAs($admin)->get('/access-control')->assertForbidden();

        $this->actingAs($super)->get('/access-control')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('AccessControl/Index')
                ->has('matrix', 5)
                ->where('matrix.0.role', 'super_admin')
                ->where('matrix.0.locked', true)
                ->where('matrix.3.role', 'resident')
                ->where('matrix.3.modules.inventory.applicable', false)
                ->where('matrix.3.modules.disaster_reports.level', 'full')
                ->where('levels.1.label', 'View Only'));
    }

    public function test_user_list_has_tabs_for_the_five_roles(): void
    {
        $super = User::factory()->superAdmin()->create();
        $this->community();

        $this->actingAs($super)->get('/users?role=purok_president')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('roles', 5)
                ->where('filters.role', 'purok_president')
                ->has('users.data', 1)
                ->where('users.data.0.role', 'purok_president'));
    }
}
