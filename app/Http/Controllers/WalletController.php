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
            $wallet = $user->entities()->create([
                'name' => $validated['name'],
                'category' => 'FINANCE',
                'status' => 'ACTIVE',
            ]);

            // Create an INITIAL_BALANCE event to set the balance
            if ($validated['balance'] != 0) {
                $user->lifeEvents()->create([
                    'entity_id' => $wallet->id,
                    'title' => 'Saldo Inicial',
                    'amount' => $validated['balance'],
                    'type' => $validated['balance'] >= 0 ? 'INCOME' : 'EXPENSE',
                    'status' => 'COMPLETED',
                    'occurred_at' => now(),
                    'metadata' => ['system_note' => 'Manual balance initialization'],
                ]);
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
            $wallet->update([
                'name' => $validated['name'],
            ]);

            if (isset($validated['balance'])) {
                $currentBalance = $wallet->lifeEvents()->sum('amount');
                $adjustment = $validated['balance'] - $currentBalance;

                if ($adjustment != 0) {
                    $wallet->user->lifeEvents()->create([
                        'entity_id' => $wallet->id,
                        'title' => 'Ajuste de Saldo',
                        'amount' => $adjustment,
                        'type' => $adjustment > 0 ? 'INCOME' : 'EXPENSE',
                        'status' => 'COMPLETED',
                        'occurred_at' => now(),
                        'metadata' => ['system_note' => 'Manual balance adjustment'],
                    ]);
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
