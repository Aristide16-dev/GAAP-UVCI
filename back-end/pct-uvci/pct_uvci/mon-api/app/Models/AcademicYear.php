<?php

/**
 * AcademicYear.php — Modèle Eloquent pour les années académiques
 *
 * Une année académique représente une période d'enseignement universitaire.
 * Elle organise les activités pédagogiques et les calculs de volumes horaires.
 *
 * RÈGLE IMPORTANTE : Une seule année peut être "active" à la fois.
 * C'est l'année active qui est utilisée pour tous les calculs courants
 * (tableau de bord, exports, statistiques).
 *
 * STRUCTURE D'UNE ANNÉE :
 * - Semestre impair  : 1er semestre (ex: octobre → janvier)
 * - Semestre pair    : 2ème semestre (ex: février → juin)
 *
 * La méthode scopeActive() permet de récupérer rapidement l'année en cours :
 *   AcademicYear::active()->first();
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    protected $fillable = [
        'year_label',          // Ex: "2025-2026"
        'odd_semester_start',  // Début du 1er semestre
        'odd_semester_end',    // Fin du 1er semestre
        'even_semester_start', // Début du 2ème semestre
        'even_semester_end',   // Fin du 2ème semestre
        'is_active',           // true = année académique en cours
    ];

    /** Conversion automatique des dates et booléens */
    protected $casts = [
        'odd_semester_start' => 'date',
        'odd_semester_end' => 'date',
        'even_semester_start' => 'date',
        'even_semester_end' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Scope Eloquent : filtre sur l'année actuellement active.
     * Utilisation : AcademicYear::active()->first()
     * Équivalent SQL : WHERE is_active = 1
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
