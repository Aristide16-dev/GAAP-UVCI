<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ComplexityHistory extends Model
{
    protected $table = 'complexity_history';
    protected $fillable = ['niveau_complexite_id', 'user_id', 'action', 'old_data', 'new_data'];
    protected $casts = ['old_data' => 'array', 'new_data' => 'array'];
    
    public function niveauComplexite() {
        return $this->belongsTo(NiveauComplexite::class, 'niveau_complexite_id', 'id_niv_complex');
    }
    
    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }
}