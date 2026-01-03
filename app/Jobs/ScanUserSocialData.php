<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\ScanningService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ScanUserSocialData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(public User $user) {}

    /**
     * Execute the job.
     */
    public function handle(ScanningService $scanner): void
    {
        Log::info("Starting background social scan for user: {$this->user->id}");

        try {
            $results = $scanner->scanUserData($this->user);

            Log::info("Background scan completed for user: {$this->user->id}", [
                'created_total' => $results['total_created'] ?? 0,
            ]);
        } catch (\Exception $e) {
            Log::error("Background scan failed for user: {$this->user->id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Re-throw to trigger retry mechanism if it's a transient issue
            throw $e;
        }
    }
}
