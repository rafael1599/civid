<?php

namespace App\Http\Controllers;

use App\Services\IngestionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IngestController extends Controller
{
    public function __invoke(Request $request, IngestionService $ingestor)
    {
        $validated = $request->validate([
            'prompt' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf,jpg,png,jpeg',
        ]);

        if (empty($validated['prompt']) && empty($validated['file'])) {
            return response()->json(['message' => 'Input required'], 422);
        }

        $input = $request->hasFile('file') ? $request->file('file') : $validated['prompt'];

        $draft = $ingestor->handle($input, $request->user());

        return response()->json([
            'success' => true,
            'draft' => $draft,
            'original_input' => $validated['prompt'] ?? 'File Upload',
        ]);
    }
}
