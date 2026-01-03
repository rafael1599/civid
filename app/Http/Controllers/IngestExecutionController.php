<?php

namespace App\Http\Controllers;

use App\Services\IngestionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IngestExecutionController extends Controller
{
    public function __invoke(Request $request, IngestionService $ingestion)
    {
        try {
            $validated = $request->validate([
                'actions' => 'required|array',
                'actions.*.tool' => 'required|string|in:upsert_entity,link_entities,record_event,record_financial_event,set_recurrence',
                'actions.*.params' => 'required|array',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::warning('Execution validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all(),
            ]);
            throw $e;
        }

        try {
            return DB::transaction(function () use ($validated, $request, $ingestion) {
                // Execute actions using the central service
                $results = $ingestion->executeActions($validated, $request->user());

                // If all succeeded, redirect with success
                $allSucceeded = collect($results)->every(fn ($r) => $r['success']);
                if ($allSucceeded) {
                    $message = count($results) > 1
                        ? count($results).' acciones procesadas con éxito'
                        : ($results[0]['message'] ?? 'Acción completada');

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
}
