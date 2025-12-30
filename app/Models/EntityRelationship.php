<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EntityRelationship extends Model
{
    use HasUuids;

    protected $fillable = [
        'parent_entity_id',
        'child_entity_id',
        'relationship_type',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'parent_entity_id');
    }

    public function child(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'child_entity_id');
    }
}
