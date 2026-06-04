<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeRessource extends Model
{
    protected $table = 'type_ressource';

    protected $primaryKey = 'id_typ_res';

    public $timestamps = false;

    protected $fillable = [
        'typ_res',
        'id_niv_complex',
    ];

    protected function casts(): array
    {
        return [
            'id_typ_res' => 'integer',
            'id_niv_complex' => 'integer',
        ];
    }
}
