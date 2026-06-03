<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Departement extends Model
{
    protected $table = 'departement';

    protected $primaryKey = 'id_depart';

    public $timestamps = false;

    protected $fillable = [
        'lib_depart',
    ];

    protected function casts(): array
    {
        return [
            'id_depart' => 'integer',
        ];
    }
}
