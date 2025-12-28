<?php

namespace App\Observers;

use App\Models\LifeEvent;
use App\Models\Entity;

class LifeEventObserver
{
    /**
     * Handle the LifeEvent "created" event.
     */
    public function created(LifeEvent $lifeEvent): void
    {
        $this->updateFinanceBalance($lifeEvent);
    }

    /**
     * Handle the LifeEvent "deleted" event.
     */
    public function deleted(LifeEvent $lifeEvent): void
    {
        $this->reverseFinanceBalance($lifeEvent);
    }

    /**
     * Update the remaining balance and amortization of a finance entity when a payment is made.
     */
    protected function updateFinanceBalance(LifeEvent $lifeEvent): void
    {
        // Only process PAYMENT or AMORTIZATION events
        if (!in_array($lifeEvent->type, ['PAYMENT', 'AMORTIZATION'])) {
            return;
        }

        // Only process if status is PAID or COMPLETED
        if (!in_array($lifeEvent->status, ['PAID', 'COMPLETED'])) {
            return;
        }

        // --- IDEMPOTENCY CHECK ---
        if ($lifeEvent->metadata['processed'] ?? false) {
            return;
        }

        // Only process if linked to an entity
        if (!$lifeEvent->entity_id) {
            return;
        }

        // Get the linked entity
        $entity = Entity::find($lifeEvent->entity_id);

        if (!$entity || $entity->category !== 'FINANCE') {
            return;
        }

        // Get current metadata
        $metadata = $entity->metadata ?? [];
        $paymentAmount = abs($lifeEvent->amount);

        // --- Advanced Amortization Logic ---
        if (isset($metadata['annual_rate']) && isset($metadata['remaining_principal'])) {
            $annualRate = (float) $metadata['annual_rate'];
            $remainingPrincipal = (float) $metadata['remaining_principal'];

            // Check if it's an extra principal payment
            $isExtraPrincipal = (bool) ($lifeEvent->metadata['is_extra_principal'] ?? false);

            $interestPortion = 0;
            $principalPortion = $paymentAmount;

            if (!$isExtraPrincipal) {
                // Regular Payment: Split into Interest and Principal
                $interestPortion = $remainingPrincipal * ($annualRate / 12);
                $principalPortion = $paymentAmount - $interestPortion;
            } else {
                // Extra Principal: Calculate "Interest Saved"
                $remainingPayments = (int) ($metadata['remaining_payments'] ?? 0);
                $interestSaved = $paymentAmount * ($annualRate / 12) * $remainingPayments;
                $metadata['savings_accumulated'] = ($metadata['savings_accumulated'] ?? 0) + $interestSaved;
            }

            // Update Principal and Interest Tracking
            $metadata['remaining_principal'] = max(0, $remainingPrincipal - $principalPortion);
            $metadata['interest_paid_to_date'] = ($metadata['interest_paid_to_date'] ?? 0) + $interestPortion;

            // Sync traditional balance fields
            $metadata['balance'] = $metadata['remaining_principal'];
            $metadata['remaining_balance'] = $metadata['remaining_principal'];

            // Store the split in the event for auditing and reversal
            $eventMeta = $lifeEvent->metadata ?? [];
            $eventMeta['split'] = [
                'principal' => round($principalPortion, 2),
                'interest' => round($interestPortion, 2),
                'savings' => $isExtraPrincipal ? round($interestSaved, 2) : 0
            ];
            $eventMeta['processed'] = true; // MARK AS PROCESSED
            $lifeEvent->metadata = $eventMeta;
            $lifeEvent->saveQuietly();
        } else {
            // Fallback to simple balance reduction
            $currentBalance = $metadata['remaining_balance'] ?? $metadata['balance'] ?? 0;
            $newBalance = $currentBalance - $paymentAmount;
            $metadata['remaining_balance'] = max(0, $newBalance);
            $metadata['balance'] = max(0, $newBalance);

            // Mark as processed
            $eventMeta = $lifeEvent->metadata ?? [];
            $eventMeta['processed'] = true;
            $lifeEvent->metadata = $eventMeta;
            $lifeEvent->saveQuietly();
        }

        // Save without triggering observers again
        $entity->metadata = $metadata;
        $entity->saveQuietly();
    }

    /**
     * Reverse the financial impact of a deleted payment.
     */
    protected function reverseFinanceBalance(LifeEvent $lifeEvent): void
    {
        if (!in_array($lifeEvent->type, ['PAYMENT', 'AMORTIZATION']) || !$lifeEvent->entity_id) {
            return;
        }

        // ONLY REVERSE IF IT WAS PROCESSED
        if (!($lifeEvent->metadata['processed'] ?? false)) {
            return;
        }

        $entity = Entity::find($lifeEvent->entity_id);
        if (!$entity || $entity->category !== 'FINANCE') {
            return;
        }

        $metadata = $entity->metadata ?? [];
        $split = $lifeEvent->metadata['split'] ?? null;

        if ($split && isset($metadata['remaining_principal'])) {
            // Revert split logic
            $principalPortion = (float) ($split['principal'] ?? 0);
            $interestPortion = (float) ($split['interest'] ?? 0);
            $savingsPortion = (float) ($split['savings'] ?? 0);

            $metadata['remaining_principal'] = ($metadata['remaining_principal'] ?? 0) + $principalPortion;
            $metadata['interest_paid_to_date'] = max(0, ($metadata['interest_paid_to_date'] ?? 0) - $interestPortion);
            $metadata['savings_accumulated'] = max(0, ($metadata['savings_accumulated'] ?? 0) - $savingsPortion);

            // Sync traditional balance fields
            $metadata['balance'] = $metadata['remaining_principal'];
            $metadata['remaining_balance'] = $metadata['remaining_principal'];
        } else {
            // Fallback: simple balance restoration
            $paymentAmount = abs($lifeEvent->amount);
            $currentBalance = $metadata['remaining_balance'] ?? $metadata['balance'] ?? 0;
            $newBalance = $currentBalance + $paymentAmount;
            $metadata['remaining_balance'] = $newBalance;
            $metadata['balance'] = $newBalance;
        }

        $entity->metadata = $metadata;
        $entity->saveQuietly();
    }
}
