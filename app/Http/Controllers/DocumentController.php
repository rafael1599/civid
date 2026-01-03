<?php

namespace App\Http\Controllers;

use App\Models\Document;
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
        $documents = $request->user()->documents()
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

        return \Inertia\Inertia::render('Documents/Index', [
            'vault' => $documents,
        ]);
    }
}
