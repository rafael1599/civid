<?php

namespace App\Http\Controllers;

use App\Models\Entity;
use Illuminate\Http\Request;
use Inertia\Inertia;

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

        // --- Asset Health Data (Virtual Odometer) ---
        $health = null;
        if ($entity->category === 'ASSET') {
            $nextService = \App\Models\LifeEvent::where('entity_id', $entity->id)
                ->where('type', 'SERVICE')
                ->where('status', 'SCHEDULED')
                ->orderBy('occurred_at', 'asc')
                ->first();

            $health = [
                'virtual_odometer' => $entity->virtual_odometer,
                'last_manual_odometer' => $entity->metadata['last_manual_odometer'] ?? null,
                'daily_avg' => $entity->metadata['daily_avg_usage'] ?? null,
                'next_service' => $nextService ? [
                    'title' => $nextService->title,
                    'date' => $nextService->occurred_at->format('Y-m-d'),
                    'target_odometer' => $nextService->metadata['projected_at_odometer'] ?? null,
                    'days_left' => now()->diffInDays($nextService->occurred_at, false),
                ] : null,
            ];
        }

        return Inertia::render('Entities/Show', [
            'entity' => $entity,
            'alert_status' => $alertStatus,
            'next_urgent_event' => $nextUrgentEvent,
            'health' => $health,
        ]);
    }

    public function update(Request $request, Entity $entity)
    {
        // Check authorization (implicit via route model binding + auth middleware, but explicitly checking ownership is good practice)
        if ($request->user()->id !== $entity->user_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|in:ASSET,LIABILITY,INCOME,EXPENSE,PROJECT,GOAL,SERVICE,HEALTH,FINANCE,DOCUMENT,LOCATION',
            'status' => 'sometimes|string|in:ACTIVE,ARCHIVED,COMPLETED',
            'metadata' => 'sometimes|array',
        ]);

        $entity->update($validated);

        return redirect()->back()->with('success', 'Entidad actualizada correctamente.');
    }

    public function destroy(Request $request, Entity $entity)
    {
        // Check authorization
        if ($request->user()->id !== $entity->user_id) {
            abort(403);
        }

        $entity->delete();

        return redirect()->route('dashboard')->with('success', 'Entidad eliminada correctamente.');
    }
}
