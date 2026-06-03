<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ressource extends Model
{
    protected $table = 'ressource';

    protected $primaryKey = 'id_res';

    public $timestamps = false;

    protected $fillable = [
        'id_seq',
        'id_typ_res',
        'id_cours',
        'titre_res',
    ];

    protected function casts(): array
    {
        return [
            'id_res' => 'integer',
            'id_seq' => 'integer',
            'id_typ_res' => 'integer',
            'id_cours' => 'integer',
        ];
    }
}
