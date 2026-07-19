<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Todo extends Model
{
    /** @use HasFactory<\Database\Factories\TodoFactory> */
    protected $fillable = [
    'user_id', 'task_name', 'status', 'due_date', 'reminder_time',
];

protected $casts = [
    'due_date' => 'date',
];

public function user()
{
    return $this->belongsTo(User::class);
}

public function waLogs()
{
    return $this->hasMany(WaLog::class);
}
    use HasFactory;
}
