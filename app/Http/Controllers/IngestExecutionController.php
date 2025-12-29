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
            'actions.*.tool' => 'required|string|in:record_payment,calibrate_odometer,create_entity',
            'actions.*.params' => 'required|array',
        ]);

        try {
            return DB::transaction(function () use ($validated, $request) {
                $user = $request->user();
                $results = [];

                // Process each action in the array
                foreach ($validated['actions'] as $action) {
                    $tool = $action['tool'];
                    $params = $action['params'];

                    $result = match ($tool) {
                        'record_payment' => $this->recordPayment($user, $params),
                        'calibrate_odometer' => $this->calibrateOdometer($user, $params),
                        'create_entity' => $this->createEntity($user, $params),
                        default => ['success' => false, 'message' => "Unknown tool: {$tool}"]
                    };

                    $results[] = $result;
                }

                // If all succeeded, redirect with success
                $allSucceeded = collect($results)->every(fn ($r) => $r['success']);
                if ($allSucceeded) {
                    $message = count($results) > 1
                        ? count($results).' acciones procesadas con éxito'
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

            return redirect()->back()->with('error', 'Error interno al procesar las acciones: '.$e->getMessage());
        }
    }

    protected function recordPayment($user, array $params): array
    {
        // Validate required params
        if (! isset($params['entity_id'], $params['amount'], $params['date'])) {
            return ['success' => false, 'message' => 'record_payment requiere: entity_id, amount, date'];
        }

        // Find entity
        $entity = null;
        if (Str::isUuid($params['entity_id'])) {
            $entity = $user->entities()->find($params['entity_id']);
        }

        // Create payment event
        $event = $user->lifeEvents()->create([
            'entity_id' => $entity?->id,
            'title' => 'Pago'.($entity ? ' - '.$entity->name : ''),
            'amount' => $params['amount'],
            'occurred_at' => $params['date'],
            'type' => $params['amount'] >= 0 ? 'INCOME' : 'EXPENSE',
            'status' => 'COMPLETED',
            'metadata' => [
                'source' => 'autonomous_ingestion',
                'tool' => 'record_payment',
                'was_auto_mapped' => ! is_null($entity),
            ],
        ]);

        return ['success' => true, 'message' => 'Pago registrado con éxito'];
    }

    protected function calibrateOdometer($user, array $params): array
    {
        // Validate required params
        if (! isset($params['entity_id'], $params['reading'])) {
            return ['success' => false, 'message' => 'calibrate_odometer requiere: entity_id, reading'];
        }

        // Find entity
        $entity = null;
        if (Str::isUuid($params['entity_id'])) {
            $entity = $user->entities()->find($params['entity_id']);
        }

        if (! $entity || $entity->category !== 'ASSET') {
            return ['success' => false, 'message' => 'Entity must be an ASSET to calibrate odometer'];
        }

        // Update metadata
        $metadata = $entity->metadata ?? [];
        $metadata['last_manual_odometer'] = $params['reading'];
        $metadata['last_manual_odometer_at'] = now()->toDateString();
        $entity->update(['metadata' => $metadata]);

        // Create SERVICE event to record the calibration
        $user->lifeEvents()->create([
            'entity_id' => $entity->id,
            'title' => 'Calibración de Odómetro - '.$entity->name,
            'amount' => 0,
            'occurred_at' => now()->toDateString(),
            'type' => 'SERVICE',
            'status' => 'COMPLETED',
            'metadata' => [
                'source' => 'autonomous_ingestion',
                'tool' => 'calibrate_odometer',
                'odometer_reading' => $params['reading'],
            ],
        ]);

        return ['success' => true, 'message' => "Odómetro actualizado: {$params['reading']} km"];
    }

    protected function createEntity($user, array $params): array
    {
        // Validate required params
        if (! isset($params['category'], $params['name'])) {
            return ['success' => false, 'message' => 'create_entity requiere: category, name'];
        }

        $entity = $user->entities()->create([
            'name' => $params['name'],
            'category' => strtoupper($params['category']),
            'status' => 'ACTIVE',
            'metadata' => [
                'source' => 'autonomous_ingestion',
                'tool' => 'create_entity',
                'initial_balance' => $params['balance'] ?? null,
            ],
        ]);

        // If initial balance provided, create an INCOME event
        if (isset($params['balance']) && $params['balance'] != 0) {
            $user->lifeEvents()->create([
                'entity_id' => $entity->id,
                'title' => 'Balance Inicial - '.$entity->name,
                'amount' => $params['balance'],
                'occurred_at' => now()->toDateString(),
                'type' => $params['balance'] >= 0 ? 'INCOME' : 'EXPENSE',
                'status' => 'COMPLETED',
                'metadata' => [
                    'source' => 'autonomous_ingestion',
                    'is_initial_balance' => true,
                ],
            ]);
        }

        return ['success' => true, 'message' => "Entidad '{$entity->name}' creada exitosamente"];
    }
}
