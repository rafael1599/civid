<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;
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
        $filename = time() . '-' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();

        // Use the 'r2' disk
        $path = $file->storeAs('documents/' . $user->id, $filename, 'r2');

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
}
