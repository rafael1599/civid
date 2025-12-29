<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Helper to determine if we are in maintenance mode
if (file_exists($maintenance = __DIR__ . '/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// 1. Register the Composer autoloader
require __DIR__ . '/../vendor/autoload.php';

// 2. Bootstrap Laravel
$app = require_once __DIR__ . '/../bootstrap/app.php';

// 3. Apply Vercel-specific configuration (Read-only filesystem fix)
if (isset($_ENV['VERCEL'])) {
    $path = '/tmp/storage';
    $app->useStoragePath($path);

    // Ensure structure exists in /tmp
    if (!is_dir($path)) {
        mkdir($path, 0777, true);
        mkdir($path . '/framework/views', 0777, true);
        mkdir($path . '/framework/cache', 0777, true);
        mkdir($path . '/framework/sessions', 0777, true);
        mkdir($path . '/logs', 0777, true);
    }
}

// 4. Handle the request
$app->handleRequest(Request::capture());
