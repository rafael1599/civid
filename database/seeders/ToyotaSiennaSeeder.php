<?php

namespace Database\Seeders;

use App\Models\Entity;
use App\Models\LifeEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ToyotaSiennaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Get User (Assuming the first user or create one if none)
        $user = User::first();
        if (! $user) {
            // Fallback if no user exists, though likely DatabaseSeeder created one.
            $user = User::factory()->create([
                'name' => 'Alex Civil',
                'email' => 'alex@example.com',
            ]);
        }

        // 2. Create Entities

        // Entidad A (El Carro)
        $sienna = Entity::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'name' => '2022 Toyota Sienna HV',
            'category' => 'ASSET',
            'status' => 'ACTIVE',
            'metadata' => [
                'model_year' => 2022,
                'type' => 'Hybrid Vehicle (HV)',
                'image_url' => 'https://delivery-p100417-e924025.adobeaemcloud.com/adobe/dynamicmedia/deliver/urn:aaid:aem:8cc8fa6a-c94b-485c-8f16-778bdc7a1b8c/image.png?size=340,341',
                'color' => '#FFFFFF',
                'value' => 35000,
                'last_manual_odometer' => 15200,
                'last_manual_odometer_at' => Carbon::now()->subDays(10)->toDateString(),
                'daily_avg_usage' => 35,
            ],
        ]);

        // Entidad B (El Préstamo/Financiera)
        $toyotaFinancial = Entity::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'name' => 'Toyota Financial Services (Acct 8002)',
            'category' => 'FINANCE',
            'status' => 'ACTIVE',
            'metadata' => [
                'account_number' => '****8002',
                'original_principal' => 38000,
                'annual_rate' => 0.0844,
                'apr_interest_rate' => '8.44%',
                'balance' => 24595.18,
                'remaining_principal' => 24595.18,
                'remaining_payments' => 42,
                'payment' => '$664.70',
                'monthly_payment' => 664.70,
                'interest_paid_to_date' => 1240.45,
                'savings_accumulated' => 0,
                'payoff_quote_available' => true,
            ],
        ]);

        // Entidad C (Cuenta de Pago - Referencia)
        // Check if exists or create
        $checking = Entity::where('name', 'like', '%Checking Account%')->first();
        if (! $checking) {
            $checking = Entity::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'name' => 'Checking Account (...2827)',
                'category' => 'FINANCE',
                'status' => 'ACTIVE',
                'metadata' => [
                    'account_type' => 'Checking',
                    'last4' => '2827',
                ],
            ]);
        }

        // 3. Create Relations (Simplified Hierarchy)
        // Toyota Financial depends on Sienna
        $toyotaFinancial->update(['parent_entity_id' => $sienna->id]);

        // Checking Account depends on Toyota Financial (as its payment source)
        $checking->update(['parent_entity_id' => $toyotaFinancial->id]);

        // 4. Life Events (History)

        $commonData = [
            'user_id' => $user->id,
            'entity_id' => $toyotaFinancial->id,
        ];

        // Future Event (Triggering Critical Alert)
        LifeEvent::create(array_merge($commonData, [
            'id' => (string) Str::uuid(),
            'title' => 'Pago Mensual Programado',
            'type' => 'EXPENSE',
            'amount' => -664.70,
            'occurred_at' => '2025-12-29',
            'status' => 'SCHEDULED',
            'metadata' => ['frequency' => 'MONTHLY'],
        ]));

        // 5. Documents (Bóveda)
        \App\Models\Document::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'entity_id' => $sienna->id,
            'name' => 'Contrato de Financiamiento Toyota.pdf',
            'path' => '#',
            'file_type' => 'PDF',
            'created_at' => '2022-05-15 10:00:00',
        ]);

        // Past Events
        $history = [
            ['date' => '2025-11-29', 'status' => 'PAID', 'amount' => -664.70, 'title' => 'Pago Mensual Noviembre'],
            ['date' => '2025-10-29', 'status' => 'PAID', 'amount' => -664.70, 'title' => 'Pago Mensual Octubre'],
            ['date' => '2025-09-29', 'status' => 'PAID', 'amount' => -664.70, 'title' => 'Pago Mensual Septiembre'],
            ['date' => '2025-08-29', 'status' => 'FAILED', 'amount' => 0.00, 'title' => 'Intento de Pago Fallido (Revisar)', 'description' => 'Recurring Payment Failed'],
        ];

        foreach ($history as $event) {
            LifeEvent::create(array_merge($commonData, [
                'id' => (string) Str::uuid(),
                'title' => $event['title'],
                'type' => 'EXPENSE',
                'amount' => $event['amount'],
                'occurred_at' => $event['date'],
                'status' => $event['status'],
                'description' => $event['description'] ?? null,
            ]));
        }
    }
}
