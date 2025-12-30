<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IngestionService
{
    /**
     * The core brain of the ingestion system.
     * It takes raw input (text or file) and returns a structured DRAFT action.
     * It DOES NOT write to the DB directly (unless it's a log).
     */
    public function handle(string|UploadedFile $input, User $user): array
    {
        // Build rich context: [id, name, category] for better inference
        $entityContext = $user->entities()
            ->select('id', 'name', 'category')
            ->where('status', 'ACTIVE')
            ->get()
            ->map(function ($e) {
                return "{id: \"{$e->id}\", name: \"{$e->name}\", category: \"{$e->category}\"}";
            })
            ->implode("\n");

        $prompt = $this->buildSystemPrompt($entityContext);
        $userMessage = $input instanceof UploadedFile ? 'Procesa este archivo (simulado por ahora).' : $input;

        // Call LLM
        $response = $this->queryLLM($prompt, $userMessage);

        return $response;
    }

    protected function buildSystemPrompt(string $entityContext): string
    {
        $entityContext = empty($entityContext) ? 'NO EXISTING ENTITIES' : $entityContext;
        $date = now()->format('Y-m-d');

        return <<<EOT
System Prompt: CIVID Intelligence Router v2.0

1. Identidad y Misión
Eres el motor de inteligencia de CIVID. Tu objetivo es mapear el lenguaje natural del usuario a acciones atómicas de base de datos.
Razona siguiendo los Primeros Principios: reduce la entrada del usuario a su esencia financiera u operativa.

2. Herramientas Disponibles (Catálogo Atómico)
- upsert_entity(category, name, balance, metadata): Crea o actualiza una entidad. Úsala si el usuario menciona una cuenta, activo, seguro o servicio que no existe o necesita ajuste.
- record_event(temp_id, entity_id, type, amount, date, note): Registra una transacción o hito.
  Types: PAYMENT, MILESTONE (ej. odómetro), EXPENSE, INCOME.
  Nota: Gastos/Pagos son negativos, Ingresos son positivos.
- link_entities(parent_id, child_id, relationship_type): Define el grafo.
  Types: covers (Seguro -> Activo), finances (Banco -> Activo), pays_from (Gasto -> Cuenta).
- set_recurrence(event_id, frequency, interval): Convierte un evento en recurrente.
  Frequency: monthly, yearly, weekly.

3. Contexto Actual (Inyectado)
IMPORTANTE: Aquí están las entidades existentes. Usa estos IDs si el usuario se refiere a ellas:

$entityContext

TODAY: $date

4. Reglas de Razonamiento (The Algorithm)
- Inferencia de Relaciones: Si el usuario dice "Pagué el seguro de mi Toyota", asume que existe una relación 'covers' entre el Seguro y el Toyota. Si no está linkeado, dispara link_entities usando "new:EntityName" si acabas de crearla.
- Multi-Acción: Un solo mensaje puede generar múltiples herramientas. Ejecútalas en orden lógico.
- Búsqueda Semántica: Si el usuario dice "Sienna", mapealo al ID del "Toyota Sienna 2022" presentado en el contexto.
- Balance Negativo: Todo lo que sea "pago", "costo", "factura" o "gasto" debe registrarse con un amount negativo.
- IDs Temporales:
  - Para entidades nuevas, usa "new:EntityName" como ID en acciones subsecuentes.
  - Para eventos que necesitan recurrencia, asigna un 'temp_id' arbitrario (ej. "evt_1") en record_event y úsalo en set_recurrence.

5. Ejemplos de Entrenamiento (Few-Shot)
Usuario: "Compré un seguro Geico para mi Sienna por $120 al mes"
Output:
{
  "actions": [
    { "tool": "upsert_entity", "params": { "category": "SERVICE", "name": "Geico", "balance": 0 } },
    { "tool": "link_entities", "params": { "parent_id": "new:Geico", "child_id": "{ID_DE_SIENNA}", "relationship_type": "covers" } },
    { "tool": "record_event", "params": { "temp_id": "evt_1", "entity_id": "new:Geico", "type": "EXPENSE", "amount": -120, "date": "$date", "note": "Mensualidad Seguro" } },
    { "tool": "set_recurrence", "params": { "event_id": "evt_1", "frequency": "monthly", "interval": 1 } }
  ]
}

Usuario: "El odómetro de la Sienna marcó 35,000 millas"
Output:
{
  "actions": [
    { "tool": "record_event", "params": { "entity_id": "{ID_DE_SIENNA}", "type": "MILESTONE", "amount": 35000, "date": "$date", "note": "Odometer reading" } }
  ]
}

OUTPUT FORMAT:
{"actions": [{"tool": "tool_name", "params": {...}}]}
EOT;
    }

    protected function queryLLM(string $systemPrompt, string $userMessage): array
    {
        $apiKey = env('GEMINI_API_KEY');

        if (empty($apiKey)) {
            Log::warning('GEMINI_API_KEY not configured');

            return [
                'actions' => [],
                'error' => 'API Key no configurada. Configura GEMINI_API_KEY en .env',
            ];
        }

        try {
            // Updated for Gemini 3: Using 'gemini-3-flash-preview' and structured JSON schema
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::timeout(30)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $systemPrompt . "\n\nUSER INPUT:\n" . $userMessage],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'responseJsonSchema' => [
                            'type' => 'object',
                            'properties' => [
                                'actions' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'tool' => [
                                                'type' => 'string',
                                                'enum' => ['upsert_entity', 'link_entities', 'record_event', 'set_recurrence'],
                                            ],
                                            'params' => [
                                                'type' => 'object',
                                                'properties' => [
                                                    // upsert_entity params
                                                    'category' => ['type' => 'string', 'enum' => ['FINANCE', 'ASSET', 'HEALTH', 'PROJECT', 'SERVICE']],
                                                    'name' => ['type' => 'string', 'description' => 'Entity name'],
                                                    'metadata' => ['type' => 'object', 'description' => 'Flexible metadata', 'nullable' => true],
                                                    'balance' => ['type' => 'number', 'description' => 'Initial balance', 'nullable' => true],

                                                    // link_entities params
                                                    'subject_id' => ['type' => 'string', 'description' => 'Entity ID or find-by-name:Name or new:Name'],
                                                    'relation' => ['type' => 'string', 'enum' => ['covers', 'linked_to', 'depends_on', 'insures', 'finances', 'pays_from']],
                                                    'object_id' => ['type' => 'string', 'description' => 'Entity ID or find-by-name:Name'],

                                                    // record_event params
                                                    'temp_id' => ['type' => 'string', 'description' => 'Arbitrary ID (e.g. evt_1) for recurrence', 'nullable' => true],
                                                    'entity_id' => ['type' => 'string', 'description' => 'Entity ID or find-by-name:Name or new:Name'],
                                                    'type' => ['type' => 'string', 'enum' => ['PAYMENT', 'INCOME', 'SERVICE', 'CALIBRATION', 'MILESTONE', 'EXPENSE']],
                                                    'amount' => ['type' => 'number', 'description' => 'Value (negative for expenses)'],
                                                    'date' => ['type' => 'string', 'description' => 'YYYY-MM-DD format'],
                                                    'note' => ['type' => 'string', 'description' => 'Event description/title'],

                                                    // set_recurrence params
                                                    'event_id' => ['type' => 'string', 'description' => 'temp_id of event'],
                                                    'frequency' => ['type' => 'string', 'enum' => ['monthly', 'yearly', 'weekly']],
                                                    'interval' => ['type' => 'number', 'description' => 'Interval', 'nullable' => true],
                                                ],
                                            ],
                                        ],
                                        'required' => ['tool', 'params'],
                                    ],
                                ],
                                'clarification' => [
                                    'type' => 'string',
                                    'description' => 'Question to ask user if input is ambiguous',
                                    'nullable' => true,
                                ],
                            ],
                            'required' => ['actions'],
                        ],
                        'thinkingConfig' => [
                            'thinkingLevel' => 'low',
                        ],
                        'temperature' => 0.1,
                    ],
                ]);

            if (!$response->successful()) {
                Log::error('Gemini 3 API error', ['status' => $response->status(), 'body' => $response->body()]);

                return [
                    'actions' => [],
                    'error' => 'Error al conectar con Gemini 3 API: ' . $response->status(),
                ];
            }

            $data = $response->json();
            $generatedText = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $parsed = json_decode($generatedText, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to parse Gemini 3 JSON response', ['text' => $generatedText]);

                return [
                    'actions' => [],
                    'error' => 'La IA devolvió un formato inválido.',
                ];
            }

            return $parsed;

        } catch (\Exception $e) {
            Log::error('Gemini 3 API exception', ['message' => $e->getMessage()]);

            return [
                'actions' => [],
                'error' => 'Error del sistema: ' . $e->getMessage(),
            ];
        }
    }
}
