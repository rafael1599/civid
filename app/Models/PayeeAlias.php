<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayeeAlias extends Model
{
    /** @use HasFactory<\Database\Factories\PayeeAliasFactory> */
    use HasFactory;

    protected $fillable = ['user_id', 'alias', 'normalized_name', 'category_suggestion'];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
