<?php
use App\Models\GradeHistory;
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class GradeHistory extends Model
{
    protected $table = 'grade_history';
    protected $fillable = ['grade_id', 'user_id', 'action', 'old_data', 'new_data'];
    protected $casts = ['old_data' => 'array', 'new_data' => 'array'];
    
    public function grade() {
        return $this->belongsTo(Grade::class, 'grade_id', 'id_grade');
    }
    
    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }
}
public function history() {
    $history = GradeHistory::with('user')->orderBy('created_at', 'desc')->get()->map(function ($entry) {
        return [
            'id' => $entry->id,
            'user' => $entry->user->name ?? 'Système',
            'action' => $entry->action,
            'date' => $entry->created_at->format('d/m/Y'),
            'time' => $entry->created_at->format('H:i:s'),
        ];
    });
    return response()->json(['success' => true, 'data' => $history]);
}