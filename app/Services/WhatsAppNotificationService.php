<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class WhatsAppNotificationService
{
    public function send(string $number, string $message): bool
    {
        $response = Http::post(config('services.whatsapp.url') . '/send', [
            'number' => $number,
            'message' => $message,
        ]);

        return $response->successful() && $response->json('success') === true;
    }

    public function checkConnection(string $number): bool
    {
        $response = Http::timeout(10)->get(config('services.whatsapp.url') . "/check/{$number}");

        return $response->successful()
            && $response->json('success') === true
            && $response->json('result.exists') === true;
    }
}