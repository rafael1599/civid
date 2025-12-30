<?php

namespace App\Http\Controllers;

use App\Models\Entity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IngestExecutionController extends Controller
{
    public function __invoke(Request $request)
    {
        $validated = $request->validate([
            'actions' => 'required|array',
            'actions.*.tool' => 'required|string|in:upsert_entity,link_entities,record_event,set_recurrence',
            'actions.*.params' => 'required|array',
        ]);

        try {
            return DB::transaction(function () use ($validated, $request) {
                $user = $request->user();
                $results = [];
                $createdEntities = [];
                $createdEvents = [];

                // Process each action in the array
                foreach ($validated['actions'] as $action) {
                    $tool = $action['tool'];
                    $params = $action['params'];

                    $result = match ($tool) {
                        'upsert_entity' => $this->upsertEntity($user, $params, $createdEntities),
                        'link_entities' => $this->linkEntities($user, $params, $createdEntities),
                        'record_event' => $this->recordEvent($user, $params, $createdEntities, $createdEvents),
                        'set_recurrence' => $this->setRecurrence($user, $params, $createdEvents),
                        default => ['success' => false, 'message' => "Unknown tool: {$tool}"]
                    };

                    $results[] = $result;
                }

                // If all succeeded, redirect with success
                $allSucceeded = collect($results)->every(fn($r) => $r['success']);
                if ($allSucceeded) {
                    $message = count($results) > 1
                        ? count($results) . ' acciones procesadas con éxito'
                        : $results[0]['message'];

                    return redirect()->back()->with('success', $message);
                }

                // Otherwise, show errors
                $errors = collect($results)->where('success', false)->pluck('message')->implode('; ');

                return redirect()->back()->with('error', $errors);
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Ingestion execution failed', [
                'error' => $e->getMessage(),
                'validated' => $validated,
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error', 'Error interno al procesar las acciones: ' . $e->getMessage());
        }
    }

    /**
     * Resolve entity ID from various formats:
     * - UUID: return as-is
     * - "find-by-name:EntityName": find by name
     * - "new:EntityName": find recently created entity by name
     * - "find-first-vehicle": find first ASSET entity
     */
    protected function resolveEntityId($user, string $identifier, array $createdEntities = []): ?string
    {
        // Direct UUID
        if (Str::isUuid($identifier)) {
            return $identifier;
        }

        // find-by-name:EntityName
        if (str_starts_with($identifier, 'find-by-name:')) {
            $name = substr($identifier, 13);
            $entity = $user->entities()
                ->where('name', 'LIKE', "%{$name}%")
                ->where('status', 'ACTIVE')
                ->first();

            return $entity?->id;
        }

        // new:EntityName (from same batch)
        if (str_starts_with($identifier, 'new:')) {
            $name = substr($identifier, 4);

            return $createdEntities[$name] ?? null;
        }

        // find-first-vehicle
        if ($identifier === 'find-first-vehicle') {
            $entity = $user->entities()
                ->where('category', 'ASSET')
                ->where('status', 'ACTIVE')
                ->first();

            return $entity?->id;
        }

        return null;
    }

    protected function upsertEntity($user, array $params, array &$createdEntities): array
    {
        if (!isset($params['category'], $params['name'])) {
            return ['success' => false, 'message' => 'upsert_entity requires: category, name'];
        }

        // Handle special names
        if ($params['name'] === 'find-first-vehicle') {
            $entity = $user->entities()
                ->where('category', 'ASSET')
                ->where('status', 'ACTIVE')
                ->first();

            if (!$entity) {
                return ['success' => false, 'message' => 'No vehicle found'];
            }

            // Update metadata
            if (isset($params['metadata'])) {
                $metadata = array_merge($entity->metadata ?? [], $params['metadata']);
                $entity->update(['metadata' => $metadata]);
            }

            return ['success' => true, 'message' => "Entidad '{$entity->name}' actualizada", 'entity_id' => $entity->id];
        }

        // Find existing by name and category
        $entity = $user->entities()
            ->where('name', $params['name'])
            ->where('category', strtoupper($params['category']))
            ->first();

        if ($entity) {
            // Update existing
            $metadata = array_merge($entity->metadata ?? [], $params['metadata'] ?? []);
            $entity->update(['metadata' => $metadata]);
            $message = "Entidad '{$entity->name}' actualizada";
        } else {
            // Create new
            $entity = $user->entities()->create([
                'name' => $params['name'],
                'category' => strtoupper($params['category']),
                'status' => 'ACTIVE',
                'metadata' => $params['metadata'] ?? [],
            ]);
            $message = "Entidad '{$entity->name}' creada";

            // Create initial balance event if provided
            if (isset($params['balance']) && $params['balance'] != 0) {
                $user->lifeEvents()->create([
                    'entity_id' => $entity->id,
                    'title' => 'Balance Inicial - ' . $entity->name,
                    'amount' => $params['balance'],
                    'occurred_at' => now()->toDateString(),
                    'type' => $params['balance'] >= 0 ? 'INCOME' : 'EXPENSE',
                    'status' => 'COMPLETED',
                    'metadata' => ['source' => 'autonomous_ingestion', 'is_initial_balance' => true],
                ]);
            }
        }

        // Track creation for reference in same batch
        $createdEntities[$params['name']] = $entity->id;

        return ['success' => true, 'message' => $message, 'entity_id' => $entity->id];
    }

    protected function linkEntities($user, array $params, array $createdEntities): array
    {
        if (!isset($params['subject_id'], $params['relation'], $params['object_id'])) {
            return ['success' => false, 'message' => 'link_entities requires: subject_id, relation, object_id'];
        }

        // Resolve IDs (will be enhanced with createdEntities tracking)
        $subjectId = $this->resolveEntityId($user, $params['subject_id'], $createdEntities);
        $objectId = $this->resolveEntityId($user, $params['object_id'], $createdEntities);

        if (!$subjectId || !$objectId) {
            return ['success' => false, 'message' => 'Could not resolve entity IDs'];
        }

        $subject = $user->entities()->find($subjectId);
        $object = $user->entities()->find($objectId);

        if (!$subject || !$object) {
            return ['success' => false, 'message' => 'Both entities must exist'];
        }

        // Create relationship using entity_relationships pivot table
        // Check if relationship already exists
        $existing = \App\Models\EntityRelationship::where('parent_entity_id', $subjectId)
            ->where('child_entity_id', $objectId)
            ->where('relationship_type', $params['relation'])
            ->first();

        if ($existing) {
            return [
                'success' => true,
                'message' => "Relación ya existe: {$subject->name} {$params['relation']} {$object->name}",
            ];
        }

        // Create new relationship
        \App\Models\EntityRelationship::create([
            'parent_entity_id' => $subjectId,
            'child_entity_id' => $objectId,
            'relationship_type' => $params['relation'],
            'metadata' => $params['metadata'] ?? [],
        ]);

        return [
            'success' => true,
            'message' => "{$subject->name} {$params['relation']} {$object->name}",
        ];
    }

    protected function recordEvent($user, array $params, array $createdEntities, array &$createdEvents): array
    {
        if (!isset($params['entity_id'], $params['type'], $params['amount'], $params['date'])) {
            return ['success' => false, 'message' => 'record_event requires: entity_id, type, amount, date'];
        }

        // Resolve entity ID
        $entityId = $this->resolveEntityId($user, $params['entity_id'], $createdEntities);
        $entity = $entityId ? $user->entities()->find($entityId) : null;

        // Create event
        $event = $user->lifeEvents()->create([
            'entity_id' => $entity?->id,
            'title' => $params['note'] ?? ucfirst(strtolower($params['type'])) . ($entity ? ' - ' . $entity->name : ''),
            'amount' => $params['amount'],
            'occurred_at' => $params['date'],
            'type' => $params['type'],
            'status' => 'COMPLETED',
            'metadata' => [
                'source' => 'autonomous_ingestion',
                'tool' => 'record_event',
            ],
        ]);

        // Store event if temp_id provided
        if (!empty($params['temp_id'])) {
            $createdEvents[$params['temp_id']] = $event;
        }

        return ['success' => true, 'message' => 'Evento registrado con éxito'];
    }

    protected function setRecurrence($user, array $params, array $createdEvents): array
    {
        if (!isset($params['event_id'], $params['frequency'])) {
            return ['success' => false, 'message' => 'set_recurrence required event_id and frequency'];
        }

        // Resolve event: either from DB (UUID) or temp_id
        $event = null;
        if (isset($createdEvents[$params['event_id']])) {
            $event = $createdEvents[$params['event_id']];
        } elseif (Str::isUuid($params['event_id'])) {
            $event = $user->lifeEvents()->find($params['event_id']);
        }

        if (!$event) {
            return ['success' => false, 'message' => "Event not found for recurrence: {$params['event_id']}"];
        }

        // Create future events
        $intervalMap = ['monthly' => 'month', 'yearly' => 'year', 'weekly' => 'week'];
        $unit = $intervalMap[$params['frequency']] ?? null;

        if (!$unit) {
            return ['success' => false, 'message' => 'Invalid frequency'];
        }

        $startDate = \Carbon\Carbon::parse($event->occurred_at);
        $intervalCount = $params['interval'] ?? 1;

        for ($i = 1; $i <= 12; $i++) {
            $dueDate = $startDate->copy()->add($unit, $i * $intervalCount);

            $user->lifeEvents()->create([
                'entity_id' => $event->entity_id,
                'title' => $event->title,
                'amount' => $event->amount,
                'occurred_at' => $dueDate->toDateString(),
                'type' => $event->type,
                'status' => 'SCHEDULED',
                'metadata' => ['recurrence_source' => $event->id, 'frequency' => $params['frequency']],
            ]);
        }

        return ['success' => true, 'message' => 'Recurrencia configurada'];
    }
}
