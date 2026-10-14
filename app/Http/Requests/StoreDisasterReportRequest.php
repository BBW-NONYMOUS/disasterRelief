<?php

namespace App\Http\Requests;

use App\Enums\SeverityLevel;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDisasterReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;
        return $role === UserRole::Resident || $role === UserRole::PurokPresident;
    }

    public function rules(): array
    {
        return [
            'barangay_id' => 'required|exists:barangays,id',
            'purok_id' => 'nullable|exists:puroks,id',
            'type' => 'required|string|max:100',
            'description' => 'required|string|min:20',
            'affected_area' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90|required_with:longitude',
            'longitude' => 'nullable|numeric|between:-180,180|required_with:latitude',
            'severity' => ['nullable', Rule::enum(SeverityLevel::class)],
            'photos' => 'nullable|array|max:5',
            'photos.*' => 'image|mimes:jpeg,jpg,png,webp|max:5120',
        ];
    }
}
