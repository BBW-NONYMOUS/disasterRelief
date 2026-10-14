<?php

namespace App\Http\Controllers;

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

        if ($user->barangay_id) {
            $query->where('barangay_id', $user->barangay_id);
        }

        return Inertia::render('Reports/Index', [
            'reports' => $query->latest()->paginate(15),
            'kinds' => ['incident', 'received', 'distribution'],
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'kind' => 'required|in:incident,received,distribution',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $user = $request->user();
        $filePath = $this->pdfService->generate(
            $data['kind'],
            $user->barangay_id,
            $data['date_from'] ?? null,
            $data['date_to'] ?? null
        );

        $report = Report::create([
            'kind' => $data['kind'],
            'barangay_id' => $user->barangay_id,
            'generated_by' => $user->id,
            'file_path' => $filePath,
        ]);

        return redirect()->route('reports.index')->with('success', 'Report generated.');
    }

    public function download(Report $report): StreamedResponse
    {
        return Storage::disk('local')->download($report->file_path);
    }
}
