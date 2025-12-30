<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
            ->with('entity:id,name')
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
                    'days_left' => (int) $now->diffInDays($event->occurred_at, false)
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
            ->where('occurred_at', '<=', $now->toDateString())
            ->with(['entity:id,name,category'])
            ->orderBy('occurred_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();


        // Get actual Asset entities for the Graph View
        $assets = $user->entities()
            ->where('category', 'ASSET')
            ->with('children') // Load connected entities (Graph)
            ->get();

        $active_entities = $user->entities()
            ->where('status', 'ACTIVE')
            ->select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->pluck('count', 'category');

        return Inertia::render('Dashboard', [
            'total_balance' => $total_balance,
            'history' => $history,
            'active_entities' => $active_entities,
            'assets' => $assets,
            'forecast' => [
                'projected_amount' => $projected_expenses,
                'upcoming_bills' => $upcoming_bills,
            ],
        ]);
    }
}
