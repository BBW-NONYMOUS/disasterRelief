<?php

namespace App\Services;

use App\Models\DisasterReport;
use App\Models\Distribution;
use App\Models\Donation;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ReportPdfService
{
    public function generate(string $kind, ?int $barangayId, ?string $from, ?string $to): string
    {
        $data = match ($kind) {
            'incident' => $this->incidentData($barangayId, $from, $to),
            'received' => $this->receivedData($barangayId, $from, $to),
            'distribution' => $this->distributionData($barangayId, $from, $to),
            default => throw new \InvalidArgumentException("Unknown report kind: {$kind}"),
        };

        $pdf = Pdf::loadView("reports.{$kind}", $data)
            ->setPaper('a4', 'portrait');

        $filename = "reports/{$kind}-" . now()->format('Y-m-d-His') . '.pdf';
        Storage::put($filename, $pdf->output());

        return $filename;
    }

    private function incidentData(?int $barangayId, ?string $from, ?string $to): array
    {
        $query = DisasterReport::with(['reporter', 'barangay', 'purok', 'photos']);
        if ($barangayId) $query->where('barangay_id', $barangayId);
        if ($from) $query->whereDate('created_at', '>=', $from);
        if ($to) $query->whereDate('created_at', '<=', $to);

        return [
            'reports' => $query->orderBy('created_at', 'desc')->get(),
            'generated_at' => now(),
            'date_from' => $from,
            'date_to' => $to,
        ];
    }

    private function receivedData(?int $barangayId, ?string $from, ?string $to): array
    {
        $query = Donation::with('donor')->where('payment_status', 'paid');
        if ($from) $query->whereDate('created_at', '>=', $from);
        if ($to) $query->whereDate('created_at', '<=', $to);

        return [
            'donations' => $query->get(),
            'generated_at' => now(),
            'date_from' => $from,
            'date_to' => $to,
        ];
    }

    private function distributionData(?int $barangayId, ?string $from, ?string $to): array
    {
        $query = Distribution::with(['household.purok', 'admin', 'beneficiaries']);
        if ($barangayId) $query->where('barangay_id', $barangayId);
        if ($from) $query->whereDate('created_at', '>=', $from);
        if ($to) $query->whereDate('created_at', '<=', $to);

        return [
            'distributions' => $query->get(),
            'generated_at' => now(),
            'date_from' => $from,
            'date_to' => $to,
        ];
    }
}
