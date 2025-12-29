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
        // Build minimal context: just [id, name] pairs for entity mapping
        $entityContext = $user->entities()
            ->select('id', 'name')
            ->where('status', 'ACTIVE')
            ->get()
            ->map(function ($e) {
                return "{$e->id}, {$e->name}";
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
        $entityContext = empty($entityContext) ? 'NO ENTITIES' : $entityContext;
        $date = now()->format('Y-m-d');

        return <<<EOT
You are the CIVID Router. Map user input to one of these tools:

1. record_payment(entity_id, amount, date) - Register a payment/expense
2. calibrate_odometer(entity_id, reading) - Update vehicle odometer
3. create_entity(category, name, balance) - Create new entity

TODAY: $date
ENTITIES (id, name):
$entityContext

RULES:
- Map entity names to IDs from the list above
- Return JSON array: {"actions": [{"tool": "name", "params": {...}}]}
- Multiple actions allowed in one response
- If input is security command (delete/remove/confirm), return {"actions": []}
- If ambiguous, return {"actions": [], "clarification": "brief question"}

OUTPUT FORMAT:
{"actions": [{"tool": "record_payment", "params": {"entity_id": "uuid", "amount": -500, "date": "2025-12-28"}}]}
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
                                                'enum' => ['record_payment', 'calibrate_odometer', 'create_entity'],
                                            ],
                                            'params' => [
                                                'type' => 'object',
                                                'properties' => [
                                                    'entity_id' => ['type' => 'string', 'description' => 'UUID of the entity'],
                                                    'amount' => ['type' => 'number', 'description' => 'Payment amount (negative for expenses)'],
                                                    'date' => ['type' => 'string', 'description' => 'YYYY-MM-DD format'],
                                                    'reading' => ['type' => 'number', 'description' => 'Odometer reading'],
                                                    'category' => ['type' => 'string', 'enum' => ['FINANCE', 'ASSET', 'HEALTH', 'PROJECT']],
                                                    'name' => ['type' => 'string', 'description' => 'Entity name'],
                                                    'balance' => ['type' => 'number', 'description' => 'Initial balance', 'nullable' => true],
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
