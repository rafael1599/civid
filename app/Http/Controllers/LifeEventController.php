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
            'type' => 'sometimes|string|in:PAYMENT,INCOME,SERVICE,CALIBRATION,MILESTONE,EXPENSE,TRANSFER',
            'status' => 'sometimes|string|in:COMPLETED,SCHEDULED,PAID',
            'description' => 'sometimes|string|nullable',
            'from_entity_id' => 'sometimes|nullable|exists:entities,id',
            'to_entity_id' => 'sometimes|nullable|exists:entities,id',
        ]);

        // Ensure user owns the entity if provided
        if (! empty($validated['entity_id'])) {
            $entity = \App\Models\Entity::findOrFail($validated['entity_id']);
            if ($request->user()->id !== $entity->user_id) {
                abort(403);
            }
        }

        if ($validated['type'] === 'TRANSFER') {
            $fromEntityId = $request->input('from_entity_id');
            $toEntityId = $request->input('to_entity_id');

            if (! $fromEntityId || ! $toEntityId) {
                return redirect()->back()->withErrors(['transfer' => 'Se requieren ambas billeteras para una transferencia.']);
            }

            if ($fromEntityId === $toEntityId) {
                return redirect()->back()->withErrors(['transfer' => 'No puedes transferir fondos a la misma billetera.']);
            }

            $amount = abs($validated['amount']);
            $isFuture = \Carbon\Carbon::parse($validated['occurred_at'])->isFuture();
            $status = $validated['status'] ?? ($isFuture ? 'SCHEDULED' : 'COMPLETED');

            // 1. Withdrawal from source
            $request->user()->lifeEvents()->create([
                'entity_id' => $fromEntityId,
                'title' => 'Transferencia: '.$validated['title'],
                'amount' => -$amount,
                'occurred_at' => $validated['occurred_at'],
                'type' => 'EXPENSE',
                'status' => $status,
                'description' => $validated['description'] ?? null,
                'metadata' => ['source' => 'transfer_out'],
            ]);

            // 2. Deposit to target
            $request->user()->lifeEvents()->create([
                'entity_id' => $toEntityId,
                'title' => 'Transferencia: '.$validated['title'],
                'amount' => $amount,
                'occurred_at' => $validated['occurred_at'],
                'type' => 'INCOME',
                'status' => $status,
                'description' => $validated['description'] ?? null,
                'metadata' => ['source' => 'transfer_in'],
            ]);
        } else {
            $isFuture = \Carbon\Carbon::parse($validated['occurred_at'])->isFuture();
            $status = $validated['status'] ?? ($isFuture ? 'SCHEDULED' : 'COMPLETED');

            // Strict white-list for the life_events table to prevent SQL errors with extra fields
            $data = collect($validated)->only([
                'entity_id',
                'title',
                'amount',
                'occurred_at',
                'type',
                'status',
                'description',
            ])->toArray();

            $request->user()->lifeEvents()->create(array_merge($data, [
                'type' => $data['type'] ?? ($data['amount'] < 0 ? 'EXPENSE' : 'INCOME'),
                'status' => $status,
                'metadata' => ['source' => 'manual_entry'],
            ]));
        }

        return redirect()->back()->with('success', 'Evento registrado correctamente.');
    }

    /**
     * Suggest a category/entity based on the title.
     */
    public function suggestCategory(Request $request, \App\Services\CategoryService $categoryService)
    {
        $title = $request->query('title');

        if (! $title) {
            return response()->json(['suggestion' => null]);
        }

        $result = $categoryService->analyze($request->user(), $title);

        // Try to find an entity that matches the normalized name
        $entity = $request->user()->entities()
            ->where('name', 'LIKE', '%'.$result['normalized_name'].'%')
            ->first(['id', 'name', 'category']);

        return response()->json([
            'normalized_name' => $result['normalized_name'],
            'suggested_category' => $result['suggested_category'],
            'confidence' => $result['confidence'],
            'entity' => $entity,
        ]);
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
