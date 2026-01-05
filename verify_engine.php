// Verification Script

$user = \App\Models\User::first();
$ingestion = app(\App\Services\IngestionService::class);

// 1. Test Normalization (Reflection hack not needed if we test the result of recordEvent)
// We will test `normalizePayee` by calling a public method that uses it, or just trusting the result.
// Let's rely on recordEvent.

echo "--- Testing Intelligent Engine ---\n";

// Setup: Create a Category 'Transporte Test'
$category = \App\Models\Entity::firstOrCreate(
['name' => 'Transporte Test', 'category' => 'EXPENSE_CATEGORY', 'user_id' => $user->id],
['status' => 'ACTIVE']
);

// Setup: Create a Wallet 'Wallet Test'
$wallet = \App\Models\Entity::firstOrCreate(
['name' => 'Wallet Test', 'category' => 'FINANCE', 'user_id' => $user->id],
['status' => 'ACTIVE']
);

echo "Setup Complete.\n";

// 2. Create History: Uber -> Transporte Test
\App\Models\LifeEvent::create([
'user_id' => $user->id,
'entity_id' => $wallet->id,
'to_entity_id' => $category->id,
'title' => 'Uber', // Normalized title in history
'amount' => -10,
'occurred_at' => now(),
'type' => 'EXPENSE',
'status' => 'COMPLETED'
]);

echo "History Created.\n";

// 3. Execute Action: 'UBER *TRIP 123'
$action = [
'tool' => 'record_financial_event',
'params' => [
'description' => 'UBER *TRIP 8888',
'amount' => -25.50,
'date' => now()->toDateString(),
'entity_id' => $wallet->id
// NO to_entity_id
]
];

$results = $ingestion->executeActions(['actions' => [$action]], $user);
$eventId = $results[0]['event_id'];

$event = \App\Models\LifeEvent::find($eventId);

echo "Result Title: " . $event->title . "\n";
echo "Result Category ID: " . $event->to_entity_id . "\n";
echo "Expected Category ID: " . $category->id . "\n";

if ($event->title === 'Uber' && $event->to_entity_id == $category->id) {
echo "SUCCESS: Engine Normalized and Auto-Categorized correctly!\n";
} else {
echo "FAILED.\n";
}

// Cleanup
$event->delete();
// We leave the category/wallet for now or delete them.