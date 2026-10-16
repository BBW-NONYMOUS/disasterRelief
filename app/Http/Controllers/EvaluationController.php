<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Evaluation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** System evaluation (objective 11): Likert survey for every role, summary for the Super Admin. */
class EvaluationController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('Evaluations/Create', [
            'criteria' => $this->criteria(),
            'scale' => Evaluation::SCALE,
            'existing' => Evaluation::where('user_id', $request->user()->id)
                ->get(['criterion', 'score', 'comment'])
                ->keyBy('criterion'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $rules = [];
        foreach (array_keys(Evaluation::CRITERIA) as $key) {
            $rules["scores.{$key}"] = 'required|integer|between:1,5';
            $rules["comments.{$key}"] = 'nullable|string|max:1000';
        }

        $data = $request->validate($rules, [
            'scores.*.required' => 'Please rate this criterion.',
        ]);

        $user = $request->user();

        DB::transaction(function () use ($data, $user) {
            foreach (array_keys(Evaluation::CRITERIA) as $key) {
                Evaluation::updateOrCreate(
                    ['user_id' => $user->id, 'criterion' => $key],
                    [
                        'role' => $user->role->value,
                        'score' => $data['scores'][$key],
                        'comment' => $data['comments'][$key] ?? null,
                    ],
                );
            }
        });

        return redirect()->route('dashboard')->with('success', 'Thank you for evaluating ReliefNet.');
    }

    public function index(): Response
    {
        $rows = Evaluation::query()
            ->select('criterion', 'role', 'score', DB::raw('count(*) as n'))
            ->groupBy('criterion', 'role', 'score')
            ->get();

        $summary = collect(Evaluation::CRITERIA)->map(function ($meta, $key) use ($rows) {
            $forCriterion = $rows->where('criterion', $key);
            $n = (int) $forCriterion->sum('n');
            $mean = $n ? round($forCriterion->sum(fn ($r) => $r->score * $r->n) / $n, 2) : null;

            return [
                'key' => $key,
                'label' => $meta['label'],
                'statement' => $meta['statement'],
                'n' => $n,
                'mean' => $mean,
                'interpretation' => Evaluation::interpret($mean),
                'distribution' => collect(range(5, 1))->mapWithKeys(fn ($s) => [$s => (int) $forCriterion->where('score', $s)->sum('n')]),
                'by_role' => collect(UserRole::cases())->mapWithKeys(function (UserRole $role) use ($forCriterion) {
                    $group = $forCriterion->where('role', $role->value);
                    $n = (int) $group->sum('n');

                    return [$role->value => $n ? round($group->sum(fn ($r) => $r->score * $r->n) / $n, 2) : null];
                }),
            ];
        })->values();

        $overall = $summary->whereNotNull('mean')->avg('mean');

        return Inertia::render('Evaluations/Index', [
            'summary' => $summary,
            'overall' => [
                'mean' => $overall !== null ? round($overall, 2) : null,
                'interpretation' => Evaluation::interpret($overall),
                'respondents' => Evaluation::distinct()->count('user_id'),
            ],
            'roles' => UserRole::options(UserRole::cases()),
            'comments' => Evaluation::whereNotNull('comment')->where('comment', '!=', '')
                ->latest('updated_at')->limit(30)
                ->get(['id', 'role', 'criterion', 'score', 'comment', 'updated_at']),
        ]);
    }

    /** Raw responses for statistical treatment; respondents are identified by id only. */
    public function export(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['respondent_id', 'role', 'criterion', 'score', 'comment', 'submitted_at']);

            Evaluation::orderBy('user_id')->orderBy('criterion')->chunk(500, function ($chunk) use ($out) {
                foreach ($chunk as $row) {
                    fputcsv($out, [
                        $row->user_id, $row->role, $row->criterion, $row->score,
                        $row->comment, $row->updated_at?->toDateTimeString(),
                    ]);
                }
            });

            fclose($out);
        }, 'reliefnet-evaluations-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv']);
    }

    private function criteria(): array
    {
        return collect(Evaluation::CRITERIA)
            ->map(fn ($meta, $key) => ['key' => $key, ...$meta])
            ->values()
            ->all();
    }
}
