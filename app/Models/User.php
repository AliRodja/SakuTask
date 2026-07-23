<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
    'name',
    'email',
    'password',
    'whatsapp_number',
    'role',
    'wa_notifications_enabled',
];

public function finances()
{
    return $this->hasMany(Finance::class);
}

public function todos()
{
    return $this->hasMany(Todo::class);
}

public function waLogs()
{
    return $this->hasMany(WaLog::class);
}

/**
 * Normalize to international format (62...) whenever whatsapp_number is
 * set, so local-format input (0...) never gets stored and silently
 * breaks WhatsApp delivery.
 */
protected function whatsappNumber(): Attribute
{
    return Attribute::make(
        set: function (string $value) {
            $digits = preg_replace('/[^0-9]/', '', $value);

            if (str_starts_with($digits, '0')) {
                $digits = '62' . substr($digits, 1);
            }

            return $digits;
        },
    );
}

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'wa_notifications_enabled' => 'boolean',
        ];
    }
}
