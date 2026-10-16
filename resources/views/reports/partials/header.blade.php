<h1>RELIEFNET — {{ $title }}</h1>
<p class="subtitle">
    {{ $scope_label }}<br>
    Generated: {{ $generated_at->format('F d, Y h:i A') }}
    @if($date_from || $date_to)
        | Period: {{ $date_from ?? 'Start' }} to {{ $date_to ?? 'Present' }}
    @endif
</p>
