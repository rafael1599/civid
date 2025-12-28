<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\Entity;
use Illuminate\Support\Str;

class EntityRelationshipController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'parent_id' => 'required|uuid|exists:entities,id',
            'child_id' => 'required|uuid|exists:entities,id|different:parent_id',
            'type' => ['required', 'string', Rule::in(['INSURED_BY', 'FINANCED_BY', 'LOCATED_IN', 'OWNED_BY', 'PART_OF', 'PAID_FROM'])],
        ]);

        $parent = Entity::findOrFail($validated['parent_id']);

        // Check if relationship already exists
        $exists = $parent->children()
            ->where('child_entity_id', $validated['child_id'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['child_id' => 'Esta relación ya existe.']);
        }

        $parent->children()->attach($validated['child_id'], [
            'id' => (string) Str::uuid(),
            'relationship_type' => $validated['type']
        ]);

        return back();
    }
    public function destroy(Entity $entity, Entity $child)
    {
        $entity->children()->detach($child->id);

        return back();
    }
}
