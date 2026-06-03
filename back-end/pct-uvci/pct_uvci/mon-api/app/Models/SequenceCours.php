<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SequenceCours extends Model
{
    protected $table = 'sequence_cours';

    protected $primaryKey = 'id_seq';

    public $timestamps = false;

    protected $fillable = [
        'id_cours',
        'titre_seq',
    ];

    protected function casts(): array
    {
        return [
            'id_seq' => 'integer',
            'id_cours' => 'integer',
        ];
    }
}
