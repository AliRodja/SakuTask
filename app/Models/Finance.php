<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Finance extends Model
{
    /** @use HasFactory<\Database\Factories\FinanceFactory> */
    protected $fillable = [
    'user_id', 'type', 'amount', 'category', 'description', 'date',
];

protected $casts = [
    'date' => 'date',
];

public function user()
{
    return $this->belongsTo(User::class);
}
    use HasFactory;
}
