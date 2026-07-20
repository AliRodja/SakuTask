<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class WaLogController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()
            ->waLogs()
            ->with('todo:id,task_name')
            ->latest('sent_at')
            ->take(50)
            ->get();
    }
}
