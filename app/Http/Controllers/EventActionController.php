<?php

namespace App\Http\Controllers;

use App\Models\LifeEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventActionController extends Controller
{
    public function markAsPaid(LifeEvent $event)
    {
        // 1. Verify that event is an EXPENSE and SCHEDULED
        if ($event->type !== 'EXPENSE' || $event->status !== 'SCHEDULED') {
            return back()->with('error', 'Solo se pueden liquidar gastos programados.');
        }

        DB::transaction(function () use ($event) {
            // 2. Simplify: Update status to COMPLETED and set date to NOW
            $event->update([
                'status' => 'COMPLETED',
                'occurred_at' => now(),
                'description' => ($event->description ? $event->description . "\n" : "") . "Pagado el " . now()->format('Y-m-d') . " (Transacción regularizada)"
            ]);

            // 3. Smart Recurrence Logic (Keep this)
            $entity = $event->entity;
            if ($entity) {
                $metadata = $entity->metadata ?? [];

                if (isset($metadata['remaining_payments'])) {
                    $remaining = (int) $metadata['remaining_payments'];

                    if ($remaining > 0) {
                        $remaining--;
                        $metadata['remaining_payments'] = $remaining;
                        $entity->metadata = $metadata;
                        $entity->save();

                        if ($remaining > 0) {
                            $nextEvent = $event->replicate();
                            $nextEvent->id = (string) \Illuminate\Support\Str::uuid();
                            // Next commitment stays in the future
                            $nextEvent->occurred_at = \Carbon\Carbon::now()->addMonth();
                            $nextEvent->status = 'SCHEDULED';
                            $nextEvent->description = 'Siguiente compromiso proyectado.';
                            $nextEvent->save();
                        }
                    }
                }
            }
        });

        return back()->with('success', '¡Evento liquidado con éxito!');
    }

    public function unmarkAsPaid(LifeEvent $event)
    {
        // 1. Validation: Must be PAID
        if ($event->status !== 'PAID') {
            return back()->with('error', 'Solo se pueden revertir eventos marcados como pagados.');
        }

        DB::transaction(function () use ($event) {
            $entity = $event->entity;

            // 2. Delete Mirror Transaction
            LifeEvent::where('entity_id', $event->entity_id)
                ->where('type', 'PAYMENT')
                ->where('title', 'like', '%' . $event->title . '%')
                ->where('occurred_at', '>=', now()->subDays(1)) // Safeguard: recent mirrors
                ->get()
                ->each(function ($mirror) {
                    $mirror->delete(); // This triggers the Observer reversal
                });

            // 3. Delete Future Auto-Generated event
            if ($entity && isset($entity->metadata['remaining_payments'])) {
                $nextDate = \Carbon\Carbon::parse($event->occurred_at)->addMonth();

                LifeEvent::where('entity_id', $event->entity_id)
                    ->where('status', 'SCHEDULED')
                    ->where('title', $event->title)
                    ->where('occurred_at', 'like', $nextDate->toDateString() . '%')
                    ->get()
                    ->each(function ($future) {
                        $future->delete();
                    });

                // 4. Restore remaining_payments counter
                $metadata = $entity->metadata;
                $metadata['remaining_payments'] = (int) ($metadata['remaining_payments'] ?? 0) + 1;
                $entity->metadata = $metadata;
                $entity->save();
            }

            // 5. Reset Original Event (Quietly)
            $event->status = 'SCHEDULED';
            $event->description = ($event->description ? $event->description . "\n" : "") . "Pago revertido el " . now()->format('Y-m-d');
            $event->saveQuietly();
        });

        return back()->with('success', '¡Pago revertido y balance restaurado!');
    }
}
