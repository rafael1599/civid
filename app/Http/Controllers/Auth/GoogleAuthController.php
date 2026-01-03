<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->scopes([
                'openid',
                'email',
                'profile',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/calendar.readonly',
            ])
            ->redirect();
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // 1. Check for existing user by Google ID
            $user = User::where('google_id', $googleUser->getId())->first();

            // 2. If not found, check by Email (Account Linking)
            if (! $user) {
                $user = User::where('email', $googleUser->getEmail())->first();
            }

            // 3. Create or Update user
            if ($user) {
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'name' => $googleUser->getName(), // Optional: Update name
                    'google_token' => $googleUser->token,
                    'google_refresh_token' => $googleUser->refreshToken,
                    'google_token_expires_at' => now()->addSeconds($googleUser->expiresIn),
                    'google_scopes' => json_encode([
                        'openid',
                        'email',
                        'profile',
                        'gmail.readonly',
                        'calendar.readonly',
                    ]),
                ]);
            } else {
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => \Hash::make(\Str::random(24)), // Random password for OAuth users
                    'google_id' => $googleUser->getId(),
                    'google_token' => $googleUser->token,
                    'google_refresh_token' => $googleUser->refreshToken,
                    'google_token_expires_at' => now()->addSeconds($googleUser->expiresIn),
                    'google_scopes' => json_encode([
                        'openid',
                        'email',
                        'profile',
                        'gmail.readonly',
                        'calendar.readonly',
                    ]),
                    'email_verified_at' => now(), // Auto-verify Google emails
                ]);
            }

            auth()->login($user);

            return redirect()->intended(route('dashboard'));

        } catch (\Exception $e) {
            \Log::error('Google OAuth failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('login')
                ->with('error', 'No se pudo conectar con Google. Intenta de nuevo.');
        }
    }
}
