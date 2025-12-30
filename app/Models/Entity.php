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

    // Legacy relationships using parent_entity_id (deprecated)
    public function children(): HasMany
    {
        return $this->hasMany(Entity::class, 'parent_entity_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'parent_entity_id');
    }

    // New flexible relationships using entity_relationships pivot table
    public function parentRelationships(): HasMany
    {
        return $this->hasMany(EntityRelationship::class, 'child_entity_id');
    }

    public function childRelationships(): HasMany
    {
        return $this->hasMany(EntityRelationship::class, 'parent_entity_id');
    }

    /**
     * Get all parent entities (entities that provide/cover/finance this entity)
     * Example: Insurance that covers this car, Bank that finances this car
     */
    public function parents()
    {
        return $this->belongsToMany(
            Entity::class,
            'entity_relationships',
            'child_entity_id',
            'parent_entity_id'
        )->withPivot('relationship_type', 'metadata')->withTimestamps();
    }

    /**
     * Get all child entities (entities that this entity provides/covers/finances)
     * Example: Cars covered by this insurance, Accounts financed by this bank
     */
    public function childEntities()
    {
        return $this->belongsToMany(
            Entity::class,
            'entity_relationships',
            'parent_entity_id',
            'child_entity_id'
        )->withPivot('relationship_type', 'metadata')->withTimestamps();
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
