<?php

namespace App\Http\Controllers;

use App\Models\LifeEvent;
use Illuminate\Http\Request;

class LifeEventController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'entity_id' => 'nullable|exists:entities,id',
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric',
            'occurred_at' => 'required|date',
            'type' => 'sometimes|string|in:PAYMENT,INCOME,SERVICE,CALIBRATION,MILESTONE,EXPENSE',
            'status' => 'sometimes|string|in:COMPLETED,SCHEDULED,PAID',
            'description' => 'sometimes|string|nullable',
        ]);

        // Ensure user owns the entity if provided
        if (!empty($validated['entity_id'])) {
            $entity = \App\Models\Entity::findOrFail($validated['entity_id']);
            if ($request->user()->id !== $entity->user_id) {
                abort(403);
            }
        }

        $isFuture = \Carbon\Carbon::parse($validated['occurred_at'])->isFuture();
        $status = $validated['status'] ?? ($isFuture ? 'SCHEDULED' : 'COMPLETED');

        $request->user()->lifeEvents()->create(array_merge($validated, [
            'type' => $validated['type'] ?? ($validated['amount'] < 0 ? 'EXPENSE' : 'INCOME'),
            'status' => $status,
            'metadata' => ['source' => 'manual_entry'],
        ]));

        return redirect()->back()->with('success', 'Evento registrado correctamente.');
    }

    public function update(Request $request, LifeEvent $lifeEvent)
    {
        if ($request->user()->id !== $lifeEvent->user_id) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric',
            'occurred_at' => 'sometimes|date',
            'status' => 'sometimes|string|in:COMPLETED,SCHEDULED,PAID',
            'entity_id' => 'nullable|exists:entities,id',
            'description' => 'sometimes|string|nullable',
        ]);

        // If date is changed to future, force status to SCHEDULED
        if (isset($validated['occurred_at']) && \Carbon\Carbon::parse($validated['occurred_at'])->isFuture()) {
            $validated['status'] = 'SCHEDULED';
        }

        $lifeEvent->update($validated);

        return redirect()->back()->with('success', 'Evento actualizado.');
    }

    public function destroy(Request $request, $id)
    {
        if (!str_contains($id, ',')) {
            $event = LifeEvent::findOrFail($id);
            if ($request->user()->id !== $event->user_id) {
                abort(403);
            }
            $event->delete();

            return redirect()->back()->with('success', 'Evento eliminado.');
        }

        $ids = explode(',', $id);
        $request->user()->lifeEvents()->whereIn('id', $ids)->delete();

        return redirect()->back()->with('success', count($ids) . ' eventos eliminados.');
    }
}
