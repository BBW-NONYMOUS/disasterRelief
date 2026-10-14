<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Donation Received Report</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        h1 { text-align: center; font-size: 18px; margin-bottom: 4px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #065f46; color: white; padding: 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f5f5f5; }
        .total { font-weight: bold; background: #f0fdf4; }
        .footer { margin-top: 40px; font-size: 10px; color: #666; text-align: right; }
    </style>
</head>
<body>
    <h1>RELIEFNET — Donation Received Report</h1>
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
                <th>Donor</th>
                <th>Type</th>
                <th>Amount (PHP)</th>
                <th>Items</th>
                <th>Delivery</th>
                <th>Scheduled</th>
            </tr>
        </thead>
        <tbody>
            @php $totalCents = 0; @endphp
            @forelse($donations as $i => $donation)
            @php $totalCents += $donation->amount_cents; @endphp
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $donation->created_at->format('M d, Y') }}</td>
                <td>{{ $donation->donor?->name ?? '—' }}</td>
                <td>{{ ucfirst($donation->type) }}</td>
                <td>{{ $donation->type === 'cash' ? '₱ ' . number_format($donation->amount_cents / 100, 2) : '—' }}</td>
                <td>{{ $donation->items ?? '—' }}</td>
                <td>{{ ucfirst($donation->delivery_method) }}</td>
                <td>{{ $donation->scheduled_at?->format('M d, Y') ?? '—' }}</td>
            </tr>
            @empty
            <tr><td colspan="8" style="text-align:center">No records found.</td></tr>
            @endforelse
        </tbody>
        @if($donations->count())
        <tfoot>
            <tr class="total">
                <td colspan="4" style="text-align:right">Total Cash Donations:</td>
                <td colspan="4">₱ {{ number_format($totalCents / 100, 2) }}</td>
            </tr>
        </tfoot>
        @endif
    </table>

    <p class="footer">RELIEFNET Disaster Monitoring System &mdash; Confidential</p>
</body>
</html>
