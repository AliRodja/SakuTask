<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\TodoController;
use App\Http\Controllers\Api\WaLogController;
use App\Http\Controllers\Api\SettingsController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn (Illuminate\Http\Request $request) => $request->user());

    Route::apiResource('finances', FinanceController::class);
    Route::apiResource('todos', TodoController::class);
    Route::get('/wa-logs', [WaLogController::class, 'index']);

    Route::put('/user', [SettingsController::class, 'updateProfile']);
    Route::put('/user/preferences', [SettingsController::class, 'updatePreferences']);
    Route::put('/user/password', [SettingsController::class, 'updatePassword']);
    Route::delete('/user', [SettingsController::class, 'destroyAccount']);
    Route::get('/sessions', [SettingsController::class, 'sessions']);
    Route::delete('/sessions/{id}', [SettingsController::class, 'destroySession']);
    Route::get('/whatsapp/status', [SettingsController::class, 'whatsappStatus']);
});