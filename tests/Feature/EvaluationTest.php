<?php

namespace Tests\Feature;

use App\Models\Evaluation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Objective 11 (G10): Likert evaluation, summary and CSV export. */
class EvaluationTest extends TestCase
{
    use RefreshDatabase;

    private function answers(int $score): array
    {
        $keys = array_keys(Evaluation::CRITERIA);

        return [
            'scores' => array_fill_keys($keys, $score),
            'comments' => ['usability' => 'Easy to use on my phone.'],
        ];
    }

    public function test_users_submit_and_update_their_evaluation(): void
    {
        $resident = User::factory()->create();

        $this->actingAs($resident)->post('/evaluations', $this->answers(4))->assertRedirect('/dashboard');
        $this->actingAs($resident)->post('/evaluations', $this->answers(5))->assertRedirect('/dashboard');

        $this->assertSame(count(Evaluation::CRITERIA), Evaluation::count());
        $this->assertSame([5], Evaluation::pluck('score')->unique()->values()->all());
        $this->assertSame('resident', Evaluation::first()->role);
    }

    public function test_every_criterion_must_be_rated(): void
    {
        $answers = $this->answers(4);
        unset($answers['scores']['security']);

        $this->actingAs(User::factory()->create())->post('/evaluations', $answers)
            ->assertSessionHasErrors('scores.security');
        $this->assertSame(0, Evaluation::count());
    }

    public function test_super_admin_sees_weighted_means_and_can_export(): void
    {
        $this->actingAs(User::factory()->create())->post('/evaluations', $this->answers(5));
        $this->actingAs(User::factory()->donor()->create())->post('/evaluations', $this->answers(4));

        $super = User::factory()->superAdmin()->create();

        $this->actingAs($super)->get('/evaluations')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Evaluations/Index')
                ->where('overall.respondents', 2)
                ->where('summary.0.key', 'functionality')
                ->where('summary.0.n', 2)
                ->where('summary.0.mean', 4.5)
                ->where('summary.0.interpretation', 'Strongly Agree')
                ->where('summary.0.by_role.donor', 4)
                ->where('summary.0.by_role.resident', 5));

        $csv = $this->actingAs($super)->get('/evaluations/export')->assertOk()->streamedContent();
        $this->assertStringStartsWith('respondent_id,role,criterion,score,comment,submitted_at', $csv);
        $this->assertSame(1 + 2 * count(Evaluation::CRITERIA), substr_count(trim($csv), "\n") + 1);
    }
}
