<?php

namespace App\Http\Controllers;

use App\Models\Entity;
use Inertia\Inertia;
use Illuminate\Http\Request;

class EntityController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:ASSET,LIABILITY,INCOME,EXPENSE,PROJECT,GOAL,SERVICE,HEALTH,FINANCE,DOCUMENT,LOCATION',
        ]);

        $entity = $request->user()->entities()->create([
            'name' => $validated['name'],
            'category' => $validated['category'],
            'status' => 'ACTIVE',
        ]);

        return redirect()->back()->with('success', 'Entidad creada correctamente.');
    }

    public function show($id)
    {
        $entity = Entity::with(['children', 'documents'])->findOrFail($id);

        // --- Contextual Cluster IDs ---
        $relatedIds = $entity->children->pluck('id')->push($entity->id);

        // Fetch all life events for this cluster
        $lifeEvents = \App\Models\LifeEvent::whereIn('entity_id', $relatedIds)
            ->orderBy('occurred_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($event) use ($entity) {
                $event->context_label = $event->entity_id === $entity->id ? 'este activo' : ($entity->children->find($event->entity_id)->name ?? 'relacionado');
                return $event;
            });

        $entity->setRelation('life_events', $lifeEvents);

        // --- Semaphore Logic ---
        $now = now()->startOfDay();

        // Get direct children IDs
        $relatedIds = $entity->children->pluck('id')->push($entity->id);

        // Find all SCHEDULED events for this cluster
        $scheduledEvents = \App\Models\LifeEvent::whereIn('entity_id', $relatedIds)
            ->where('status', 'SCHEDULED')
            ->orderBy('occurred_at', 'asc')
            ->get();

        $alertStatus = 'SAFE';
        $nextUrgentEvent = null;

        if ($scheduledEvents->isNotEmpty()) {
            $nextEvent = $scheduledEvents->first();
            $dueDate = \Carbon\Carbon::parse($nextEvent->occurred_at)->startOfDay();
            $daysUntilDue = $now->diffInDays($dueDate, false);

            if ($daysUntilDue <= 3) {
                $alertStatus = 'CRITICAL';
            } elseif ($daysUntilDue < 14) {
                $alertStatus = 'WARNING';
            }

            $nextUrgentEvent = [
                'id' => $nextEvent->id,
                'title' => $nextEvent->title,
                'amount' => $nextEvent->amount,
                'date' => $nextEvent->occurred_at->format('Y-m-d'),
                'days_left' => $daysUntilDue,
                'entity_name' => $nextEvent->entity_id === $entity->id ? 'este activo' : ($entity->children->find($nextEvent->entity_id)->name ?? 'relacionado'),
            ];
        }

        return Inertia::render('Entities/Show', [
            'entity' => $entity,
            'alert_status' => $alertStatus,
            'next_urgent_event' => $nextUrgentEvent,
        ]);
    }
}
