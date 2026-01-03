<?php

use App\Http\Controllers\EventActionController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'php' => PHP_VERSION,
        'laravel' => Application::VERSION,
    ]);
});

Route::get('/debug-files', function () {
    $path = public_path('build');

    return response()->json([
        'public_path' => public_path(),
        'base_path' => base_path(),
        'exists' => file_exists($path),
        'is_dir' => is_dir($path),
        'files' => is_dir($path) ? scandir($path) : [],
        'manifest_exists' => file_exists(public_path('build/manifest.json')),
    ]);
});

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', \App\Http\Controllers\DashboardController::class)->middleware(['auth', 'verified'])->name('dashboard');
Route::get('/ingest', [\App\Http\Controllers\IngestController::class, '__invoke'])->middleware(['auth', 'verified'])->name('ingest');
Route::post('/ingest', [\App\Http\Controllers\IngestController::class, '__invoke'])->middleware(['auth', 'verified'])->name('ingest');
Route::post('/ingest/execute', \App\Http\Controllers\IngestExecutionController::class)->middleware(['auth', 'verified'])->name('ingest.execute');

// Google OAuth routes
Route::get('/auth/google', [\App\Http\Controllers\Auth\GoogleAuthController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('/auth/google/callback', [\App\Http\Controllers\Auth\GoogleAuthController::class, 'handleGoogleCallback']);

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/entities', [\App\Http\Controllers\EntityController::class, 'store'])->name('entities.store');
    Route::patch('/entities/{entity}', [\App\Http\Controllers\EntityController::class, 'update'])->name('entities.update');
    Route::delete('/entities/{entity}', [\App\Http\Controllers\EntityController::class, 'destroy'])->name('entities.destroy');
    Route::resource('life-events', \App\Http\Controllers\LifeEventController::class)->only(['store', 'update', 'destroy']);

    // Settings
    Route::get('/settings/integrations', [\App\Http\Controllers\Settings\IntegrationsController::class, 'index'])->name('settings.integrations');
    Route::delete('/settings/integrations/disconnect-google', [\App\Http\Controllers\Settings\IntegrationsController::class, 'disconnectGoogle'])->name('settings.integrations.disconnect-google');

    Route::get('/api/entities', [\App\Http\Controllers\EntityController::class, 'index'])->name('api.entities.index');

    Route::get('/inbox', [\App\Http\Controllers\Inbox\PendingConfirmationController::class, 'index'])->name('inbox.index');
    Route::post('/inbox/scan', [\App\Http\Controllers\Inbox\PendingConfirmationController::class, 'scan'])->name('inbox.scan');
    Route::post('/inbox/bulk-confirm', [\App\Http\Controllers\Inbox\PendingConfirmationController::class, 'bulkConfirm'])->name('inbox.bulk-confirm');
    Route::post('/inbox/bulk-destroy', [\App\Http\Controllers\Inbox\PendingConfirmationController::class, 'bulkDestroy'])->name('inbox.bulk-destroy');
    Route::post('/inbox/{confirmation}/confirm', [\App\Http\Controllers\Inbox\PendingConfirmationController::class, 'confirm'])->name('inbox.confirm');
    Route::delete('/inbox/{confirmation}', [\App\Http\Controllers\Inbox\PendingConfirmationController::class, 'destroy'])->name('inbox.destroy');

    // The Vault (Documents)
    Route::get('/vault', [\App\Http\Controllers\DocumentController::class, 'index'])->name('documents.index');
    Route::post('/documents', [\App\Http\Controllers\DocumentController::class, 'store'])->name('documents.store');

    Route::post('/events/{event}/resolve', [EventActionController::class, 'markAsPaid'])->name('events.mark-as-paid'); // Renamed to match Show.jsx
    Route::post('/events/{event}/undo', [EventActionController::class, 'unmarkAsPaid'])->name('events.undo'); // Added this line

    // Wallets Management
    Route::post('/wallets', [\App\Http\Controllers\WalletController::class, 'store'])->name('wallets.store');
    Route::patch('/wallets/{wallet}', [\App\Http\Controllers\WalletController::class, 'update'])->name('wallets.update');
    Route::delete('/wallets/{wallet}', [\App\Http\Controllers\WalletController::class, 'destroy'])->name('wallets.destroy');

    Route::get('/entities/{entity}', [\App\Http\Controllers\EntityController::class, 'show'])->name('entities.show');
});

require __DIR__.'/auth.php';
