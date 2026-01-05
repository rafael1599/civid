<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $now = Carbon::now();
        $thirtyDaysFromNow = Carbon::now()->addDays(30);

        // --- 30-Day Expense Forecast ---
        $projected_expenses = $user->lifeEvents()
            ->where('type', 'EXPENSE')
            ->where('status', 'SCHEDULED')
            ->whereBetween('occurred_at', [$now, $thirtyDaysFromNow])
            ->sum(DB::raw('abs(amount)'));

        $upcoming_bills = $user->lifeEvents()
            ->where('occurred_at', '>', $now->toDateString())
            ->with('entity:id,name,category')
            ->orderBy('occurred_at', 'asc')
            ->take(5)
            ->get()
            ->map(function ($event) use ($now) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'amount' => (float) $event->amount,
                    'occurred_at' => $event->occurred_at->toDateString(),
                    'entity_name' => $event->entity->name ?? 'Sistema',
                    'entity_id' => $event->entity_id,
                    'entity_category' => $event->entity->category ?? null,
                    'status' => $event->status,
                    'type' => $event->type,
                    'days_left' => (int) $now->diffInDays($event->occurred_at, false),
                ];
            });

        // --- Real Net Worth Calculation ---
        // 1. Transactional Base (Liquid Assets) - Sum timestamps of FINANCE entities
        // We calculate this dynamically based on the events LINKED to the wallets, ensuring we only count real money.
        $finance_entities = $user->entities()->where('category', 'FINANCE')->get();

        $cash_balance = $finance_entities->sum(function ($wallet) use ($now) {
            return $wallet->lifeEvents()
                ->where('occurred_at', '<=', $now->copy()->endOfDay())
                ->sum('amount');
        });

        // 2. Asset Values (Market Value) - DISABLED per user request for simplification
        // $asset_value = ...

        // 3. Liabilities (Remaining Debt)
        $total_liabilities = $user->entities()
            ->where('category', 'FINANCE')
            ->get()
            ->sum(function ($entity) {
                return (float) ($entity->metadata['remaining_balance'] ?? $entity->metadata['balance'] ?? 0);
            });

        $total_balance = $cash_balance - $total_liabilities;

        $history = $user->lifeEvents()
            ->where(function ($query) use ($now) {
                $query->where('occurred_at', '<=', $now->copy()->endOfDay())
                    ->orWhere('status', 'COMPLETED');
            })
            ->with(['entity:id,name,category'])
            ->orderBy('occurred_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        // Get ALL active entities for the Ecosistema View
        $entities = $user->entities()
            ->where('status', 'ACTIVE')
            ->with(['childRelationships', 'parentRelationships']) // Load connected entities (Graph context)
            ->get();

        // --- This Month Flow ---
        $this_month_income = $user->lifeEvents()
            ->where('type', 'INCOME')
            ->where('status', '!=', 'SCHEDULED')
            ->whereBetween('occurred_at', [$now->copy()->startOfMonth()->toDateString(), $now->copy()->endOfMonth()->toDateString()])
            ->sum('amount');

        $this_month_expenses = $user->lifeEvents()
            ->where('type', 'EXPENSE')
            ->where('status', '!=', 'SCHEDULED')
            ->whereBetween('occurred_at', [$now->copy()->startOfMonth()->toDateString(), $now->copy()->endOfMonth()->toDateString()])
            ->sum(DB::raw('abs(amount)'));

        // --- Top Activity (This Month) ---
        $top_expenses = $user->lifeEvents()
            ->where('type', 'EXPENSE')
            ->where('status', '!=', 'SCHEDULED')
            ->whereBetween('occurred_at', [$now->copy()->startOfMonth()->toDateString(), $now->toDateString()])
            ->orderBy(DB::raw('abs(amount)'), 'desc')
            ->take(4)
            ->get(['id', 'title', 'amount'])
            ->map(fn($e) => [
                'id' => $e->id,
                'name' => $e->title,
                'value' => (float) abs($e->amount),
            ]);

        $top_income = $user->lifeEvents()
            ->where('type', 'INCOME')
            ->where('status', '!=', 'SCHEDULED')
            ->whereBetween('occurred_at', [$now->copy()->startOfMonth()->toDateString(), $now->toDateString()])
            ->orderBy('amount', 'desc')
            ->take(4)
            ->get(['id', 'title', 'amount'])
            ->map(fn($e) => [
                'id' => $e->id,
                'name' => $e->title,
                'value' => (float) $e->amount,
            ]);

        // Get ALL active entities for the Ecosistema View
        $all_active_entities = $user->entities()
            ->where('status', 'ACTIVE')
            ->get(['id', 'name', 'category']);

        $wallets = $all_active_entities->where('category', 'FINANCE')->values()->map(function ($wallet) use ($now) {
            $wallet->balance = (float) $wallet->lifeEvents()
                ->where('occurred_at', '<=', $now->copy()->endOfDay())
                ->sum('amount');

            return $wallet;
        });
        $other_entities = $all_active_entities->where('category', '!=', 'FINANCE')->values()->map(function ($entity) use ($now) {
            // Calculate Risk Status (Semaphore)
            $alertStatus = 'SAFE';
            $upcomingEvent = $entity->lifeEvents()
                ->where('status', 'SCHEDULED')
                ->where('occurred_at', '>=', $now->toDateString())
                ->orderBy('occurred_at', 'asc')
                ->first();

            if ($upcomingEvent) {
                $daysUntil = $now->diffInDays($upcomingEvent->occurred_at, false);
                if ($daysUntil <= 7) {
                    $alertStatus = 'CRITICAL';
                } elseif ($daysUntil <= 30) {
                    $alertStatus = 'WARNING';
                }
            }

            $entity->alert_status = $alertStatus;

            // Include relationships for the graph view
            $entity->load(['childRelationships', 'parentRelationships']);

            return $entity;
        });

        $active_entities_counts = $all_active_entities
            ->groupBy('category')
            ->map->count();

        // Ecosystem / Graph Data (Mundo B)
        $ecosystem_data = $other_entities->map(fn($entity) => [
            'id' => $entity->id,
            'name' => $entity->name,
            'category' => $entity->category,
            'status' => $entity->alert_status,
            'value' => (float) ($entity->metadata['value'] ?? 0),
            'connections' => $entity->childRelationships->map(fn($rel) => [
                'target' => $rel->child_entity_id,
                'type' => $rel->relationship_type,
            ])->values(),
        ]);

        return Inertia::render('Dashboard', [
            'total_balance' => (float) $total_balance,
            'history' => $history,
            'wallets' => $wallets,
            'entities' => $other_entities,
            'active_entities' => $active_entities_counts,
            'this_month' => [
                'income' => (float) $this_month_income,
                'expenses' => (float) $this_month_expenses,
            ],
            'top_activity' => [
                'expenses' => $top_expenses,
                'income' => $top_income,
            ],
            'ecosystem' => $ecosystem_data,
            'forecast' => [
                'projected_amount' => $projected_expenses,
                'upcoming_bills' => $upcoming_bills,
            ],
        ]);
    }
}
