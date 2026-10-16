<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Barangay;
use App\Models\Report;
use App\Services\ReportPdfService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(private ReportPdfService $pdfService) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = Report::with(['barangay', 'generatedBy']);

        if ($user->role !== UserRole::SuperAdmin) {
            $query->where('barangay_id', $user->barangay_id);
        }

        $reports = $query->latest()->paginate(15);
        $names = Barangay::pluck('name', 'id');
        $reports->getCollection()->transform(function (Report $report) use ($names) {
            $ids = $report->meta['barangay_ids'] ?? [];
            $report->setAttribute('scope_label', $ids
                ? collect($ids)->map(fn ($id) => $names[$id] ?? "#{$id}")->implode(', ')
                : ($report->barangay?->name ?? 'All barangays'));

            return $report;
        });

        return Inertia::render('Reports/Index', [
            'reports' => $reports,
            'kinds' => ['incident', 'received', 'distribution'],
            'barangays' => $user->role === UserRole::SuperAdmin ? Barangay::orderBy('name')->get(['id', 'name']) : [],
            'signatory_defaults' => [
                'prepared_by_name' => $user->name,
                'prepared_by_position' => $user->role->label(),
            ],
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'kind' => 'required|in:incident,received,distribution',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'barangay_ids' => 'nullable|array',
            'barangay_ids.*' => 'integer|exists:barangays,id',
            'prepared_by_name' => 'nullable|string|max:255',
            'prepared_by_position' => 'nullable|string|max:255',
            'noted_by_name' => 'nullable|string|max:255',
            'noted_by_position' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        // Admins always report on their own barangay; the Super Admin picks any
        // set (none selected = consolidated across every barangay).
        $barangayIds = $user->role === UserRole::SuperAdmin
            ? array_values(array_unique(array_map('intval', $data['barangay_ids'] ?? [])))
            : [$user->barangay_id];

        $signatories = array_filter([
            'prepared_by_name' => $data['prepared_by_name'] ?? null,
            'prepared_by_position' => $data['prepared_by_position'] ?? null,
            'noted_by_name' => $data['noted_by_name'] ?? null,
            'noted_by_position' => $data['noted_by_position'] ?? null,
        ]);

        $filePath = $this->pdfService->generate(
            $data['kind'],
            $barangayIds,
            $data['date_from'] ?? null,
            $data['date_to'] ?? null,
            $signatories,
        );

        Report::create([
            'kind' => $data['kind'],
            'barangay_id' => count($barangayIds) === 1 ? $barangayIds[0] : null,
            'generated_by' => $user->id,
            'file_path' => $filePath,
            'meta' => [
                'barangay_ids' => $barangayIds,
                'date_from' => $data['date_from'] ?? null,
                'date_to' => $data['date_to'] ?? null,
                'signatories' => $signatories,
            ],
        ]);

        return redirect()->route('reports.index')->with('success', 'Report generated.');
    }

    public function download(Request $request, Report $report): StreamedResponse
    {
        $user = $request->user();
        abort_unless(
            $user->role === UserRole::SuperAdmin || ($report->barangay_id && (int) $report->barangay_id === (int) $user->barangay_id),
            403
        );

        return Storage::disk('local')->download($report->file_path);
    }
}
