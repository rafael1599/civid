<?php

namespace App\Http\Controllers;

use App\Models\Entity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'balance' => 'required|numeric',
        ]);

        return DB::transaction(function () use ($user, $validated) {
            \Illuminate\Support\Facades\Log::info('Creating wallet', ['validated' => $validated]);

            $wallet = $user->entities()->create([
                'name' => $validated['name'],
                'category' => 'FINANCE',
                'status' => 'ACTIVE',
            ]);

            \Illuminate\Support\Facades\Log::info('Wallet created', ['wallet' => $wallet->toArray()]);

            // Create an INITIAL_BALANCE event to set the balance
            if ($validated['balance'] != 0) {
                $event = $user->lifeEvents()->create([
                    'entity_id' => $wallet->id,
                    'title' => 'Saldo Inicial',
                    'amount' => $validated['balance'],
                    'type' => $validated['balance'] >= 0 ? 'INCOME' : 'EXPENSE',
                    'status' => 'COMPLETED',
                    'occurred_at' => now()->toDateString(),
                    'metadata' => ['system_note' => 'Manual balance initialization'],
                ]);
                \Illuminate\Support\Facades\Log::info('Initial balance event created', ['event' => $event->toArray()]);
            } else {
                \Illuminate\Support\Facades\Log::info('Skipping initial balance event', ['balance' => $validated['balance']]);
            }

            if ($request->wantsJson()) {
                return response()->json(['wallet' => $wallet, 'message' => 'Billetera creada.']);
            }

            return redirect()->back()->with('success', 'Billetera creada.');
        });
    }

    public function update(Request $request, Entity $wallet)
    {
        if ($request->user()->id !== $wallet->user_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'balance' => 'nullable|numeric',
        ]);

        return DB::transaction(function () use ($wallet, $validated) {
            \Illuminate\Support\Facades\Log::info('Updating wallet', ['id' => $wallet->id, 'validated' => $validated]);

            $wallet->update([
                'name' => $validated['name'],
            ]);

            if (isset($validated['balance'])) {
                $currentBalance = $wallet->lifeEvents()->sum('amount');
                $adjustment = $validated['balance'] - $currentBalance;

                \Illuminate\Support\Facades\Log::info('Balance adjustment calc', [
                    'target' => $validated['balance'],
                    'current' => $currentBalance,
                    'diff' => $adjustment
                ]);

                if (abs($adjustment) > 0.001) { // Float comparison safety
                    $event = $wallet->user->lifeEvents()->create([
                        'entity_id' => $wallet->id,
                        'title' => 'Ajuste de Saldo',
                        'amount' => $adjustment,
                        'type' => $adjustment > 0 ? 'INCOME' : 'EXPENSE',
                        'status' => 'COMPLETED',
                        'occurred_at' => now()->toDateString(), // Use Date only for SQLite consistency
                        'metadata' => ['system_note' => 'Manual balance adjustment'],
                    ]);
                    \Illuminate\Support\Facades\Log::info('Adjustment event created', ['event' => $event->toArray()]);
                } else {
                    \Illuminate\Support\Facades\Log::info('No adjustment needed');
                }
            }

            return redirect()->back()->with('success', 'Billetera actualizada.');
        });
    }

    public function destroy(Request $request, Entity $wallet)
    {
        if ($request->user()->id !== $wallet->user_id) {
            abort(403);
        }

        // Soft delete the entity
        $wallet->delete();

        return redirect()->back()->with('success', 'Billetera eliminada.');
    }
}
