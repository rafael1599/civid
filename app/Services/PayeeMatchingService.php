<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

class PayeeMatchingService
{
    /**
     * Find matching entity for a given email sender using fuzzy matching
     */
    public function findMatchingEntity(User $user, string $senderEmail, string $senderName): ?\App\Models\Entity
    {
        // Extract domain from email
        $domain = Str::after($senderEmail, '@');

        // Try exact name match first
        $entity = $user->entities()
            ->where('name', 'LIKE', "%{$senderName}%")
            ->first();

        if ($entity) {
            return $entity;
        }

        // Try domain matching (e.g., uber.com -> Uber)
        $domainKeyword = Str::before($domain, '.');

        return $user->entities()
            ->where('name', 'LIKE', "%{$domainKeyword}%")
            ->first();
    }

    /**
     * Normalize merchant name from email subject/body
     */
    public function normalizeMerchantName(string $rawName): string
    {
        // Remove common suffixes
        $normalized = preg_replace('/\s+(Receipt|Invoice|Payment|Confirmation)$/i', '', $rawName);

        // Remove noise words
        $normalized = preg_replace('/^(Your|Order|from|de)\s+/i', '', $normalized);

        return trim($normalized);
    }
}
