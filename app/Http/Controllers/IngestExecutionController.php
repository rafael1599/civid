<?php

namespace App\Http\Controllers;

use App\Models\LifeEvent;
use App\Models\Entity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IngestExecutionController extends Controller
{
    public function __invoke(Request $request)
    {
        $draft = $request->validate([
            'action' => 'required|string',
            'entity_id' => 'nullable|uuid',
            'entity_name' => 'nullable|string',
            'data' => 'required|array',
        ]);

        return DB::transaction(function () use ($draft, $request) {
            $user = $request->user();

            if ($draft['action'] === 'CREATE_EVENT') {
                $event = $user->lifeEvents()->create([
                    'entity_id' => $draft['entity_id'] ?? null,
                    'title' => $draft['data']['title'] ?? 'Evento Importado',
                    'amount' => $draft['data']['amount'] ?? 0,
                    'occurred_at' => $draft['data']['occurred_at'] ?? now(),
                    'type' => ($draft['data']['amount'] ?? 0) >= 0 ? 'INCOME' : 'EXPENSE',
                    'status' => 'COMPLETED',
                    'metadata' => [
                        'source' => 'autonomous_ingestion',
                        'original_entity_name' => $draft['entity_name']
                    ]
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Evento creado exitosamente',
                    'event' => $event
                ]);
            }

            // TODO: Implement CREATE_ENTITY or UPDATE_EVENT logic if needed

            return response()->json([
                'success' => false,
                'message' => 'Acción no soportada todavía: ' . $draft['action']
            ], 422);
        });
    }
}
