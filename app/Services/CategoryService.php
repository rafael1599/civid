<?php

namespace App\Services;

use App\Models\LifeEvent;
use App\Models\PayeeAlias;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CategoryService
{
    /**
     * Normalize a raw name and suggest a category based on history or aliases.
     */
    public function analyze(User $user, string $rawName): array
    {
        $normalized = $this->normalizeName($user, $rawName);
        $suggestion = $this->getHistoricalCategory($user, $normalized);

        // Check for anomalies (to be implemented more deeply, but basic check for now)
        return [
            'normalized_name' => $normalized,
            'suggested_category' => $suggestion['category'] ?? 'EXPENSE',
            'confidence' => $suggestion['confidence'] ?? 50,
        ];
    }

    /**
     * Normalize names using PayeeAlias or Regex.
     */
    public function normalizeName(User $user, string $rawName): string
    {
        // 1. Check User Aliases
        $alias = PayeeAlias::where('user_id', $user->id)
            ->where('alias', 'LIKE', '%'.$rawName.'%')
            ->first();

        if ($alias) {
            return $alias->normalized_name;
        }

        // 2. Generic Cleaning (Regex)
        $clean = preg_replace('/[*]\s?TRIP\s?\d*/i', '', $rawName); // Uber *TRIP 123 -> Uber
        $clean = preg_replace('/\d{4,}/', '', $clean); // Remove card numbers or long IDs
        $clean = preg_replace('/\s+(Receipt|Invoice|Payment|Confirmation|Factura)$/i', '', $clean);
        $clean = trim($clean);

        return $clean ?: $rawName;
    }

    /**
     * Look at the last 6 months of life_events to see what category this entity usually falls into.
     */
    protected function getHistoricalCategory(User $user, string $normalizedName): ?array
    {
        // Find entities with similar names
        $entityIds = $user->entities()
            ->where('name', 'LIKE', "%{$normalizedName}%")
            ->pluck('id');

        if ($entityIds->isEmpty()) {
            return null;
        }

        $stats = LifeEvent::whereIn('entity_id', $entityIds)
            ->where('occurred_at', '>=', now()->subMonths(6))
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->orderByDesc('count')
            ->first();

        if ($stats) {
            return [
                'category' => $stats->type,
                'confidence' => 90, // High confidence if we have history
            ];
        }

        return null;
    }

    /**
     * Check if an amount is an anomaly for this entity.
     */
    public function isAnomaly(User $user, string $entityId, float $amount): bool
    {
        $avg = LifeEvent::where('entity_id', $entityId)
            ->where('type', 'EXPENSE')
            ->avg('amount');

        if (! $avg) {
            return false;
        }

        // If amount is 3x the average, it's an anomaly.
        return abs($amount) > (abs($avg) * 3);
    }
}
