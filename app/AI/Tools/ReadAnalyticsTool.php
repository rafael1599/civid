<?php

namespace App\AI\Tools;

use App\AI\Contracts\AiTool;
use App\Models\LifeEvent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReadAnalyticsTool implements AiTool
{
    public function getName(): string
    {
        return 'read_analytics';
    }

    public function getDescription(): string
    {
        return 'Consulta estadísticas financieras e historial de eventos del usuario.';
    }

    public function getParametersSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'entity_id' => [
                    'type' => 'string',
                    'description' => 'Filtrar por UUID de entidad (opcional)',
                    'nullable' => true
                ],
                'date_from' => [
                    'type' => 'string',
                    'description' => 'Fecha de inicio (YYYY-MM-DD)',
                    'nullable' => true
                ],
                'date_to' => [
                    'type' => 'string',
                    'description' => 'Fecha de fin (YYYY-MM-DD)',
                    'nullable' => true
                ],
                'metric' => [
                    'type' => 'string',
                    'enum' => ['sum', 'count', 'list'],
                    'description' => 'Qué tipo de análisis realizar'
                ]
            ],
            'required' => ['metric']
        ];
    }

    public function execute(array $params): array
    {
        $user = Auth::user();
        $query = LifeEvent::where('user_id', $user->id);

        if (!empty($params['entity_id'])) {
            $query->where('entity_id', $params['entity_id']);
        }

        if (!empty($params['date_from'])) {
            $query->where('occurred_at', '>=', $params['date_from']);
        }

        if (!empty($params['date_to'])) {
            $query->where('occurred_at', '<=', $params['date_to']);
        }

        $result = match ($params['metric']) {
            'sum' => $query->sum('amount'),
            'count' => $query->count(),
            'list' => $query->with('entity:id,name')->latest('occurred_at')->take(10)->get()->map(fn($e) => [
                'date' => \Carbon\Carbon::parse($e->occurred_at)->toDateString(),
                'amount' => $e->amount,
                'note' => $e->title,
                'entity' => $e->entity->name ?? 'Sistema'
            ]),
            default => 0,
        };

        return [
            'success' => true,
            'metric' => $params['metric'],
            'value' => $result,
            'context' => "Datos obtenidos para el periodo " . ($params['date_from'] ?? 'inicio') . " al " . ($params['date_to'] ?? 'hoy')
        ];
    }
}
