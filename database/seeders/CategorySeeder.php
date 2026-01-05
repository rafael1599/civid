<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Entity;
use App\Models\LifeEvent;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = \App\Models\User::first();

        if (!$user) {
            $this->command->info('No user found, skipping seeder.');
            return;
        }

        $incomeCategories = [
            ['name' => 'Sueldo', 'icon' => '💰'],
            ['name' => 'Inversiones', 'icon' => '📈'],
            ['name' => 'Regalos', 'icon' => '🎁'],
            ['name' => 'Otros Ingresos', 'icon' => '💵'],
        ];

        $expenseCategories = [
            ['name' => 'Alimentación', 'icon' => '🍔'],
            ['name' => 'Transporte', 'icon' => '🚗'], // Will map MAINTENANCE here
            ['name' => 'Vivienda', 'icon' => '🏠'],
            ['name' => 'Servicios', 'icon' => '💡'],
            ['name' => 'Salud', 'icon' => '🏥'], // Will map MEDICAL here
            ['name' => 'Entretenimiento', 'icon' => '🎬'],
            ['name' => 'Compras', 'icon' => '🛍️'],
            ['name' => 'Educación', 'icon' => '🎓'],
        ];

        $categoryMap = [];

        // Create Income Categories
        foreach ($incomeCategories as $cat) {
            $entity = Entity::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'name' => $cat['name'],
                    'category' => 'INCOME_CATEGORY'
                ],
                [
                    'status' => 'ACTIVE',
                    'metadata' => ['icon' => $cat['icon']]
                ]
            );
            $categoryMap[$cat['name']] = $entity->id;
        }

        // Create Expense Categories
        foreach ($expenseCategories as $cat) {
            $entity = Entity::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'name' => $cat['name'],
                    'category' => 'EXPENSE_CATEGORY'
                ],
                [
                    'status' => 'ACTIVE',
                    'metadata' => ['icon' => $cat['icon']]
                ]
            );
            $categoryMap[$cat['name']] = $entity->id;
        }

        // --- Data Migration / Cleanup ---

        // 1. Convert MAINTENANCE -> EXPENSE (Transporte)
        // We assume MAINTENANCE events are currently linked to a Vehicle (Asset) via entity_id.
        // We will move the Asset ID to 'metadata.related_asset_id' (if we want to keep it)
        // AND set 'to_entity_id' = 'Transporte' Category.
        // AND set 'type' = 'EXPENSE'.

        $maintenanceEvents = LifeEvent::where('type', 'MAINTENANCE')->get();
        foreach ($maintenanceEvents as $event) {
            $event->update([
                'type' => 'EXPENSE',
                'to_entity_id' => $categoryMap['Transporte'],
                'metadata' => array_merge($event->metadata ?? [], ['original_type' => 'MAINTENANCE', 'related_asset_id' => $event->entity_id]),
                // Keep entity_id as the Wallet (Source) if it was set, typical for current structure?
                // Actually currently entity_id IS the Asset.
                // We need to find the Wallet. If we don't know it, we might leave from_entity_id null for now.
                'entity_id' => null, // Clear the Asset link from main column to avoid confusion, or keep it if we want 'related'?
                // Let's clear it and rely on metadata for the asset link, to align with new "Wallet -> Category" model.
            ]);
            $this->command->info("Converted MAINTENANCE event {$event->id} to EXPENSE (Transporte).");
        }

        // 2. Convert MEDICAL -> EXPENSE (Salud)
        $medicalEvents = LifeEvent::where('type', 'MEDICAL')->get();
        foreach ($medicalEvents as $event) {
            $event->update([
                'type' => 'EXPENSE',
                'to_entity_id' => $categoryMap['Salud'],
                'metadata' => array_merge($event->metadata ?? [], ['original_type' => 'MEDICAL', 'related_entity_id' => $event->entity_id]),
                'entity_id' => null,
            ]);
            $this->command->info("Converted MEDICAL event {$event->id} to EXPENSE (Salud).");
        }

        $this->command->info('Categories seeded and legacy data migrated.');
    }
}
