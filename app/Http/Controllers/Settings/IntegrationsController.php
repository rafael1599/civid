<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\GoogleTokenService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IntegrationsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Settings/Integrations', [
            'googleConnected' => ! empty($user->google_token),
            'googleEmail' => $user->google_id ? $user->email : null,
            'lastScanAt' => null, // TODO: Add scan_logs tracking
        ]);
    }

    public function disconnectGoogle(Request $request, GoogleTokenService $tokenService)
    {
        $tokenService->handleTokenRevocation($request->user());

        return back()->with('success', 'Google desconectado correctamente.');
    }
}
