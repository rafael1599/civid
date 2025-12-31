<?php

namespace App\AI\Tools;

use App\AI\Contracts\AiTool;
use App\Models\Entity;
use Illuminate\Support\Facades\Auth;

class UpsertEntityTool implements AiTool
{
    public function getName(): string
    {
        return 'upsert_entity';
    }

    public function getDescription(): string
    {
        return 'Crea o actualiza una entidad (cuenta, activo, seguro, servicio).';
    }

    public function getParametersSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'name' => [
                    'type' => 'string',
                    'description' => 'Nombre de la entidad (ej: Toyota Corolla, Seguro Geico, Cuenta BCP)'
                ],
                'category' => [
                    'type' => 'string',
                    'enum' => ['FINANCE', 'ASSET', 'HEALTH', 'PROJECT', 'SERVICE'],
                    'description' => 'Categoría de la entidad'
                ],
                'metadata' => [
                    'type' => 'object',
                    'description' => 'Datos adicionales (ej: { "color": "rojo", "vin": "123" })',
                    'nullable' => true
                ],
                'entity_id' => [
                    'type' => 'string',
                    'description' => 'UUID si es una actualización, o null si es creación',
                    'nullable' => true
                ]
            ],
            'required' => ['name', 'category']
        ];
    }

    public function execute(array $params): array
    {
        $user = Auth::user();

        $entity = Entity::updateOrCreate(
            ['id' => $params['entity_id'] ?? null, 'user_id' => $user->id],
            [
                'name' => $params['name'],
                'category' => $params['category'],
                'metadata' => array_merge($entity->metadata ?? [], $params['metadata'] ?? []),
                'status' => 'ACTIVE'
            ]
        );

        return [
            'success' => true,
            'entity_id' => $entity->id,
            'name' => $entity->name,
            'message' => "Entidad '{$entity->name}' procesada correctamente."
        ];
    }
}
