<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // 1. Usuario de Prueba
        $user = User::factory()->create([
            'name' => 'Alex Civil',
            'email' => 'test@civid.app',
            'password' => 'password', // Password hashing is handled by the model cast or mutator usually, but factory handles it. Standard laravel factory uses Hash. Logic below:
        ]);

        // 2. Entidad 1: Activo (Vehículo)
        $vehicle = $user->entities()->create([
            'name' => 'Toyota Corolla 2020',
            'category' => 'ASSET',
            'metadata' => [
                'vin' => 'HT23423',
                'plate' => 'ABC-123',
                'color' => 'White',
                'value' => 18000,
            ],
            'status' => 'ACTIVE',
        ]);

        $vehicle->lifeEvents()->create([
            'user_id' => $user->id,
            'title' => 'Cambio de Aceite 10k',
            'type' => 'MAINTENANCE',
            'amount' => -120.00,
            'occurred_at' => now()->subMonths(2),
        ]);

        // 3. Entidad 2: Salud (Historial Personal)
        $health = $user->entities()->create([
            'name' => 'Mi Salud',
            'category' => 'HEALTH',
            'metadata' => [
                'blood_type' => 'O+',
                'allergies' => ['Penicillin'],
            ],
            'status' => 'ACTIVE',
        ]);

        $health->lifeEvents()->create([
            'user_id' => $user->id,
            'title' => 'Consulta General Anual',
            'description' => 'Presión arterial normal. Recomendación de más cardio.',
            'type' => 'MEDICAL',
            'amount' => -50.00,
            'occurred_at' => now()->subWeek(),
        ]);

        // 4. Entidad 3: Finanzas (Cuenta Principal)
        $finance = $user->entities()->create([
            'name' => 'Cuenta BCP Ahorros',
            'category' => 'FINANCE',
            'status' => 'ACTIVE',
        ]);

        $finance->lifeEvents()->create([
            'user_id' => $user->id,
            'title' => 'Salario Mensual',
            'type' => 'INCOME',
            'amount' => 2500.00,
            'occurred_at' => now(),
        ]);

        // 5. Graph Testing: Entidad Seguro
        $insurance = $user->entities()->create([
            'name' => 'Seguro Geico',
            'category' => 'SERVICE',
            'metadata' => ['policy_number' => 'G-123456789'],
            'status' => 'ACTIVE',
        ]);

        // 6. Relaciones Simples (Jerarquía)
        // El Seguro (Child) depende del Auto (Parent)
        $insurance->update(['parent_entity_id' => $vehicle->id]);

        // La Cuenta BCP (Child) está vinculada al Auto (Parent - por ejemplo para pagos automáticos)
        $finance->update(['parent_entity_id' => $vehicle->id]);
    }
}
