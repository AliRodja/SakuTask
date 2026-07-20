<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\TodoController;
use App\Http\Controllers\Api\WaLogController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn (Illuminate\Http\Request $request) => $request->user());

    Route::apiResource('finances', FinanceController::class);
    Route::apiResource('todos', TodoController::class);
    Route::get('/wa-logs', [WaLogController::class, 'index']);
});