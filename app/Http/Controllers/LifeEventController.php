<?php

namespace App\Http\Controllers;

use App\Models\LifeEvent;
use Illuminate\Http\Request;

class LifeEventController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'entity_id' => 'required|exists:entities,id',
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric',
            'type' => 'required|string|in:PAYMENT,INCOME,SERVICE,CALIBRATION,MILESTONE,EXPENSE',
            'occurred_at' => 'required|date',
        ]);

        // Ensure user owns the entity
        $entity = \App\Models\Entity::findOrFail($validated['entity_id']);
        if ($request->user()->id !== $entity->user_id) {
            abort(403);
        }

        $request->user()->lifeEvents()->create(array_merge($validated, [
            'status' => 'COMPLETED',
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
            'entity_id' => 'sometimes|exists:entities,id',
            'description' => 'sometimes|string|nullable',
        ]);

        $lifeEvent->update($validated);

        return redirect()->back()->with('success', 'Evento actualizado.');
    }

    public function destroy(Request $request, $id)
    {
        if (! str_contains($id, ',')) {
            $event = LifeEvent::findOrFail($id);
            if ($request->user()->id !== $event->user_id) {
                abort(403);
            }
            $event->delete();

            return redirect()->back()->with('success', 'Evento eliminado.');
        }

        $ids = explode(',', $id);
        $request->user()->lifeEvents()->whereIn('id', $ids)->delete();

        return redirect()->back()->with('success', count($ids).' eventos eliminados.');
    }
}
