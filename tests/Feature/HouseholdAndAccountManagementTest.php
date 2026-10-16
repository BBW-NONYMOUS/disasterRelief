<?php

namespace Tests\Feature;

use App\Enums\HouseholdStatus;
use App\Enums\UserRole;
use App\Models\Barangay;
use App\Models\Purok;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** G4, G6, G11, S8. */
class HouseholdAndAccountManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_purok_president_verifies_households_in_their_purok_only(): void
    {
        ['barangay' => $barangay, 'president' => $president, 'admin' => $admin, 'household' => $household] = $this->community();
        $otherPresident = User::factory()->purokPresident()->create([
            'barangay_id' => $barangay->id,
            'purok_id' => Purok::factory()->create(['barangay_id' => $barangay->id])->id,
        ]);

        $this->actingAs($otherPresident)->post("/households/{$household->id}/verify")->assertForbidden();
        $this->actingAs($admin)->post("/households/{$household->id}/verify")->assertForbidden();

        $this->actingAs($president)->post("/households/{$household->id}/verify")->assertSessionHas('success');

        $household->refresh();
        $this->assertNotNull($household->verified_at);
        $this->assertSame($president->id, $household->verified_by);
    }

    public function test_household_status_uses_waiting_ongoing_completed(): void
    {
        ['president' => $president, 'household' => $household] = $this->community();

        $this->actingAs($president)->patch("/households/{$household->id}", ['status' => 'assistance_completed'])
            ->assertSessionHasErrors('status');

        $this->actingAs($president)->patch("/households/{$household->id}", ['status' => 'completed'])
            ->assertRedirect('/households');
        $this->assertSame(HouseholdStatus::Completed, $household->fresh()->status);
    }

    public function test_president_cannot_add_households_to_another_purok(): void
    {
        ['barangay' => $barangay, 'president' => $president] = $this->community();
        $otherPurok = Purok::factory()->create(['barangay_id' => $barangay->id]);

        $this->actingAs($president)->post('/households', [
            'purok_id' => $otherPurok->id, 'head_name' => 'Ana Cruz', 'address' => '1 Mabini St.', 'members_count' => 3,
        ])->assertSessionHasErrors('purok_id');
    }

    public function test_admin_cannot_change_own_role_or_hand_out_admin_roles(): void
    {
        ['admin' => $admin, 'resident' => $resident] = $this->community();

        $this->actingAs($admin)->patch("/users/{$admin->id}", ['role' => 'super_admin'])->assertSessionHasErrors('role');
        $this->assertSame(UserRole::Admin, $admin->fresh()->role);

        $this->actingAs($admin)->patch("/users/{$resident->id}", ['role' => 'admin'])->assertSessionHasErrors('role');
        $this->assertSame(UserRole::Resident, $resident->fresh()->role);

        $this->actingAs($admin)->patch("/users/{$resident->id}", ['role' => 'purok_president'])->assertRedirect('/users');
        $this->assertSame(UserRole::PurokPresident, $resident->fresh()->role);
    }

    public function test_admin_cannot_manage_accounts_in_another_barangay(): void
    {
        ['admin' => $admin] = $this->community();
        $outsider = User::factory()->create(['barangay_id' => Barangay::factory()->create()->id]);

        $this->actingAs($admin)->get("/users/{$outsider->id}/edit")->assertForbidden();
        $this->actingAs($admin)->patch("/users/{$outsider->id}", ['name' => 'Changed'])->assertForbidden();
        $this->assertNotSame('Changed', $outsider->fresh()->name);
    }

    public function test_super_admin_can_promote_and_cannot_demote_themselves(): void
    {
        ['resident' => $resident] = $this->community();
        $super = User::factory()->superAdmin()->create();

        $this->actingAs($super)->patch("/users/{$resident->id}", ['role' => 'admin'])->assertRedirect('/users');
        $this->assertSame(UserRole::Admin, $resident->fresh()->role);

        $this->actingAs($super)->patch("/users/{$super->id}", ['role' => 'resident'])->assertSessionHasErrors('role');
    }

    public function test_assigning_a_purok_president_keeps_user_and_purok_in_sync(): void
    {
        $super = User::factory()->superAdmin()->create();
        $barangay = Barangay::factory()->create();
        $president = User::factory()->purokPresident()->create();

        $this->actingAs($super)->post('/puroks', [
            'barangay_id' => $barangay->id, 'name' => 'Purok Sampaguita', 'president_id' => $president->id,
        ])->assertRedirect();

        $first = Purok::where('name', 'Purok Sampaguita')->firstOrFail();
        $this->assertSame($president->id, $first->president_id);
        $this->assertSame($first->id, $president->fresh()->purok_id);
        $this->assertSame($barangay->id, $president->fresh()->barangay_id);

        // Moving them to a second purok frees the first.
        $this->actingAs($super)->post('/puroks', [
            'barangay_id' => $barangay->id, 'name' => 'Purok Narra', 'president_id' => $president->id,
        ]);
        $second = Purok::where('name', 'Purok Narra')->firstOrFail();

        $this->assertNull($first->fresh()->president_id);
        $this->assertSame($second->id, $president->fresh()->purok_id);
    }

    public function test_barangays_with_records_cannot_be_deleted(): void
    {
        ['barangay' => $barangay] = $this->community();
        $super = User::factory()->superAdmin()->create();
        $empty = Barangay::factory()->create();

        $this->actingAs($super)->delete("/barangays/{$barangay->id}")->assertSessionHas('error');
        $this->assertModelExists($barangay);

        $this->actingAs($super)->delete("/barangays/{$empty->id}")->assertRedirect('/barangays');
        $this->assertModelMissing($empty);
    }
}
