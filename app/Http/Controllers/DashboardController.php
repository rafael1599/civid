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
            ->where('status', 'SCHEDULED')
            ->whereBetween('occurred_at', [$now->toDateString(), $thirtyDaysFromNow->toDateString()])
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
        // 1. Transactional Base (Cash/History)
        $cash_balance = $user->lifeEvents()->sum('amount');

        // 2. Asset Values (Market Value)
        $asset_value = $user->entities()
            ->where('category', 'ASSET')
            ->get()
            ->sum(function ($entity) {
                return (float) ($entity->metadata['value'] ?? 0);
            });

        // 3. Liabilities (Remaining Debt)
        $total_liabilities = $user->entities()
            ->where('category', 'FINANCE')
            ->get()
            ->sum(function ($entity) {
                return (float) ($entity->metadata['remaining_balance'] ?? $entity->metadata['balance'] ?? 0);
            });

        $total_balance = ($cash_balance + $asset_value) - $total_liabilities;

        $history = $user->lifeEvents()
            ->where(function ($query) use ($now) {
                $query->where('occurred_at', '<=', $now->toDateString())
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
            ->whereBetween('occurred_at', [$now->startOfMonth()->toDateString(), $now->endOfMonth()->toDateString()])
            ->sum('amount');

        $this_month_expenses = $user->lifeEvents()
            ->where('type', 'EXPENSE')
            ->whereBetween('occurred_at', [$now->startOfMonth()->toDateString(), $now->endOfMonth()->toDateString()])
            ->sum(DB::raw('abs(amount)'));

        // --- Historical Flow (Last 6 Months) ---
        $historical_flow = collect(range(5, 0))->map(function ($i) use ($user) {
            $month = Carbon::now()->subMonths($i);
            $income = $user->lifeEvents()
                ->where('type', 'INCOME')
                ->whereBetween('occurred_at', [$month->startOfMonth()->toDateString(), $month->endOfMonth()->toDateString()])
                ->sum('amount');
            $expenses = $user->lifeEvents()
                ->where('type', 'EXPENSE')
                ->whereBetween('occurred_at', [$month->startOfMonth()->toDateString(), $month->endOfMonth()->toDateString()])
                ->sum(DB::raw('abs(amount)'));

            return [
                'month' => $month->format('M'),
                'income' => (float) $income,
                'expenses' => (float) $expenses,
            ];
        });

        // Get ALL active entities for the Ecosistema View
        $all_active_entities = $user->entities()
            ->where('status', 'ACTIVE')
            ->get(['id', 'name', 'category']);

        $wallets = $all_active_entities->where('category', 'FINANCE')->values()->map(function ($wallet) {
            $wallet->balance = (float) $wallet->lifeEvents()->sum('amount');

            return $wallet;
        });
        $other_entities = $all_active_entities->where('category', '!=', 'FINANCE')->values();

        $active_entities_counts = $all_active_entities
            ->groupBy('category')
            ->map->count();

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
            'historical_flow' => $historical_flow,
            'forecast' => [
                'projected_amount' => $projected_expenses,
                'upcoming_bills' => $upcoming_bills,
            ],
        ]);
    }
}
