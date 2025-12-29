<?php

// Forward Vercel requests to the standard Laravel entry point
require __DIR__ . '/../public/index.php';

// Adapt for Vercel's read-only filesystem
if (isset($_ENV['VERCEL'])) {
    // Set storage path to /tmp which is writable
    $app->useStoragePath('/tmp/storage');

    // Ensure directories exist
    if (!is_dir('/tmp/storage')) {
        mkdir('/tmp/storage', 0777, true);
        mkdir('/tmp/storage/framework/views', 0777, true);
        mkdir('/tmp/storage/framework/cache', 0777, true);
        mkdir('/tmp/storage/framework/sessions', 0777, true);
        mkdir('/tmp/storage/logs', 0777, true);
    }
}

$app->handleRequest(Request::capture());
