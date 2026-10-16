<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Donation Distribution Report</title>
    <style>
        @include('reports.partials.styles', ['accent' => '#7c3aed'])
        .distribution { margin-bottom: 12px; border: 1px solid #ddd; border-radius: 4px; padding: 8px 10px; page-break-inside: avoid; }
        .distribution-header { font-weight: bold; margin-bottom: 4px; font-size: 12px; }
        .signature-block { margin-top: 6px; }
        .signature-img { max-height: 55px; border-bottom: 1px solid #999; }
        .badge-waiting { color: #92400e; background: #fef3c7; padding: 1px 6px; border-radius: 8px; }
        .badge-ongoing { color: #1e40af; background: #dbeafe; padding: 1px 6px; border-radius: 8px; }
        .badge-completed { color: #065f46; background: #d1fae5; padding: 1px 6px; border-radius: 8px; }
    </style>
</head>
<body>
    @include('reports.partials.header', ['title' => 'Donation Distribution Report'])

    @foreach($groups as $group)
        @if($grouped)
            <h2>{{ $group['barangay']?->name ?? 'Unassigned barangay' }}</h2>
        @endif

        @foreach($group['rows'] as $distribution)
        <div class="distribution">
            <div class="distribution-header">
                Distribution #{{ $distribution->id }} &mdash; {{ $distribution->household?->head_name }}
                &mdash; {{ $distribution->household?->address }}
                &mdash; <span class="badge-{{ $distribution->status->value }}">{{ $distribution->status->label() }}</span>
            </div>
            <table class="data">
                <tr>
                    <th>Items</th>
                    <th class="right">Qty</th>
                    <th>Purok</th>
                    <th>Released by</th>
                    <th>Distributed At</th>
                </tr>
                @if($distribution->distributionItems->isNotEmpty())
                    @foreach($distribution->distributionItems as $line)
                    <tr>
                        <td>{{ $line->item_name }}</td>
                        <td class="right">{{ $line->quantity }} {{ $line->unit }}</td>
                        @if($loop->first)
                            <td rowspan="{{ $distribution->distributionItems->count() }}">{{ $distribution->household?->purok?->name ?? '—' }}</td>
                            <td rowspan="{{ $distribution->distributionItems->count() }}">{{ $distribution->admin?->name ?? '—' }}</td>
                            <td rowspan="{{ $distribution->distributionItems->count() }}">{{ $distribution->distributed_at?->format('M d, Y H:i') ?? '—' }}</td>
                        @endif
                    </tr>
                    @endforeach
                @else
                    <tr>
                        <td>{{ $distribution->items }}</td>
                        <td class="right">{{ $distribution->quantity }}</td>
                        <td>{{ $distribution->household?->purok?->name ?? '—' }}</td>
                        <td>{{ $distribution->admin?->name ?? '—' }}</td>
                        <td>{{ $distribution->distributed_at?->format('M d, Y H:i') ?? '—' }}</td>
                    </tr>
                @endif
            </table>
            <div class="signature-block">
                @if($distribution->signature_src)
                    <strong>Received by (signature of recipient):</strong><br>
                    <img src="{{ $distribution->signature_src }}" class="signature-img"><br>
                    <span>{{ $distribution->household?->head_name }}</span>
                @else
                    <span class="muted">No recipient signature on file.</span>
                @endif
            </div>
        </div>
        @endforeach

        @if($grouped)
            <table class="data">
                <tr class="subtotal">
                    <td>Subtotal: {{ $group['subtotal']['count'] }} distribution(s) to {{ $group['subtotal']['households'] }} household(s),
                        {{ $group['subtotal']['completed'] }} completed, {{ $group['subtotal']['quantity'] }} total units</td>
                </tr>
            </table>
        @endif
    @endforeach

    @if($groups->isEmpty())
        <p style="text-align:center">No distribution records found.</p>
    @endif

    <div class="grand-total">
        {{ $grouped ? 'Grand total' : 'Total' }}: {{ $grand_total['count'] }} distribution(s) to {{ $grand_total['households'] }} household(s) ·
        {{ $grand_total['completed'] }} completed · {{ $grand_total['quantity'] }} total units
    </div>

    @include('reports.partials.signatories')

    <p class="footer">RELIEFNET Disaster Monitoring System &mdash; Confidential</p>
</body>
</html>
