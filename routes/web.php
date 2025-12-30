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
Route::post('/ingest', \App\Http\Controllers\IngestController::class)->middleware(['auth', 'verified'])->name('ingest');
Route::post('/ingest/execute', \App\Http\Controllers\IngestExecutionController::class)->middleware(['auth', 'verified'])->name('ingest.execute');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/entities', [\App\Http\Controllers\EntityController::class, 'store'])->name('entities.store');
    Route::post('/events/{event}/resolve', [EventActionController::class, 'markAsPaid'])->name('events.mark-as-paid'); // Renamed to match Show.jsx
    Route::post('/events/{event}/undo', [EventActionController::class, 'unmarkAsPaid'])->name('events.undo'); // Added this line

    Route::get('/entities/{entity}', [\App\Http\Controllers\EntityController::class, 'show'])->name('entities.show');
});

require __DIR__ . '/auth.php';
