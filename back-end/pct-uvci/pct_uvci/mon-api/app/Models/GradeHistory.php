<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeHistory extends Model
{
    protected $table = 'grade_history';

    protected $fillable = ['grade_id', 'user_id', 'action', 'old_data', 'new_data'];

    protected $casts = ['old_data' => 'array', 'new_data' => 'array'];

    public function grade()
    {
        return $this->belongsTo(Grade::class, 'grade_id', 'id_grade');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
