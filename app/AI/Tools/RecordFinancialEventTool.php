<?php

namespace App\AI\Tools;

use App\AI\Contracts\AiTool;
use App\Models\LifeEvent;
use Illuminate\Support\Facades\Auth;

class RecordFinancialEventTool implements AiTool
{
    public function getName(): string
    {
        return 'record_financial_event';
    }

    public function getDescription(): string
    {
        return 'Registra un evento financiero (pago, ingreso, gasto) y opcionalmente su recurrencia.';
    }

    public function getParametersSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'entity_id' => [
                    'type' => 'string',
                    'description' => 'UUID de la entidad asociada (o "new:Nombre" si se creó en este turno)'
                ],
                'amount' => [
                    'type' => 'number',
                    'description' => 'Monto (negativo para gastos/pagos, positivo para ingresos)'
                ],
                'date' => [
                    'type' => 'string',
                    'description' => 'Fecha en formato YYYY-MM-DD'
                ],
                'description' => [
                    'type' => 'string',
                    'description' => 'Descripción corta del evento'
                ],
                'recurrence' => [
                    'type' => 'object',
                    'properties' => [
                        'frequency' => ['type' => 'string', 'enum' => ['weekly', 'monthly', 'yearly']],
                        'interval' => ['type' => 'number', 'default' => 1]
                    ],
                    'nullable' => true
                ]
            ],
            'required' => ['entity_id', 'amount', 'date', 'description']
        ];
    }

    public function execute(array $params): array
    {
        // Note: Execution logic for write tools is actually handled post-confirmation 
        // in IngestExecutionController, but we define the schema here for the AI.
        // For read tools, execute() runs immediately.
        return [
            'planned_action' => 'record_financial_event',
            'params' => $params
        ];
    }
}
