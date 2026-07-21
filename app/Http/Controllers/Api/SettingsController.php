<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SettingsController extends Controller
{
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'whatsapp_number' => ['required', 'string', 'max:20'],
        ]);

        $user->update($validated);

        return $user;
    }

    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'wa_notifications_enabled' => ['required', 'boolean'],
        ]);

        $request->user()->update($validated);

        return $request->user();
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Password saat ini salah.'], 422);
        }

        $user->update(['password' => Hash::make($validated['password'])]);

        return response()->json(['message' => 'Password berhasil diperbarui.']);
    }

    public function sessions(Request $request)
    {
        $currentTokenId = $request->user()->currentAccessToken()->id;

        return $request->user()->tokens()->latest('last_used_at')->get()->map(function ($token) use ($currentTokenId) {
            return [
                'id' => $token->id,
                'name' => $token->name,
                'last_used_at' => $token->last_used_at,
                'created_at' => $token->created_at,
                'is_current' => $token->id === $currentTokenId,
            ];
        });
    }

    public function destroySession(Request $request, int $id)
    {
        $token = $request->user()->tokens()->where('id', $id)->first();

        abort_if(! $token, 404);

        $token->delete();

        return response()->json(['message' => 'Sesi berhasil dihapus.']);
    }

    public function destroyAccount(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Akun berhasil dihapus.']);
    }

    public function whatsappStatus(Request $request, WhatsAppNotificationService $wa)
    {
        $connected = $wa->checkConnection($request->user()->whatsapp_number);

        return response()->json(['connected' => $connected]);
    }
}
