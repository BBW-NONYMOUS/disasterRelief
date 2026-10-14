<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purok extends Model
{
    use HasFactory;

    protected $fillable = ['barangay_id', 'name', 'president_id'];

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function president(): BelongsTo
    {
        return $this->belongsTo(User::class, 'president_id');
    }

    public function households(): HasMany
    {
        return $this->hasMany(Household::class);
    }

    public function disasterReports(): HasMany
    {
        return $this->hasMany(DisasterReport::class);
    }
}
