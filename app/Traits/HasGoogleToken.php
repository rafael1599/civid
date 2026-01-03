<?php

namespace App\Traits;

use Illuminate\Support\Facades\Crypt;

trait HasGoogleToken
{
    public function setGoogleTokenAttribute($value): void
    {
        $this->attributes['google_token'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getGoogleTokenAttribute($value): ?string
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function setGoogleRefreshTokenAttribute($value): void
    {
        $this->attributes['google_refresh_token'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getGoogleRefreshTokenAttribute($value): ?string
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function hasValidGoogleToken(): bool
    {
        return $this->google_token && $this->google_token_expires_at && $this->google_token_expires_at > now();
    }
}
