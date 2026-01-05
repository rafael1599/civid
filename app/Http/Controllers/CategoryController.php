<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Entity;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $incomeCategories = $user->entities()
            ->where('category', 'INCOME_CATEGORY')
            ->orderBy('name')
            ->get();

        $expenseCategories = $user->entities()
            ->where('category', 'EXPENSE_CATEGORY')
            ->orderBy('name')
            ->get();

        return Inertia::render('Categories/Index', [
            'incomeCategories' => $incomeCategories,
            'expenseCategories' => $expenseCategories,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:INCOME,EXPENSE', // Type from UI (Income/Expense)
            'icon' => 'nullable|string|max:50', // E.g., emoji or icon class
        ]);

        $categoryType = $validated['type'] === 'INCOME' ? 'INCOME_CATEGORY' : 'EXPENSE_CATEGORY';

        $request->user()->entities()->create([
            'name' => $validated['name'],
            'category' => $categoryType,
            'status' => 'ACTIVE',
            'metadata' => [
                'icon' => $validated['icon'] ?? '🏷️', // Default icon
            ],
        ]);

        return redirect()->back()->with('success', 'Categoría creada.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Entity $category)
    {
        if ($request->user()->id !== $category->user_id) {
            abort(403);
        }

        $category->delete();

        return redirect()->back()->with('success', 'Categoría eliminada.');
    }
}
