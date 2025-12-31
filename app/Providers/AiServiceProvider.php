<?php

namespace App\Providers;

use App\AI\ToolRegistry;
use App\AI\Tools\ReadAnalyticsTool;
use App\AI\Tools\UpsertEntityTool;
use App\AI\Tools\RecordFinancialEventTool;
use Illuminate\Support\ServiceProvider;

class AiServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ToolRegistry::class, function ($app) {
            $registry = new ToolRegistry();

            // Register MVP Tools
            $registry->register(new ReadAnalyticsTool());
            $registry->register(new UpsertEntityTool());
            $registry->register(new RecordFinancialEventTool());

            return $registry;
        });
    }

    public function boot(): void
    {
        //
    }
}
