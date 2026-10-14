<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Donation Distribution Report</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        h1 { text-align: center; font-size: 18px; margin-bottom: 4px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
        .distribution { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 4px; padding: 12px; }
        .distribution-header { font-weight: bold; margin-bottom: 6px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #7c3aed; color: white; padding: 6px 8px; text-align: left; }
        td { padding: 5px 8px; border-bottom: 1px solid #eee; }
        .signature-block { margin-top: 10px; }
        .signature-img { max-height: 60px; }
        .badge-waiting { color: #92400e; background: #fef3c7; padding: 1px 6px; border-radius: 8px; }
        .badge-ongoing { color: #1e40af; background: #dbeafe; padding: 1px 6px; border-radius: 8px; }
        .badge-completed { color: #065f46; background: #d1fae5; padding: 1px 6px; border-radius: 8px; }
        .footer { margin-top: 40px; font-size: 10px; color: #666; text-align: right; }
    </style>
</head>
<body>
    <h1>RELIEFNET — Donation Distribution Report</h1>
    <p class="subtitle">
        Generated: {{ $generated_at->format('F d, Y h:i A') }}
        @if($date_from || $date_to)
            | Period: {{ $date_from ?? 'Start' }} to {{ $date_to ?? 'Present' }}
        @endif
    </p>

    @forelse($distributions as $distribution)
    <div class="distribution">
        <div class="distribution-header">
            Distribution #{{ $distribution->id }} &mdash; {{ $distribution->household?->head_name }}
            &mdash; {{ $distribution->household?->address }}
            &mdash; <span class="badge-{{ $distribution->status->value }}">{{ $distribution->status->label() }}</span>
        </div>
        <table>
            <tr>
                <th>Items</th>
                <th>Qty</th>
                <th>Purok</th>
                <th>Admin</th>
                <th>Distributed At</th>
            </tr>
            <tr>
                <td>{{ $distribution->items }}</td>
                <td>{{ $distribution->quantity }}</td>
                <td>{{ $distribution->household?->purok?->name ?? '—' }}</td>
                <td>{{ $distribution->admin?->name ?? '—' }}</td>
                <td>{{ $distribution->distributed_at?->format('M d, Y H:i') ?? '—' }}</td>
            </tr>
        </table>
        @if($distribution->signature_path)
        <div class="signature-block">
            <strong>Signature:</strong><br>
            <img src="{{ storage_path('app/public/' . $distribution->signature_path) }}" class="signature-img">
        </div>
        @else
        <p style="color:#999">No signature on file.</p>
        @endif
    </div>
    @empty
    <p style="text-align:center">No distribution records found.</p>
    @endforelse

    <p class="footer">RELIEFNET Disaster Monitoring System &mdash; Confidential</p>
</body>
</html>
