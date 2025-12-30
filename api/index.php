<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// 1. Register the Composer autoloader
require __DIR__ . '/../vendor/autoload.php';

// 2. Determine if we are on Vercel
$isVercel = getenv('VERCEL') === '1' || isset($_SERVER['VERCEL']);

if ($isVercel) {
    // 3. Apply Vercel-specific environment overrides BEFORE bootstrapping
    $tmpPath = '/tmp/storage';

    // Create necessary directories in /tmp
    $dirs = [
        $tmpPath,
        $tmpPath . '/framework/views',
        $tmpPath . '/framework/cache',
        $tmpPath . '/framework/sessions',
        $tmpPath . '/logs',
    ];

    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
    }

    // Set cache redirection environment variables
    putenv("APP_STORAGE_PATH={$tmpPath}");
    putenv('APP_CONFIG_CACHE=/tmp/config.php');
    putenv('APP_EVENTS_CACHE=/tmp/events.php');
    putenv('APP_PACKAGES_CACHE=/tmp/packages.php');
    putenv('APP_ROUTES_CACHE=/tmp/routes.php');
    putenv('APP_SERVICES_CACHE=/tmp/services.php');
    putenv('VIEW_COMPILED_PATH=/tmp/framework/views');

    // SQLite handling
    $dbPath = __DIR__ . '/../database/database.sqlite';
    $tmpDbPath = '/tmp/database.sqlite';
    if (file_exists($dbPath) && !file_exists($tmpDbPath)) {
        if (@copy($dbPath, $tmpDbPath)) {
            putenv("DB_DATABASE={$tmpDbPath}");
            $_ENV['DB_DATABASE'] = $tmpDbPath;
            $_SERVER['DB_DATABASE'] = $tmpDbPath;
        } else {
            error_log('CRITICAL: Failed to copy SQLite database to /tmp');
        }
    }

    if (!getenv('APP_KEY')) {
        error_log('CRITICAL: APP_KEY is missing in Vercel environment!');
    }
}

// 4. Bootstrap Laravel
$app = require_once __DIR__ . '/../bootstrap/app.php';

if ($isVercel) {
    $app->useStoragePath($tmpPath);

    // Explicitly set the database path in the config to avoid issues with .env files having local paths
    $app->make('config')->set('database.connections.sqlite.database', getenv('DB_DATABASE') ?: $tmpDbPath);
}

// 5. Handle the request
try {
    $request = Request::capture();
    $app->handleRequest($request);
} catch (\Throwable $e) {
    // Log fatal errors to stderr for Vercel logs
    error_log('FATAL ERROR: ' . $e->getMessage());
    error_log('File: ' . $e->getFile() . ' Line: ' . $e->getLine());
    error_log($e->getTraceAsString());

    if (getenv('APP_DEBUG') === 'true') {
        header('Content-Type: text/html');
        echo '<h1>Fatal Error</h1>';
        echo '<p><b>Message:</b> ' . htmlspecialchars($e->getMessage()) . '</p>';
        echo '<p><b>File:</b> ' . $e->getFile() . ':' . $e->getLine() . '</p>';
        echo '<h3>Stack Trace:</h3>';
        echo '<pre>' . htmlspecialchars($e->getTraceAsString()) . '</pre>';
    } else {
        header('HTTP/1.1 500 Internal Server Error');
        echo 'Internal Server Error';
    }
    exit(1);
}
