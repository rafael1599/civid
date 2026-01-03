<?php

namespace App\Http\Middleware;

use App\Services\GoogleTokenService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckGoogleTokenValidity
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->google_token) {
            return $next($request);
        }

        if (! $user->hasValidGoogleToken()) {
            try {
                app(GoogleTokenService::class)->refreshTokenIfNeeded($user);
            } catch (\Exception $e) {
                // Token refresh failed, notify user
                app(GoogleTokenService::class)->handleTokenRevocation($user);

                return redirect()->route('settings.integrations')
                    ->with('error', 'Tu sesión de Google ha expirado. Por favor reconecta.');
            }
        }

        return $next($request);
    }
}
