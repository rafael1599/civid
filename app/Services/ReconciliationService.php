<?php

namespace App\Services;

use App\Models\LifeEvent;
use App\Models\User;
use Carbon\Carbon;

class ReconciliationService
{
    /**
     * Try to find a matching event to prevent duplication.
     * Returns the existing event if a match is found.
     */
    public function findMatch(User $user, float $amount, string $date, ?string $entityId = null): ?LifeEvent
    {
        $targetDate = Carbon::parse($date);

        $query = $user->lifeEvents()
            ->whereBetween('occurred_at', [
                $targetDate->copy()->subDay(),
                $targetDate->copy()->addDay(),
            ])
            ->where('amount', $amount);

        if ($entityId) {
            $query->where('entity_id', $entityId);
        }

        return $query->first();
    }

    /**
     * Link a document to an existing event during reconciliation.
     */
    public function linkDocumentToEvent(LifeEvent $event, string $documentId): void
    {
        // To be implemented: Logic to update document's life_event_id
        // $document = Document::find($documentId);
        // $document->update(['life_event_id' => $event->id]);
    }
}
