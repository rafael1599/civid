<?php

namespace App\Http\Controllers\Inbox;

use App\Http\Controllers\Controller;
use App\Models\PendingConfirmation;
use App\Services\IngestionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PendingConfirmationController extends Controller
{
    public function index(Request $request)
    {
        $pending = PendingConfirmation::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->orderByDesc('confidence_score')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Inbox/PendingInbox', [
            'pendingItems' => $pending,
            'entities' => $request->user()->entities()->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function confirm(Request $request, PendingConfirmation $confirmation, IngestionService $ingestion)
    {
        $this->authorize('update', $confirmation);

        // Allow user to override extracted fields before confirming
        $finalData = $request->input('data', $confirmation->extracted_data);

        // Execute the "confirmed" action (e.g., create LifeEvent, Entity)
        // We reuse IngestionService logic here or call a specific service
        // For now, we assume IngestionService can handle "execution" of structured data
        try {
            $ingestion->executeActions($finalData, $request->user());

            $confirmation->update([
                'status' => 'confirmed',
                'extracted_data' => $finalData,
                'processed_at' => now(),
            ]);

            return back()->with('success', 'Confirmación procesada exitosamente.');
        } catch (\Exception $e) {
            \Log::error('Confirmation failed', [
                'user_id' => $request->user()->id,
                'confirmation_id' => $confirmation->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Error al procesar: '.$e->getMessage());
        }
    }

    public function destroy(Request $request, PendingConfirmation $confirmation)
    {
        $this->authorize('delete', $confirmation);

        $confirmation->update([
            'status' => 'discarded',
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Elemento descartado.');
    }

    public function bulkConfirm(Request $request, IngestionService $ingestion)
    {
        $ids = $request->input('ids', []);
        $confirmations = PendingConfirmation::whereIn('id', $ids)
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->get();

        $count = 0;
        foreach ($confirmations as $confirmation) {
            try {
                $ingestion->executeActions($confirmation->extracted_data, $request->user());

                $confirmation->update([
                    'status' => 'confirmed',
                    'processed_at' => now(),
                ]);
                $count++;
            } catch (\Exception $e) {
                // Continue processing others, but maybe log error
                \Log::error('Bulk confirm failed', [
                    'confirmation_id' => $confirmation->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        return back()->with('success', "{$count} elementos confirmados exitosamente.");
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);

        PendingConfirmation::whereIn('id', $ids)
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->update([
                'status' => 'discarded',
                'processed_at' => now(),
            ]);

        return back()->with('success', count($ids).' elementos descartados.');
    }

    public function scan(Request $request)
    {
        try {
            \App\Jobs\ScanUserSocialData::dispatch($request->user());

            return back()->with('success', 'Escaneo iniciado en segundo plano. Te notificaremos cuando termine.');
        } catch (\Exception $e) {
            \Log::error('Manual scan dispatch failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Error al iniciar el escaneo: '.$e->getMessage());
        }
    }
}
