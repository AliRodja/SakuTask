<?php

namespace App\Console\Commands;

use App\Models\Todo;
use App\Models\WaLog;
use App\Services\WhatsAppNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SendWhatsappReminders extends Command
{
    protected $signature = 'app:send-whatsapp-reminders';
    protected $description = 'Kirim reminder WhatsApp untuk todo yang waktunya sudah tiba';

    public function handle(WhatsAppNotificationService $wa): void
    {
        $now = Carbon::now();

        $todos = Todo::with('user')
            ->where('status', 'pending')
            ->whereDate('due_date', $now->toDateString())
            ->whereRaw("to_char(reminder_time, 'HH24:MI') = ?", [$now->format('H:i')])
            ->get();

        foreach ($todos as $todo) {
            $alreadySent = WaLog::where('todo_id', $todo->id)
                ->where('status', 'sent')
                ->whereBetween('sent_at', [$now->copy()->startOfMinute(), $now->copy()->endOfMinute()])
                ->exists();

            if ($alreadySent) {
                continue;
            }

            $balance = $todo->user->finances()->where('type', 'in')->sum('amount')
                - $todo->user->finances()->where('type', 'out')->sum('amount');

            $message = "Halo {$todo->user->name}! 👋 Ini adalah pengingat otomatis dari SakuTask. "
                . "Waktunya melakukan tugas: *{$todo->task_name}* sekarang. Jangan lupa diselesaikan ya!\n\n"
                . "📊 *Info Keuangan Kamu:* Sisa saldo saat ini: Rp" . number_format($balance, 0, ',', '.') . ". Tetap hemat ya!";

            $success = $wa->send($todo->user->whatsapp_number, $message);

            WaLog::create([
                'user_id' => $todo->user_id,
                'todo_id' => $todo->id,
                'status' => $success ? 'sent' : 'failed',
                'sent_at' => $now,
            ]);

            $this->info("Reminder todo #{$todo->id}: " . ($success ? 'terkirim' : 'gagal'));
        }
    }
}