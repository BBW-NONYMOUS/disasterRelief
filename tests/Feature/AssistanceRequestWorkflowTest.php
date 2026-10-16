<?php

namespace Tests\Feature;

use App\Enums\AssistanceRequestStatus;
use App\Enums\RequestPriority;
use App\Models\AssistanceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Objectives 2.2, 3.1, 5.2 (G1, G2): structured requests, priority queue, anonymous donor view. */
class AssistanceRequestWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_request_is_verified_approved_and_shown_to_donors_without_personal_data(): void
    {
        ['barangay' => $barangay, 'purok' => $purok, 'admin' => $admin, 'president' => $president, 'resident' => $resident, 'household' => $household] = $this->community();

        $this->actingAs($resident)->post('/assistance-requests', [
            'barangay_id' => $barangay->id,
            'purok_id' => $purok->id,
            'type' => 'food',
            'quantity' => 5,
            'goods_needed' => 'Rice for my family of five',
            'urgency' => 'urgent',
        ])->assertRedirect('/assistance-requests');

        $request = AssistanceRequest::firstOrFail();
        $this->assertSame(AssistanceRequestStatus::Pending, $request->status);
        $this->assertSame($barangay->id, $request->barangay_id);

        // Officials were alerted.
        $this->assertSame(1, $president->notifications()->count());
        $this->assertSame(1, $admin->notifications()->count());

        // The admin cannot approve before purok verification.
        $this->actingAs($admin)->post("/assistance-requests/{$request->id}/approve", ['priority' => 'high'])
            ->assertSessionHas('error');

        $this->actingAs($president)->post("/assistance-requests/{$request->id}/verify", [
            'priority' => 'high',
            'household_id' => $household->id,
        ])->assertSessionHas('success');

        $request->refresh();
        $this->assertSame(AssistanceRequestStatus::Verified, $request->status);
        $this->assertSame(RequestPriority::High, $request->priority);
        $this->assertSame($household->id, $request->household_id);

        // Admin finalises the priority.
        $this->actingAs($admin)->post("/assistance-requests/{$request->id}/approve", ['priority' => 'critical'])
            ->assertSessionHas('success');

        $request->refresh();
        $this->assertSame(AssistanceRequestStatus::Approved, $request->status);
        $this->assertSame(RequestPriority::Critical, $request->priority);
        $this->assertSame($admin->id, $request->approved_by);

        $donor = User::factory()->donor()->create();

        $this->actingAs($donor)->get('/assistance-requests')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('AssistanceRequests/Index')
                ->where('requests.data.0.type', 'food')
                ->where('requests.data.0.quantity', 5)
                ->missing('requests.data.0.requester')
                ->missing('requests.data.0.requester_id')
                ->missing('requests.data.0.goods_needed')
                ->missing('requests.data.0.household')
                ->where('needs.0.total_quantity', 5)
                ->where('needs.0.priority', 'critical'));

        $this->actingAs($donor)->get("/assistance-requests/{$request->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('donor_view', true)
                ->missing('request.requester')
                ->missing('request.household'));
    }

    public function test_donors_cannot_open_requests_that_are_not_approved(): void
    {
        ['purok' => $purok] = $this->community();
        $pending = AssistanceRequest::factory()->create(['purok_id' => $purok->id]);

        $this->actingAs(User::factory()->donor()->create())
            ->get("/assistance-requests/{$pending->id}")
            ->assertForbidden();
    }

    public function test_admin_queue_is_sorted_by_priority_then_age(): void
    {
        ['purok' => $purok, 'admin' => $admin] = $this->community();
        $make = fn (array $attributes) => AssistanceRequest::factory()->create([
            'purok_id' => $purok->id, 'barangay_id' => $purok->barangay_id, ...$attributes,
        ]);

        $fulfilled = $make(['priority' => 'critical', 'status' => 'fulfilled', 'created_at' => now()->subDays(9)]);
        $normalOld = $make(['priority' => 'normal', 'status' => 'verified', 'created_at' => now()->subDays(5)]);
        $critical = $make(['priority' => 'critical', 'status' => 'verified', 'created_at' => now()->subDay()]);
        // Untagged yet, but the resident marked it urgent: ranks as high.
        $urgentPending = $make(['priority' => null, 'urgency' => 'urgent', 'status' => 'pending', 'created_at' => now()->subDays(2)]);
        $highOld = $make(['priority' => 'high', 'status' => 'approved', 'created_at' => now()->subDays(4)]);

        $this->actingAs($admin)->get('/assistance-requests')
            ->assertInertia(fn (Assert $page) => $page
                ->where('requests.data.0.id', $critical->id)
                ->where('requests.data.1.id', $highOld->id)
                ->where('requests.data.2.id', $urgentPending->id)
                ->where('requests.data.3.id', $normalOld->id)
                ->where('requests.data.4.id', $fulfilled->id));
    }

    public function test_rejection_needs_remarks_and_notifies_the_resident(): void
    {
        ['purok' => $purok, 'president' => $president, 'resident' => $resident] = $this->community();
        $request = AssistanceRequest::factory()->create(['purok_id' => $purok->id, 'requester_id' => $resident->id]);

        $this->actingAs($president)->post("/assistance-requests/{$request->id}/reject")->assertSessionHasErrors('remarks');
        $this->actingAs($president)->post("/assistance-requests/{$request->id}/reject", ['remarks' => 'Already served by DSWD.'])
            ->assertSessionHas('success');

        $this->assertSame(AssistanceRequestStatus::Rejected, $request->fresh()->status);
        $this->assertSame('Already served by DSWD.', $request->fresh()->remarks);
        $this->assertSame(1, $resident->notifications()->count());
    }
}
