<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Entity;
use App\Models\LifeEvent;
use App\Models\User;
use Illuminate\Support\Str;

class InsurancePreminsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        if (!$user) {
            return;
        }

        // 1. Create Entity (The Premins Company)
        $premins = Entity::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'name' => 'The Premins Company (Seguro)',
            'category' => 'FINANCE',
            'status' => 'ACTIVE',
            'metadata' => [
                'account_number' => '361895',
                'holder' => 'LOPEZ CORDOVA, RAFAEL',
                'balance' => 141.40,
                'remaining_balance' => 141.40,
                'remaining_payments' => 2,
                'payments_made' => 8,
                'payment_portal' => 'https://www.premins.com/',
                'contact_phone' => '718-375-8300',
                'address' => '132 32nd Street, Suite 408, Brooklyn, NY 11232',
            ],
        ]);

        // 2. Link with Toyota Sienna
        $sienna = Entity::where('name', '2022 Toyota Sienna HV')->first();
        if ($sienna) {
            $sienna->children()->attach($premins->id, [
                'id' => (string) Str::uuid(),
                'relationship_type' => 'INSURED_BY',
            ]);
        }

        // 3. Register LifeEvents

        // Next Payment (Scheduled/Urgent)
        LifeEvent::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'entity_id' => $premins->id,
            'title' => 'Pago Seguro (Cuota 9/10)',
            'type' => 'EXPENSE',
            'amount' => -70.70,
            'status' => 'SCHEDULED',
            'occurred_at' => '2026-01-03',
            'metadata' => ['frequency' => 'MONTHLY'],
            'next_due_date' => '2026-01-03 23:59:00',
        ]);

        // Final Payment (Projected)
        LifeEvent::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'entity_id' => $premins->id,
            'title' => 'Pago Seguro (Cuota Final 10/10)',
            'type' => 'EXPENSE',
            'amount' => -70.70,
            'status' => 'PROJECTED',
            'occurred_at' => '2026-02-03',
        ]);
    }
}
