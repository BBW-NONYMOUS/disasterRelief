<?php

namespace App\Services;

use App\Enums\DistributionStatus;
use App\Models\Barangay;
use App\Models\DisasterReport;
use App\Models\Distribution;
use App\Models\Donation;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class ReportPdfService
{
    /**
     * Renders a report as an A4 PDF and stores it on the local disk.
     *
     * @param  array<int>  $barangayIds  empty = every barangay (Super Admin consolidated report)
     * @param  array{prepared_by_name?: ?string, prepared_by_position?: ?string, noted_by_name?: ?string, noted_by_position?: ?string}  $signatories
     */
    public function generate(string $kind, array $barangayIds, ?string $from, ?string $to, array $signatories = []): string
    {
        $pdf = Pdf::loadView("reports.{$kind}", $this->viewData($kind, $barangayIds, $from, $to, $signatories))
            ->setPaper('a4', 'portrait');

        $filename = "reports/{$kind}-".now()->format('Y-m-d-His').'-'.substr(md5(uniqid('', true)), 0, 6).'.pdf';
        Storage::put($filename, $pdf->output());

        return $filename;
    }

    /** Everything the reports.{kind} Blade view renders. */
    public function viewData(string $kind, array $barangayIds, ?string $from, ?string $to, array $signatories = []): array
    {
        $records = match ($kind) {
            'incident' => $this->incidents($barangayIds, $from, $to),
            'received' => $this->donationsReceived($barangayIds, $from, $to),
            'distribution' => $this->distributions($barangayIds, $from, $to),
            default => throw new \InvalidArgumentException("Unknown report kind: {$kind}"),
        };

        $groups = $this->groupByBarangay($kind, $records);

        return [
            'groups' => $groups,
            // Per-barangay sections and subtotals only make sense for more than one.
            'grouped' => $groups->count() > 1,
            'grand_total' => $this->totals($kind, $records),
            'scope_label' => $this->scopeLabel($barangayIds),
            'generated_at' => now(),
            'date_from' => $from,
            'date_to' => $to,
            'signatories' => $signatories,
        ];
    }

    private function incidents(array $barangayIds, ?string $from, ?string $to): Collection
    {
        return DisasterReport::with(['reporter', 'barangay', 'purok'])
            ->when($barangayIds, fn ($q) => $q->whereIn('barangay_id', $barangayIds))
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /** Paid cash plus goods that were physically received into inventory. */
    private function donationsReceived(array $barangayIds, ?string $from, ?string $to): Collection
    {
        return Donation::with(['donor', 'barangay', 'donationItems'])
            ->where(function ($q) {
                $q->where(fn ($q) => $q->where('type', 'cash')->where('payment_status', 'paid'))
                    ->orWhere(fn ($q) => $q->where('type', 'goods')->whereNotNull('received_at'));
            })
            ->when($barangayIds, fn ($q) => $q->whereIn('barangay_id', $barangayIds))
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->orderBy('created_at')
            ->get();
    }

    private function distributions(array $barangayIds, ?string $from, ?string $to): Collection
    {
        return Distribution::with(['household.purok', 'admin', 'beneficiaries', 'distributionItems', 'barangay'])
            ->when($barangayIds, fn ($q) => $q->whereIn('barangay_id', $barangayIds))
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->orderBy('created_at')
            ->get()
            ->each(fn (Distribution $d) => $d->setAttribute('signature_src', $this->signatureSrc($d)));
    }

    /** @return Collection<int, array{barangay: ?Barangay, rows: Collection, subtotal: array}> */
    private function groupByBarangay(string $kind, Collection $records): Collection
    {
        return $records
            ->groupBy(fn ($record) => $record->barangay_id ?? 0)
            ->map(fn (Collection $rows) => [
                'barangay' => $rows->first()->barangay,
                'rows' => $rows->values(),
                'subtotal' => $this->totals($kind, $rows),
            ])
            ->sortBy(fn ($group) => $group['barangay']?->name ?? "\u{FFFF}")
            ->values();
    }

    private function totals(string $kind, Collection $rows): array
    {
        return match ($kind) {
            'incident' => [
                'count' => $rows->count(),
                'by_status' => $rows->countBy(fn ($r) => $r->status->label())->sortKeys()->all(),
            ],
            'received' => [
                'count' => $rows->count(),
                'cash_cents' => $rows->where('type', 'cash')->sum('amount_cents'),
                'goods_count' => $rows->where('type', 'goods')->count(),
            ],
            'distribution' => [
                'count' => $rows->count(),
                'quantity' => $rows->sum('quantity'),
                'completed' => $rows->filter(fn ($d) => $d->status === DistributionStatus::Completed)->count(),
                'households' => $rows->pluck('household_id')->unique()->count(),
            ],
        };
    }

    private function scopeLabel(array $barangayIds): string
    {
        if (! $barangayIds) {
            return 'All barangays (consolidated)';
        }

        return Barangay::whereIn('id', $barangayIds)->orderBy('name')->pluck('name')->implode(', ');
    }

    /**
     * Signatures live on the private disk; embed them as data URIs so DomPDF
     * never needs filesystem or remote access. Falls back to the public disk
     * for signatures captured before they were moved.
     */
    private function signatureSrc(Distribution $distribution): ?string
    {
        $path = $distribution->signature_path;
        if (! $path) {
            return null;
        }

        foreach (['local', 'public'] as $disk) {
            if (Storage::disk($disk)->exists($path)) {
                $mime = Storage::disk($disk)->mimeType($path) ?: 'image/png';

                return "data:{$mime};base64,".base64_encode(Storage::disk($disk)->get($path));
            }
        }

        return null;
    }
}
