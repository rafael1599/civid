<?php

namespace App\Services;

use App\AI\ToolRegistry;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IngestionService
{
    public function __construct(protected ToolRegistry $registry)
    {
    }

    /**
     * The core brain of the ingestion system.
     */
    public function handle(string|UploadedFile $input, User $user): array
    {
        // 1. Build basic context (The Map)
        $entityContext = $user->entities()
            ->select('id', 'name', 'category', 'status')
            ->where('status', 'ACTIVE')
            ->get()
            ->map(fn($e) => "{id: \"{$e->id}\", name: \"{$e->name}\", category: \"{$e->category}\"}")
            ->implode("\n");

        $userMessage = $input instanceof UploadedFile ? 'Procesa este archivo (simulado por ahora).' : $input;

        // 2. First Pass: Get initial intent and see if we need tools
        $response = $this->queryLLM($entityContext, $userMessage);

        // 3. Chain reasoning: If the LLM requested an analytics tool, execute it and feed back
        $needsAnalytics = collect($response['actions'] ?? [])->firstWhere('tool', 'read_analytics');

        if ($needsAnalytics) {
            $tool = $this->registry->getTool('read_analytics');
            $analysisResult = $tool->execute($needsAnalytics['params']);

            // Second Pass: Ask LLM to draft the final response based on the "Pull" data
            $secondMessage = "He ejecutado el análisis solicitado. Resultado:\n" . json_encode($analysisResult) . "\n\nAhora, redacta la respuesta final para el usuario en el campo 'analysis' y mantén las otras acciones si son necesarias.";
            $response = $this->queryLLM($entityContext, $userMessage, $secondMessage);
        }

        return $response;
    }

    protected function buildSystemPrompt(string $entityContext): string
    {
        $entityContext = empty($entityContext) ? 'SIN ENTIDADES EXISTENTES' : $entityContext;
        $date = now()->toDateString();
        $toolSchema = json_encode($this->registry->getJsonSchemaForTools(), JSON_PRETTY_PRINT);

        return <<<EOT
CONTESTO DE MISIÓN:
Eres un Agente de Planificación Inteligente para CIVID (Personal ERP).
Tu misión es mapear la intención del usuario a acciones específicas.

ESTRATEGIA DE HERRAMIENTAS (MCP Pattern):
- Eres capaz de "PULL" datos usando herramientas de lectura.
- Si el usuario hace una pregunta sobre el pasado o pide un resumen, USA 'read_analytics' primero.
- Para cambios en el sistema, usa herramientas de escritura.

MAPA DE ENTIDADES (Contexto):
$entityContext

FECHA ACTUAL: $date

CATÁLOGO DE HERRAMIENTAS (JsonSchema):
$toolSchema

REGLAS DE RAZONAMIENTO:
1. Mapeo de IDs: Usa siempre el UUID del Mapa de Entidades si el usuario se refiere a algo existente.
2. Pensamiento Agente: Si no tienes el dato (ej. "¿Cuánto gasté?"), llama a 'read_analytics'.
3. Análisis: Redacta una respuesta natural y útil en el campo 'analysis' del JSON.
4. Chaining: Puedes ejecutar múltiples acciones en un solo plan.

OUTPUT FORMAT:
{"actions": [{"tool": "name", "params": {...}}], "analysis": "Tu respuesta aquí", "clarification": null}
EOT;
    }

    protected function queryLLM(string $entityContext, string $userMessage, ?string $agentFeedback = null): array
    {
        $apiKey = env('GEMINI_API_KEY');
        if (empty($apiKey)) {
            return ['actions' => [], 'error' => 'API Key no configurada.'];
        }

        $prompt = $this->buildSystemPrompt($entityContext);
        $contents = [
            ['parts' => [['text' => $prompt . "\n\nUSER INPUT:\n" . $userMessage]]],
        ];

        if ($agentFeedback) {
            $contents[] = ['role' => 'model', 'parts' => [['text' => 'ENTENDIDO. Estoy procesando e identificaré si necesito herramientas.']]]; // Simulating history
            $contents[] = ['role' => 'user', 'parts' => [['text' => $agentFeedback]]];
        }

        try {
            $response = Http::timeout(45)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={$apiKey}", [
                    'contents' => $contents,
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature' => 0.1,
                    ],
                ]);

            if (!$response->successful()) {
                $errorBody = $response->body();
                Log::error('Gemini API Error', ['body' => $errorBody]);

                // Extract specific error message if possible
                $errorData = json_decode($errorBody, true);
                $reason = $errorData['error']['message'] ?? 'Error de API desconocido';

                return ['actions' => [], 'error' => "Gemini API Error ({$response->status()}): {$reason}"];
            }

            $data = $response->json();
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
            $parsed = json_decode($text, true);

            return $parsed ?? ['actions' => [], 'analysis' => 'No pude procesar la respuesta.'];

        } catch (\Exception $e) {
            Log::error('Ingestion failed', ['msg' => $e->getMessage()]);
            return ['actions' => [], 'error' => $e->getMessage()];
        }
    }
}
