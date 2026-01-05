<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Entity;

class ReportingController extends Controller
{
    /**
     * Display the financial reports.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $now = Carbon::now();

        // If 'month' and 'year' are explicitly provided, show the DETAIL view (Breakdown).
        if ($request->has(['month', 'year'])) {
            return $this->showMonthDetail($request);
        }

        // --- OVERVIEW: List of Months ---
        $monthlyTotals = $user->lifeEvents()
            ->select(
                DB::raw("TO_CHAR(occurred_at, 'YYYY-MM') as month_key"),
                DB::raw("sum(case when type = 'EXPENSE' then abs(amount) else 0 end) as total_expense"),
                DB::raw("sum(case when type = 'INCOME' then amount else 0 end) as total_income")
            )
            ->where('status', '!=', 'SCHEDULED')
            ->groupBy('month_key')
            ->orderBy('month_key', 'desc')
            ->take(12)
            ->get()
            ->keyBy('month_key');

        $months = [];
        // Generate list for the last 12 months (or current year + past)
        for ($i = 0; $i < 12; $i++) {
            $date = $now->copy()->subMonths($i);
            $key = $date->format('Y-m');
            $data = $monthlyTotals[$key] ?? null;

            $months[] = [
                'key' => $key,
                'name' => ucfirst($date->translatedFormat('M. Y')),
                'month' => $date->month,
                'year' => $date->year,
                'expense' => $data ? (float) $data->total_expense : 0,
                'income' => $data ? (float) $data->total_income : 0,
            ];
        }

        return Inertia::render('Reports/Index', [
            'months' => $months,
            'total_net' => $user->lifeEvents()->sum('amount'),
        ]);
    }

    protected function showMonthDetail(Request $request)
    {
        $user = $request->user();
        $month = $request->input('month');
        $year = $request->input('year');
        $type = strtoupper($request->input('type', 'EXPENSE'));

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $query = $user->lifeEvents()
            ->where('type', $type)
            ->whereBetween('occurred_at', [$startDate->toDateString(), $endDate->toDateString()])
            ->where('status', '!=', 'SCHEDULED');

        $totalAmount = (float) $query->sum(DB::raw('abs(amount)'));

        $breakdown = $query->select(
            'to_entity_id',
            DB::raw('sum(abs(amount)) as total'),
            DB::raw('count(*) as count')
        )
            ->groupBy('to_entity_id')
            ->orderByDesc('total')
            ->with('destinationEntity')
            ->get()
            ->map(function ($item) use ($totalAmount) {
                $category = $item->destinationEntity;
                return [
                    'id' => $category ? $category->id : 'uncategorized',
                    'name' => $category ? $category->name : 'Sin Categoría',
                    'icon' => $category->metadata['icon'] ?? '❓',
                    'amount' => (float) $item->total,
                    'count' => (int) $item->count,
                    'percentage' => $totalAmount > 0 ? round(($item->total / $totalAmount) * 100, 1) : 0,
                ];
            });

        // Transactions list for drill-down
        $transactions = $user->lifeEvents()
            ->where('type', $type)
            ->whereBetween('occurred_at', [$startDate->toDateString(), $endDate->toDateString()])
            ->where('status', '!=', 'SCHEDULED')
            ->orderBy('occurred_at', 'desc')
            ->with('destinationEntity')
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'title' => $e->title,
                'amount' => (float) abs($e->amount),
                'date' => $e->occurred_at->format('d M'),
                'category' => $e->destinationEntity->name ?? 'Sin Categoría',
                'icon' => $e->destinationEntity->metadata['icon'] ?? '❓',
            ]);

        return Inertia::render('Reports/Show', [
            'month' => (int) $month,
            'year' => (int) $year,
            'type' => $type,
            'stats' => ['total' => $totalAmount],
            'breakdown' => $breakdown,
            'transactions' => $transactions,
        ]);
    }
}
