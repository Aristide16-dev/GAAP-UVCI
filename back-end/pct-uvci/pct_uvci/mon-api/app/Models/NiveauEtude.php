<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NiveauEtude extends Model
{
    protected $table = 'niveau_etude';

    protected $primaryKey = 'id_niveau';

    public $timestamps = false;

    protected $fillable = [
        'lib_niveau',
    ];

    protected function casts(): array
    {
        return [
            'id_niveau' => 'integer',
        ];
    }
}
