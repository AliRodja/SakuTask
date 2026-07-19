<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Finance;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->finances()->latest('date')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:in,out'],
            'amount' => ['required', 'numeric', 'min:0'],
            'category' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'date' => ['required', 'date'],
        ]);

        $finance = $request->user()->finances()->create($validated);

        return response()->json($finance, 201);
    }

    public function show(Request $request, Finance $finance)
    {
        $this->authorizeOwner($request, $finance);

        return $finance;
    }

    public function update(Request $request, Finance $finance)
    {
        $this->authorizeOwner($request, $finance);

        $validated = $request->validate([
            'type' => ['sometimes', 'in:in,out'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'category' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'date' => ['sometimes', 'date'],
        ]);

        $finance->update($validated);

        return $finance;
    }

    public function destroy(Request $request, Finance $finance)
    {
        $this->authorizeOwner($request, $finance);

        $finance->delete();

        return response()->json(null, 204);
    }

    private function authorizeOwner(Request $request, Finance $finance): void
    {
        abort_if($finance->user_id !== $request->user()->id, 403);
    }
}