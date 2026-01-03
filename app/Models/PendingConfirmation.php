<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PendingConfirmation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'source_type',
        'source_id',
        'source_external_id',
        'raw_data',
        'extracted_data',
        'confidence_score',
        'requires_manual_review',
        'review_reason',
        'status',
        'processed_at',
    ];

    protected $casts = [
        'raw_data' => 'array',
        'extracted_data' => 'array',
        'processed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
