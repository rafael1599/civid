<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    $users = \App\Models\User::whereNotNull('google_token')->get();
    foreach ($users as $user) {
        if ($user->hasValidGoogleToken()) {
            \App\Jobs\ScanUserSocialData::dispatch($user);
        }
    }
})->daily()->name('scan-all-users');
