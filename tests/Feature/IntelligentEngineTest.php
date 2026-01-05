<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Entity;
use App\Models\LifeEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Services\IngestionService;
use Carbon\Carbon;

class IntelligentEngineTest extends TestCase
{
    use RefreshDatabase;

    protected $ingestion;
    protected $user;
    protected $transportCategory;
    protected $wallet;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->ingestion = app(IngestionService::class);

        // Setup Categories
        $this->transportCategory = Entity::create([
            'user_id' => $this->user->id,
            'name' => 'Transporte',
            'category' => 'EXPENSE_CATEGORY',
            'status' => 'ACTIVE'
        ]);

        $this->wallet = Entity::create([
            'user_id' => $this->user->id,
            'name' => 'Wallet A',
            'category' => 'FINANCE',
            'status' => 'ACTIVE'
        ]);
    }

    public function test_it_normalizes_payee_names()
    {
        // Reflection to test protected method or just use the public executeActions flow if easier.
        // Let's use reflection for unit testing the specific logic.
        $reflection = new \ReflectionClass($this->ingestion);
        $method = $reflection->getMethod('normalizePayee');
        $method->setAccessible(true);

        $this->assertEquals('Uber', $method->invoke($this->ingestion, 'UBER *TRIP 8292'));
        $this->assertEquals('Paypal Netflix', $method->invoke($this->ingestion, 'PAYPAL *NETFLIX')); // Assuming we want "Netflix"? Logic was simply strip prefix.
        // My logic checks prefixes. If 'PAYPAL *' is removed, 'NETFLIX' remains. then ucwords -> 'Netflix'.
        // Wait, 'PAYPAL *NETFLIX' -> 'NETFLIX' -> 'Netflix'.
        // Let's check my code: $input = substr($input, strlen($prefix)).
        // 'PAYPAL *NETFLIX' starts with 'PAYPAL *'. 'NETFLIX' remains. Correct.
        $this->assertEquals('Netflix', $method->invoke($this->ingestion, 'PAYPAL *NETFLIX'));
        $this->assertEquals('Walmart', $method->invoke($this->ingestion, 'WALMART 0023')); // Trailing numbers
    }

    public function test_auto_categorization_learns_from_history()
    {
        // 1. Create Past Event: "Uber" -> Linked to "Transporte"
        LifeEvent::create([
            'user_id' => $this->user->id,
            'entity_id' => $this->wallet->id,
            'to_entity_id' => $this->transportCategory->id,
            'title' => 'Uber',
            'amount' => -15.00,
            'type' => 'EXPENSE',
            'status' => 'COMPLETED',
            'occurred_at' => Carbon::yesterday(),
        ]);

        // 2. recordEvent via public method executeActions (simulating tool call)
        // We need to bypass the resolution logic slightly or mock it.
        // Or we can construct the tool call payload.

        $action = [
            'tool' => 'record_financial_event',
            'params' => [
                'description' => 'UBER *TRIP 9999', // Dirty name
                'amount' => -20.00,
                'date' => Carbon::now()->toDateString(),
                'entity_id' => $this->wallet->id
                // Note: NO to_entity_id provided
            ]
        ];

        $results = $this->ingestion->executeActions(['actions' => [$action]], $this->user);

        $this->assertTrue($results[0]['success']);

        $newEvent = LifeEvent::latest('id')->first();

        $this->assertEquals('Uber', $newEvent->title); // Normalized
        $this->assertEquals($this->transportCategory->id, $newEvent->to_entity_id); // Auto-Learned!
        $this->assertTrue($newEvent->metadata['is_auto_categorized']);
    }
}
