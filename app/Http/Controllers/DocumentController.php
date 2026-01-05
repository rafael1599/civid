<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB limit
            'entity_id' => 'nullable|uuid|exists:entities,id',
            'life_event_id' => 'nullable|uuid|exists:life_events,id',
            'name' => 'nullable|string|max:255',
        ]);

        $file = $request->file('file');
        $user = $request->user();

        // Generate a clean filename: timestamp-original-name
        $filename = time().'-'.Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'.'.$file->getClientOriginalExtension();

        // Use the 'r2' disk
        $path = $file->storeAs('documents/'.$user->id, $filename, 'r2');

        $document = Document::create([
            'user_id' => $user->id,
            'entity_id' => $request->entity_id,
            'life_event_id' => $request->life_event_id,
            'name' => $request->name ?? $file->getClientOriginalName(),
            'path' => $path,
            'file_type' => $file->getClientMimeType(),
        ]);

        return back()->with('success', 'Documento cargado correctamente.');
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $now = Carbon::now();

        // 1. All Assets with their documents
        $assets = $user->entities()
            ->where('category', 'ASSET')
            ->where('status', 'ACTIVE')
            ->with([
                'documents' => function ($query) {
                    $query->orderBy('created_at', 'desc');
                },
            ])
            ->get();

        // 2. All documents grouped by month (the original vault list)
        $documents = $user->documents()
            ->with(['entity:id,name', 'lifeEvent:id,title,amount'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'name' => $doc->name,
                    'path' => $doc->path,
                    'file_type' => $doc->file_type,
                    'created_at' => $doc->created_at->format('d M, Y'),
                    'month_group' => $doc->created_at->format('F Y'),
                    'entity_name' => $doc->entity->name ?? null,
                    'event_title' => $doc->lifeEvent->title ?? null,
                    'event_amount' => $doc->lifeEvent->amount ?? null,
                ];
            })
            ->groupBy('month_group');

        // 3. Ecosystem Data (Relocated from Dashboard)
        $all_active_entities = $user->entities()
            ->where('status', 'ACTIVE')
            ->get(['id', 'name', 'category']);

        $other_entities_raw = $all_active_entities->where('category', '!=', 'FINANCE')->values()->map(function ($entity) use ($now) {
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
            $entity->load(['childRelationships', 'parentRelationships']);

            return $entity;
        });

        $ecosystem_data = $other_entities_raw->map(fn ($entity) => [
            'id' => $entity->id,
            'name' => $entity->name,
            'category' => $entity->category,
            'status' => $entity->alert_status,
            'value' => (float) ($entity->metadata['value'] ?? 0),
            'connections' => $entity->childRelationships->map(fn ($rel) => [
                'target' => $rel->child_entity_id,
                'type' => $rel->relationship_type,
            ])->values(),
        ]);

        return \Inertia\Inertia::render('Documents/Index', [
            'assets' => $assets,
            'vault' => $documents,
            'ecosystem' => $ecosystem_data,
            'entities' => $other_entities_raw, // For relationship name lookup
        ]);
    }
}
