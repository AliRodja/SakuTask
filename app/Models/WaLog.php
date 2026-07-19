<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaLog extends Model
{
    /** @use HasFactory<\Database\Factories\WaLogFactory> */
    protected $fillable = [
    'user_id', 'todo_id', 'status', 'sent_at',
];

protected $casts = [
    'sent_at' => 'datetime',
];

public function user()
{
    return $this->belongsTo(User::class);
}

public function todo()
{
    return $this->belongsTo(Todo::class);
}
    use HasFactory;
}
