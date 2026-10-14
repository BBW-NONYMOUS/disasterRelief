<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Disaster Incident Report</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        h1 { text-align: center; font-size: 18px; margin-bottom: 4px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #1e40af; color: white; padding: 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f5f5f5; }
        .badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
        .reported { background: #fef3c7; color: #92400e; }
        .confirmed { background: #dbeafe; color: #1e40af; }
        .resolved { background: #d1fae5; color: #065f46; }
        .footer { margin-top: 40px; font-size: 10px; color: #666; text-align: right; }
    </style>
</head>
<body>
    <h1>RELIEFNET — Disaster Incident Report</h1>
    <p class="subtitle">
        Generated: {{ $generated_at->format('F d, Y h:i A') }}
        @if($date_from || $date_to)
            | Period: {{ $date_from ?? 'Start' }} to {{ $date_to ?? 'Present' }}
        @endif
    </p>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Date</th>
                <th>Type</th>
                <th>Affected Area</th>
                <th>Barangay</th>
                <th>Reporter</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($reports as $i => $report)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $report->created_at->format('M d, Y') }}</td>
                <td>{{ $report->type }}</td>
                <td>{{ $report->affected_area }}</td>
                <td>{{ $report->barangay?->name ?? '—' }}</td>
                <td>{{ $report->reporter?->name ?? '—' }}</td>
                <td><span class="badge {{ $report->status->value }}">{{ $report->status->label() }}</span></td>
            </tr>
            @empty
            <tr><td colspan="7" style="text-align:center">No records found.</td></tr>
            @endforelse
        </tbody>
    </table>

    <p class="footer">RELIEFNET Disaster Monitoring System &mdash; Confidential</p>
</body>
</html>
