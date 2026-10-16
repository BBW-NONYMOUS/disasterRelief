{{-- Two-column signature footer for submission to the barangay / LGU. Blank lines are left for wet signatures. --}}
<table class="signatories">
    <tr>
        <td>
            <div class="sig-label">Prepared by:</div>
            <div class="sig-line"></div>
            <div class="sig-name">{{ $signatories['prepared_by_name'] ?? '' }}</div>
            <div class="sig-position">{{ $signatories['prepared_by_position'] ?? 'Name and Position' }}</div>
            <div class="sig-date">Date: ____________________</div>
        </td>
        <td>
            <div class="sig-label">Noted by:</div>
            <div class="sig-line"></div>
            <div class="sig-name">{{ $signatories['noted_by_name'] ?? '' }}</div>
            <div class="sig-position">{{ $signatories['noted_by_position'] ?? 'Name and Position' }}</div>
            <div class="sig-date">Date: ____________________</div>
        </td>
    </tr>
</table>
