<?php

/**
 * NiveauComplexite.php — Modèle Eloquent pour les niveaux de complexité
 *
 * Un niveau de complexité représente la difficulté d'une intervention pédagogique.
 * C'est l'un des trois paramètres de la formule de calcul du volume horaire.
 *
 * NIVEAUX STANDARDS DE L'UVCI :
 * - N1 : coeff = 0.40 → intervention simple (ex: surveillance d'examen)
 * - N2 : coeff = 0.75 → intervention moyenne (ex: TD standard)
 * - N3 : coeff = 1.50 → intervention complexe (ex: cours magistral spécialisé)
 *
 * FORMULE : volume = nb_sequences × coeff_niv_complex × multiplicateur_activite
 *
 * HISTORIQUE : Chaque modification du coefficient est enregistrée dans la table
 * complexity_history par NiveauComplexiteController (dans une transaction DB).
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NiveauComplexite extends Model
{
    protected $table      = 'niveaux_complexite';
    protected $primaryKey = 'id_niv_complex';
    public $timestamps    = true; // created_at et updated_at gérés automatiquement

    protected $fillable = [
        'lib_niv_complex',    // Libellé (ex: "N1 - Simple", "N2 - Moyen", "N3 - Complexe")
        'coeff_niv_complex',  // Le coefficient multiplicateur (ex: 0.40, 0.75, 1.50)
        'description',        // Description optionnelle du niveau
        'user_log_adm',       // Administrateur qui a défini ce niveau
    ];

    protected function casts(): array
    {
        return [
            'id_niv_complex'   => 'integer',
            'coeff_niv_complex' => 'float',  // Nombre décimal précis
        ];
    }
}
