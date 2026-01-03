<?php

namespace App\AI\Tools;

use App\AI\Contracts\AiTool;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SearchDocumentsTool implements AiTool
{
    public function getName(): string
    {
        return 'search_documents';
    }

    public function getDescription(): string
    {
        return 'Busca fragmentos de texto relevantes dentro de los documentos, contratos o notas del usuario. Úsalo para responder preguntas sobre coberturas, condiciones legales, manuales de usuario o detalles específicos no financieros.';
    }

    public function getParametersSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'query' => [
                    'type' => 'string',
                    'description' => 'Términos clave a buscar (ej. "cláusula robo", "presión llantas")',
                ],
                'entity_id' => [
                    'type' => 'string',
                    'description' => 'UUID de la entidad para filtrar la búsqueda (Opcional)',
                    'nullable' => true,
                ],
            ],
            'required' => ['query'],
        ];
    }

    public function execute(array $params): array
    {
        $user = Auth::user();
        $queryText = $params['query'];
        $entityId = $params['entity_id'] ?? null;

        $sql = "
            SELECT 
                id, 
                name,
                ts_headline('spanish', extracted_content, websearch_to_tsquery('spanish', ?), 'StartSel=***, StopSel=***, MaxWords=35, MinWords=15') as snippet,
                ts_rank(search_vector, websearch_to_tsquery('spanish', ?)) as rank
            FROM documents
            WHERE user_id = ?
        ";

        $bindings = [$queryText, $queryText, $user->id];

        if ($entityId) {
            $sql .= ' AND entity_id = ?';
            $bindings[] = $entityId;
        }

        $sql .= " AND search_vector @@ websearch_to_tsquery('spanish', ?)";
        $bindings[] = $queryText;

        $sql .= ' ORDER BY rank DESC LIMIT 3';

        $results = DB::select($sql, $bindings);

        return [
            'success' => true,
            'query' => $queryText,
            'results' => array_map(fn ($r) => [
                'document_id' => $r->id,
                'document_name' => $r->name,
                'snippet' => $r->snippet,
            ], $results),
        ];
    }
}
