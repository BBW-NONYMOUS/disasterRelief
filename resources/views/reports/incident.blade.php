<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Disaster Incident Report</title>
    <style>
        @include('reports.partials.styles', ['accent' => '#1e40af'])
        .badge { padding: 2px 6px; border-radius: 8px; font-size: 9px; font-weight: bold; }
        .reported { background: #fef3c7; color: #92400e; }
        .verified { background: #e0e7ff; color: #3730a3; }
        .confirmed { background: #dbeafe; color: #1e40af; }
        .resolved { background: #d1fae5; color: #065f46; }
        .rejected { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    @include('reports.partials.header', ['title' => 'Disaster Incident Report'])

    @foreach($groups as $group)
        @if($grouped)
            <h2>{{ $group['barangay']?->name ?? 'Unassigned barangay' }}</h2>
        @endif
        <table class="data">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Affected Area</th>
                    <th>Purok</th>
                    <th>Reporter</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($group['rows'] as $i => $report)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $report->created_at->format('M d, Y') }}</td>
                    <td>{{ $report->type }}</td>
                    <td>{{ $report->severity?->label() ?? '—' }}</td>
                    <td>{{ $report->affected_area }}</td>
                    <td>{{ $report->purok?->name ?? '—' }}</td>
                    <td>{{ $report->reporter?->name ?? '—' }}</td>
                    <td><span class="badge {{ $report->status->value }}">{{ $report->status->label() }}</span></td>
                </tr>
                @endforeach
                @if($grouped)
                <tr class="subtotal">
                    <td colspan="8">
                        Subtotal: {{ $group['subtotal']['count'] }} incident(s)
                        @foreach($group['subtotal']['by_status'] as $status => $count) · {{ $status }}: {{ $count }} @endforeach
                    </td>
                </tr>
                @endif
            </tbody>
        </table>
    @endforeach

    @if($groups->isEmpty())
        <p style="text-align:center">No records found.</p>
    @endif

    <div class="grand-total">
        {{ $grouped ? 'Grand total' : 'Total' }}: {{ $grand_total['count'] }} incident(s)
        @foreach($grand_total['by_status'] as $status => $count) · {{ $status }}: {{ $count }} @endforeach
    </div>

    @include('reports.partials.signatories')

    <p class="footer">RELIEFNET Disaster Monitoring System &mdash; Confidential</p>
</body>
</html>
