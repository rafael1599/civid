<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IngestionService
{
    public function __construct(
        protected \App\AI\ToolRegistry $registry,
        protected CategoryService $categoryService,
        protected ReconciliationService $reconciliationService
    ) {}

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
            ->map(fn ($e) => "{id: \"{$e->id}\", name: \"{$e->name}\", category: \"{$e->category}\"}")
            ->implode("\n");

        $media = null;
        $userMessage = $input;

        if ($input instanceof UploadedFile) {
            $mimeType = $input->getMimeType();
            $data = base64_encode($input->get());
            $media = ['mimeType' => $mimeType, 'data' => $data];
            $userMessage = 'Analiza este archivo adjunto y extrae la información relevante.';
        }

        // 2. First Pass: Get initial intent and see if we need tools
        $response = $this->queryLLM($entityContext, $userMessage, null, $media);

        // 3. Chain reasoning: If the LLM requested an analytics tool, execute it and feed back
        $needsAnalytics = collect($response['actions'] ?? [])->firstWhere('tool', 'read_analytics');

        if ($needsAnalytics) {
            $tool = $this->registry->getTool('read_analytics');
            $analysisResult = $tool->execute($needsAnalytics['params']);

            // Second Pass: Ask LLM to draft the final response based on the "Pull" data
            $secondMessage = "He ejecutado el análisis solicitado. Resultado:\n".json_encode($analysisResult)."\n\nAhora, redacta la respuesta final para el usuario en el campo 'analysis' y mantén las otras acciones si son necesarias.";
            $response = $this->queryLLM($entityContext, $userMessage, $secondMessage); // Media not needed again if we have context, or we can pass it if we want rigorous consistence.
            // For efficiency, avoiding resending heavy media if not strictly assumed necessary, but Gemini is stateless.
            // Ideally we pass context, but simpler to just re-ask.
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

    protected function queryLLM(string $entityContext, string $userMessage, ?string $agentFeedback = null, ?array $media = null): array
    {
        $apiKey = env('GEMINI_API_KEY');
        if (empty($apiKey)) {
            return ['actions' => [], 'error' => 'API Key no configurada.'];
        }

        $prompt = $this->buildSystemPrompt($entityContext);

        $userParts = [['text' => $prompt."\n\nUSER INPUT:\n".$userMessage]];

        if ($media) {
            $userParts[] = [
                'inlineData' => [
                    'mimeType' => $media['mimeType'],
                    'data' => $media['data'],
                ],
            ];
        }

        $contents = [
            ['parts' => $userParts],
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

            if (! $response->successful()) {
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

    /**
     * Execute the actions defined in the extracted data.
     */
    /**
     * Execute the actions defined in the extracted data.
     */
    public function executeActions(array $extractedData, User $user): array
    {
        $results = [];
        $actions = $extractedData['actions'] ?? [];
        $createdEntities = [];
        $createdEvents = [];

        foreach ($actions as $action) {
            $toolName = $action['tool'] ?? $action['tool_name'] ?? null;
            if (! $toolName) {
                continue;
            }

            try {
                $params = $action['params'] ?? [];

                // Handle Write Actions internally to ensure consistency
                $result = match ($toolName) {
                    'upsert_entity' => $this->upsertEntity($user, $params, $createdEntities),
                    'link_entities' => $this->linkEntities($user, $params, $createdEntities),
                    'record_event', 'record_financial_event' => $this->recordEvent($user, $params, $createdEntities, $createdEvents),
                    'set_recurrence' => $this->setRecurrence($user, $params, $createdEvents),
                    default => $this->executeGenericTool($toolName, $params)
                };

                $results[] = $result;

            } catch (\Exception $e) {
                Log::error("Failed to execute tool {$toolName}", ['error' => $e->getMessage()]);
                // We don't re-throw immediately to allow other independent actions to proceed?
                // Actually, IngestExecutionController used to catch and report.
                // For consistency with previous behavior, let's catch but return error structure.
                $results[] = [
                    'success' => false,
                    'message' => "Error executing {$toolName}: ".$e->getMessage(),
                ];
            }
        }

        return $results;
    }

    protected function executeGenericTool(string $toolName, array $params): array
    {
        $tool = $this->registry->getTool($toolName);
        if ($tool) {
            return $tool->execute($params);
        }

        return ['success' => false, 'message' => "Unknown tool: {$toolName}"];
    }

    // --- Entity Resolution & Action Logic (Moved from IngestExecutionController) ---

    protected function resolveEntityId(User $user, string $identifier, array $createdEntities = []): ?string
    {
        if (\Illuminate\Support\Str::isUuid($identifier)) {
            return $identifier;
        }

        if (str_starts_with($identifier, 'find-by-name:')) {
            $name = substr($identifier, 13);
            $entity = $user->entities()
                ->where('name', 'LIKE', "%{$name}%")
                ->where('status', 'ACTIVE') // Prioritize active
                ->first();

            return $entity?->id;
        }

        if (str_starts_with($identifier, 'new:')) {
            $name = substr($identifier, 4);

            return $createdEntities[$name] ?? null;
        }

        if ($identifier === 'find-first-vehicle') {
            $entity = $user->entities()
                ->where('category', 'ASSET')
                ->where('status', 'ACTIVE')
                ->first();

            return $entity?->id;
        }

        return null;
    }

    protected function upsertEntity(User $user, array $params, array &$createdEntities): array
    {
        if (! isset($params['category'], $params['name'])) {
            return ['success' => false, 'message' => 'upsert_entity requires: category, name'];
        }

        // Normalization via CategoryService
        $analysis = $this->categoryService->analyze($user, $params['name']);
        $params['name'] = $analysis['normalized_name'];
        $params['category'] = $params['category'] ?? $analysis['suggested_category'];

        // Handle special names
        if ($params['name'] === 'find-first-vehicle') {
            $entity = $user->entities()
                ->where('category', 'ASSET')
                ->where('status', 'ACTIVE')
                ->first();

            if (! $entity) {
                return ['success' => false, 'message' => 'No vehicle found'];
            }

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
            $metadata = array_merge($entity->metadata ?? [], $params['metadata'] ?? []);
            $entity->update(['metadata' => $metadata]);
            $message = "Entidad '{$entity->name}' actualizada";
        } else {
            $entity = $user->entities()->create([
                'name' => $params['name'],
                'category' => strtoupper($params['category']),
                'status' => 'ACTIVE',
                'metadata' => $params['metadata'] ?? [],
            ]);
            $message = "Entidad '{$entity->name}' creada";

            if (isset($params['balance']) && $params['balance'] != 0) {
                $user->lifeEvents()->create([
                    'entity_id' => $entity->id,
                    'title' => 'Balance Inicial - '.$entity->name,
                    'amount' => $params['balance'],
                    'occurred_at' => now()->toDateString(),
                    'type' => $params['balance'] >= 0 ? 'INCOME' : 'EXPENSE',
                    'status' => 'COMPLETED',
                    'metadata' => ['source' => 'autonomous_ingestion', 'is_initial_balance' => true],
                ]);
            }
        }

        $createdEntities[$params['name']] = $entity->id;

        return ['success' => true, 'message' => $message, 'entity_id' => $entity->id];
    }

    protected function linkEntities(User $user, array $params, array $createdEntities): array
    {
        if (! isset($params['subject_id'], $params['relation'], $params['object_id'])) {
            return ['success' => false, 'message' => 'link_entities requires: subject_id, relation, object_id'];
        }

        $subjectId = $this->resolveEntityId($user, $params['subject_id'], $createdEntities);
        $objectId = $this->resolveEntityId($user, $params['object_id'], $createdEntities);

        if (! $subjectId || ! $objectId) {
            return ['success' => false, 'message' => 'Could not resolve entity IDs'];
        }

        // Check if exists
        $existing = \App\Models\EntityRelationship::where('parent_entity_id', $subjectId)
            ->where('child_entity_id', $objectId)
            ->where('relationship_type', $params['relation'])
            ->first();

        if ($existing) {
            return ['success' => true, 'message' => 'Relación ya existe'];
        }

        \App\Models\EntityRelationship::create([
            'parent_entity_id' => $subjectId,
            'child_entity_id' => $objectId,
            'relationship_type' => $params['relation'],
            'metadata' => $params['metadata'] ?? [],
        ]);

        return ['success' => true, 'message' => 'Relación creada'];
    }

    protected function recordEvent(User $user, array $params, array $createdEntities, array &$createdEvents): array
    {
        $entityId = $this->resolveEntityId($user, $params['entity_id'] ?? '', $createdEntities);

        // --- Fallback Mechanism: Ensure we have a wallet ---
        if (! $entityId) {
            $fallback = $user->entities()
                ->where('category', 'FINANCE')
                ->where('status', 'ACTIVE')
                ->first();

            if (! $fallback) {
                // Critical: Create a default wallet if none exists to avoid losing the transaction
                $fallback = $user->entities()->create([
                    'name' => 'Billetera Principal',
                    'category' => 'FINANCE',
                    'status' => 'ACTIVE',
                ]);
                Log::info("Auto-created default wallet for user {$user->id}");
            }
            $entityId = $fallback->id;
        }

        $entity = $user->entities()->find($entityId);

        // --- Reconciliation Check (Anti-Duplicate) ---
        $existingMatch = $this->reconciliationService->findMatch($user, $params['amount'], $params['date'], $entityId);

        if ($existingMatch) {
            Log::info("Reconciliation successful: Match found for amount {$params['amount']}");

            return [
                'success' => true,
                'message' => 'Reconciliación exitosa: El evento ya existía.',
                'event_id' => $existingMatch->id,
                'reconciled' => true,
            ];
        }

        $event = $user->lifeEvents()->create([
            'entity_id' => $entityId,
            'title' => $params['description'] ?? $params['note'] ?? 'Transacción Omnibox',
            'amount' => $params['amount'],
            'occurred_at' => $params['date'],
            'type' => $params['type'] ?? ($params['amount'] < 0 ? 'EXPENSE' : 'INCOME'),
            'status' => (isset($params['date']) && \Carbon\Carbon::parse($params['date'])->isFuture()) ? 'SCHEDULED' : 'COMPLETED',
            'metadata' => [
                'source' => 'autonomous_ingestion',
                'tool' => 'record_financial_event',
                'original_input' => $params['description'] ?? null,
            ],
        ]);

        if (! empty($params['temp_id'])) {
            $createdEvents[$params['temp_id']] = $event;
        }

        return ['success' => true, 'message' => "Evento '{$event->title}' registrado con éxito", 'event_id' => $event->id];
    }

    protected function setRecurrence(User $user, array $params, array $createdEvents): array
    {
        return ['success' => true, 'message' => 'Recurrencia anotada (generación automática desactivada temporamente)'];
    }

    /**
     * Calculate confidence score for a set of actions.
     */
    public function calculateConfidence(array $actions, User $user): int
    {
        if (empty($actions)) {
            return 0;
        }

        $totalScore = 0;
        foreach ($actions as $action) {
            $score = 0;
            $params = $action['params'] ?? [];

            // 1. Amount (40%)
            if (isset($params['amount']) && is_numeric($params['amount'])) {
                $score += 40;
            }

            // 2. Date (20%)
            if (! empty($params['date'])) {
                $score += 20;
            }

            // 3. Known Entity (40%)
            $entityId = $this->resolveEntityId($user, $params['entity_id'] ?? $params['name'] ?? '');
            if ($entityId) {
                $score += 40;
            }

            $totalScore += $score;
        }

        return (int) ($totalScore / count($actions));
    }
}
