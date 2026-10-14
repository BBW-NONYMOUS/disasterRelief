<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Barangay extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'lgu_name'];

    public function puroks(): HasMany
    {
        return $this->hasMany(Purok::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function disasterReports(): HasMany
    {
        return $this->hasMany(DisasterReport::class);
    }

    public function inventoryItems(): HasMany
    {
        return $this->hasMany(InventoryItem::class);
    }

    public function distributions(): HasMany
    {
        return $this->hasMany(Distribution::class);
    }
}
