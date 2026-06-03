<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Statut extends Model
{
    protected $table = 'statut';

    protected $primaryKey = 'id_statut';

    public $timestamps = false;

    protected $fillable = [
        'lib_statut',
    ];

    protected function casts(): array
    {
        return [
            'id_statut' => 'integer',
        ];
    }
}
