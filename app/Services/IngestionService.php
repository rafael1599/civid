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
        // 1. Build Context (The "Grounding" Data)
        // We need to tell the LLM what entities exist so it can map "Toyota" -> UUID
        $entityContext = $user->entities()
            ->select('id', 'name', 'category')
            ->where('status', 'ACTIVE')
            ->get()
            ->map(function ($e) {
                return "- [{$e->id}] ({$e->category}) {$e->name}";
            })
            ->implode("\n");

        $prompt = $this->buildSystemPrompt($entityContext);
        $userMessage = $input instanceof UploadedFile ? "Procesa este archivo (simulado por ahora)." : $input;

        // 2. Call LLM
        $response = $this->queryLLM($prompt, $userMessage);

        return $response;
    }

    protected function buildSystemPrompt(string $entityContext): string
    {
        $date = now()->format('Y-m-d l');
        return <<<EOT
You are the CIVID Autonomous Assistant. Your goal is to simplify the user's life by converting natural language into structured JSON actions.

TODAY IS: $date

### YOUR KNOWLEDGE OF THE USER'S WORLD (Entities):
$entityContext

### INSTRUCTIONS:
1. Analyze the user's input.
2. Determine the INTENT: 'UPDATE_EVENT', 'CREATE_EVENT', 'CREATE_ENTITY', or 'UNKNOWN'.
3. If the user mentions a known entity (fuzzy match), use its UUID.
4. Extract the AMOUNT, DATE, and TITLE.
5. Return ONLY a JSON object. No markdown, no conversation.

### JSON SCHEMA:
{
    "action": "UPDATE_EVENT" | "CREATE_EVENT" | "CREATE_ENTITY",
    "confidence": 0.0 to 1.0,
    "entity_id": "UUID or null",
    "entity_name": "Name inferred",
    "data": {
        "amount": "float (negative for expense)",
        "occurred_at": "YYYY-MM-DD",
        "title": "Short description",
        "category": "ASSET" | "EXPENSE" | "etc" (only for new entities)
    },
    "reasoning": "Brief explanation of why you chose this."
}
EOT;
    }

    protected function queryLLM(string $systemPrompt, string $userMessage): array
    {
        $apiKey = env('GEMINI_API_KEY');

        if (empty($apiKey)) {
            Log::warning('GEMINI_API_KEY not configured');
            return [
                'action' => 'UNKNOWN',
                'confidence' => 0.0,
                'reasoning' => 'API Key no configurada. Configura GEMINI_API_KEY en .env'
            ];
        }

        try {
            // Updated for Gemini 3: Using 'gemini-3-flash-preview' and structured JSON schema
            $response = Http::timeout(30)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $systemPrompt . "\n\nUSER INPUT:\n" . $userMessage]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'responseJsonSchema' => [
                            'type' => 'object',
                            'properties' => [
                                'action' => ['type' => 'string', 'enum' => ['UPDATE_EVENT', 'CREATE_EVENT', 'CREATE_ENTITY', 'UNKNOWN']],
                                'confidence' => ['type' => 'number'],
                                'entity_id' => ['type' => 'string', 'nullable' => true],
                                'entity_name' => ['type' => 'string'],
                                'data' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'amount' => ['type' => 'number'],
                                        'occurred_at' => ['type' => 'string'],
                                        'title' => ['type' => 'string'],
                                        'category' => ['type' => 'string']
                                    ]
                                ],
                                'reasoning' => ['type' => 'string']
                            ],
                            'required' => ['action', 'confidence', 'data', 'reasoning']
                        ],
                        'thinkingConfig' => [
                            'thinkingLevel' => 'low' // Low for fast reflexive tasks like ingestion
                        ],
                        'temperature' => 0.1,
                    ]
                ]);

            if (!$response->successful()) {
                Log::error('Gemini 3 API error', ['status' => $response->status(), 'body' => $response->body()]);
                return [
                    'action' => 'UNKNOWN',
                    'confidence' => 0.0,
                    'reasoning' => 'Error al conectar con Gemini 3 API: ' . $response->status()
                ];
            }

            $data = $response->json();
            $generatedText = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $parsed = json_decode($generatedText, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to parse Gemini 3 JSON response', ['text' => $generatedText]);
                return [
                    'action' => 'UNKNOWN',
                    'confidence' => 0.0,
                    'reasoning' => 'La IA devolvió un formato inválido.'
                ];
            }

            return $parsed;

        } catch (\Exception $e) {
            Log::error('Gemini 3 API exception', ['message' => $e->getMessage()]);
            return [
                'action' => 'UNKNOWN',
                'confidence' => 0.0,
                'reasoning' => 'Error del sistema: ' . $e->getMessage()
            ];
        }
    }
}
