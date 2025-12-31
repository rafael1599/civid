<?php

namespace App\Http\Controllers;

use App\Services\IngestionService;
use Illuminate\Http\Request;

class IngestController extends Controller
{
    public function __invoke(Request $request, IngestionService $ingestor)
    {
        try {
            $validated = $request->validate([
                'prompt' => 'nullable|string',
                'file' => 'nullable|file|mimes:pdf,jpg,png,jpeg',
            ]);

            if (empty($validated['prompt']) && empty($validated['file'])) {
                return response()->json(['message' => 'Input required'], 422);
            }

            $input = $request->hasFile('file') ? $request->file('file') : $validated['prompt'];

            $draft = $ingestor->handle($input, $request->user());

            // Handle clarification requests
            if (isset($draft['clarification']) && !empty($draft['clarification'])) {
                $msg = is_array($draft['clarification'])
                    ? ($draft['clarification']['question'] ?? json_encode($draft['clarification']))
                    : (string) $draft['clarification'];

                return response()->json([
                    'success' => false,
                    'message' => $msg,
                ], 422);
            }

            // Handle empty actions (invalid input or security commands)
            if (empty($draft['actions'])) {
                return response()->json([
                    'success' => false,
                    'message' => $draft['error'] ?? 'No entendí eso. Prueba con:',
                    'suggestions' => [
                        'Pagué el Toyota $500',
                        'Odo 35000',
                        'Crear entidad: Tarjeta VISA',
                    ],
                ], 422);
            }

            return response()->json([
                'success' => true,
                'draft' => $draft,
                'analysis' => $draft['analysis'] ?? null,
                'original_input' => $validated['prompt'] ?? 'File Upload',
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Ingestion controller failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error en el sistema de ingesta: ' . $e->getMessage(),
            ], 500);
        }
    }
}
