<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleTokenService
{
    /**
     * Refresh Google token if expired
     */
    public function refreshTokenIfNeeded(User $user): void
    {
        if ($user->hasValidGoogleToken()) {
            return; // Token still valid
        }

        if (! $user->google_refresh_token) {
            throw new \Exception('No refresh token available');
        }

        try {
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'refresh_token' => $user->google_refresh_token,
                'grant_type' => 'refresh_token',
            ]);

            if (! $response->successful()) {
                throw new \Exception('Token refresh failed: '.$response->body());
            }

            $data = $response->json();

            $user->update([
                'google_token' => $data['access_token'],
                'google_token_expires_at' => now()->addSeconds($data['expires_in']),
            ]);

            Log::info('Google token refreshed', ['user_id' => $user->id]);
        } catch (\Exception $e) {
            Log::error('Token refresh failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Handle token revocation (clear tokens and notify user)
     */
    public function handleTokenRevocation(User $user): void
    {
        $user->update([
            'google_token' => null,
            'google_refresh_token' => null,
            'google_token_expires_at' => null,
        ]);

        Log::warning('Google token revoked/expired', ['user_id' => $user->id]);
    }

    /**
     * Get valid token (auto-refresh if needed)
     */
    public function getValidToken(User $user): string
    {
        $this->refreshTokenIfNeeded($user);

        return $user->google_token;
    }
}
