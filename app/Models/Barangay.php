<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Barangay extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'code', 'lgu_name', 'image_path', 'description', 'captain_name',
        'contact_number', 'email', 'hall_address', 'population', 'land_area_km2',
    ];

    protected $casts = [
        'population' => 'integer',
        'land_area_km2' => 'decimal:2',
    ];

    /** Public URL of the cover photo (stored on the public disk); append it where the photo is shown. */
    protected function imageUrl(): Attribute
    {
        return Attribute::get(fn () => $this->image_path ? '/storage/'.$this->image_path : null);
    }

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

    public function households(): HasManyThrough
    {
        return $this->hasManyThrough(Household::class, Purok::class);
    }

    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class);
    }
}
