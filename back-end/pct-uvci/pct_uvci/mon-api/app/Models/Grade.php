<?php

/**
 * Grade.php — Modèle Eloquent pour les grades académiques
 *
 * Un grade représente le niveau hiérarchique d'un enseignant dans
 * l'enseignement supérieur (Professeur Titulaire, Maître de Conférences,
 * Assistant, etc.).
 *
 * RÔLE DANS LE CALCUL :
 * Chaque grade définit :
 * - taux_hor_permanent : taux horaire pour les enseignants permanents (€/h)
 * - taux_hor_vacataire : taux horaire pour les vacataires (€/h)
 * - quota_annuel       : nombre maximum d'heures complémentaires autorisées
 *
 * Ces valeurs sont utilisées dans VolumeHoraireService et EtatController
 * pour calculer les montants des heures complémentaires.
 *
 * HISTORIQUE : Chaque modification de ces valeurs est enregistrée dans
 * la table grade_history par GradeController (dans une transaction DB).
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $table      = 'grades';
    protected $primaryKey = 'id_grade';

    /** Ce modèle utilise created_at et updated_at (gérés par Laravel) */
    public $timestamps = true;

    protected $fillable = [
        'lib_grade',          // Libellé (ex: "Maître de Conférences")
        'taux_hor_permanent', // Taux en FCFA ou € par heure (permanents)
        'taux_hor_vacataire', // Taux en FCFA ou € par heure (vacataires)
        'quota_annuel',       // Quota d'heures complémentaires autorisées/an
    ];

    protected function casts(): array
    {
        return [
            'id_grade'            => 'integer',
            'taux_hor_permanent'  => 'integer',
            'taux_hor_vacataire'  => 'integer',
            'quota_annuel'        => 'integer',
        ];
    }
}
