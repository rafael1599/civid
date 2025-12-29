<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Entity extends Model
{
    /** @use HasFactory<\Database\Factories\EntityFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lifeEvents(): HasMany
    {
        return $this->hasMany(LifeEvent::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function children(): HasMany
    {
        return $this->hasMany(Entity::class, 'parent_entity_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'parent_entity_id');
    }

    /**
     * Virtual Odometer: The Truth Fundamental without effort.
     * Calculation: last_manual_odometer + (days_since_manual_reading * daily_avg_usage)
     */
    public function getVirtualOdometerAttribute(): float
    {
        if ($this->category !== 'ASSET') {
            return 0;
        }

        $lastReading = (float) ($this->metadata['last_manual_odometer'] ?? 0);
        $lastReadingAt = $this->metadata['last_manual_odometer_at'] ?? $this->created_at->toDateString();
        $dailyAvg = (float) ($this->metadata['daily_avg_usage'] ?? 0);

        $daysPassed = now()->diffInDays(\Carbon\Carbon::parse($lastReadingAt));

        return round($lastReading + ($daysPassed * $dailyAvg), 0);
    }
}
