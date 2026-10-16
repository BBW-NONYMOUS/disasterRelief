<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Donation Received Report</title>
    <style>
        @include('reports.partials.styles', ['accent' => '#065f46'])
    </style>
</head>
<body>
    @include('reports.partials.header', ['title' => 'Donation Received Report'])

    @foreach($groups as $group)
        @if($grouped)
            <h2>{{ $group['barangay']?->name ?? 'Unassigned barangay' }}</h2>
        @endif
        <table class="data">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Donor</th>
                    <th>Type</th>
                    <th class="right">Amount (PHP)</th>
                    <th>Items received</th>
                    <th>Delivery</th>
                    <th>Received</th>
                </tr>
            </thead>
            <tbody>
                @foreach($group['rows'] as $i => $donation)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $donation->created_at->format('M d, Y') }}</td>
                    <td>{{ $donation->donor?->name ?? '—' }}</td>
                    <td>{{ ucfirst($donation->type) }}</td>
                    <td class="right">{{ $donation->type === 'cash' ? number_format($donation->amount_cents / 100, 2) : '—' }}</td>
                    <td>
                        @if($donation->type === 'goods' && $donation->donationItems->isNotEmpty())
                            @foreach($donation->donationItems as $item)
                                {{ $item->received_quantity ?? 0 }} {{ $item->unit }} {{ $item->name }}@if(! $loop->last), @endif
                            @endforeach
                        @else
                            {{ $donation->items ?? '—' }}
                        @endif
                    </td>
                    <td>{{ ucfirst($donation->delivery_method) }}</td>
                    <td>{{ $donation->received_at?->format('M d, Y') ?? ($donation->type === 'cash' ? 'Paid online' : '—') }}</td>
                </tr>
                @endforeach
                @if($grouped)
                <tr class="subtotal">
                    <td colspan="4">Subtotal ({{ $group['subtotal']['count'] }} donation(s), {{ $group['subtotal']['goods_count'] }} in goods)</td>
                    <td class="right">{{ number_format($group['subtotal']['cash_cents'] / 100, 2) }}</td>
                    <td colspan="3"></td>
                </tr>
                @endif
            </tbody>
        </table>
    @endforeach

    @if($groups->isEmpty())
        <p style="text-align:center">No records found.</p>
    @endif

    <div class="grand-total">
        {{ $grouped ? 'Grand total' : 'Total' }}: {{ $grand_total['count'] }} donation(s) ·
        Cash: PHP {{ number_format($grand_total['cash_cents'] / 100, 2) }} ·
        Goods donations received: {{ $grand_total['goods_count'] }}
    </div>

    @include('reports.partials.signatories')

    <p class="footer">RELIEFNET Disaster Monitoring System &mdash; Confidential</p>
</body>
</html>
