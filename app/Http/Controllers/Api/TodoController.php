<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Todo;
use Illuminate\Http\Request;

class TodoController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->todos()->orderBy('due_date')->orderBy('reminder_time')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'task_name' => ['required', 'string', 'max:255'],
            'due_date' => ['required', 'date'],
            'reminder_time' => ['required', 'date_format:H:i'],
        ]);

        $todo = $request->user()->todos()->create([
            ...$validated,
            'status' => 'pending',
        ]);

        return response()->json($todo, 201);
    }

    public function show(Request $request, Todo $todo)
    {
        $this->authorizeOwner($request, $todo);

        return $todo;
    }

    public function update(Request $request, Todo $todo)
    {
        $this->authorizeOwner($request, $todo);

        $validated = $request->validate([
            'task_name' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'in:pending,completed'],
            'due_date' => ['sometimes', 'date'],
            'reminder_time' => ['sometimes', 'date_format:H:i'],
        ]);

        $todo->update($validated);

        return $todo;
    }

    public function destroy(Request $request, Todo $todo)
    {
        $this->authorizeOwner($request, $todo);

        $todo->delete();

        return response()->json(null, 204);
    }

    private function authorizeOwner(Request $request, Todo $todo): void
    {
        abort_if($todo->user_id !== $request->user()->id, 403);
    }
}