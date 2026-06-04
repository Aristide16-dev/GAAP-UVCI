<?php

/**
 * TypeActivite.php — Modèle Eloquent pour les types d'activités pédagogiques
 *
 * Un type d'activité définit la NATURE de l'intervention d'un enseignant :
 * Cours Magistral (CM), Travaux Dirigés (TD), Travaux Pratiques (TP),
 * Encadrement de stage, Jury de soutenance, etc.
 *
 * RÔLE DANS LE CALCUL :
 * Le multiplicateur_base est le 3ème paramètre de la formule :
 *   volume = nb_sequences × coeff_niv_complex × multiplicateur_base
 *
 * Exemple :
 * - Cours Magistral : multiplicateur = 1.0 (volume normal)
 * - TD : multiplicateur = 1.0 (même pondération)
 * - TP : multiplicateur = 0.67 (TD ÷ 1.5, volume réduit)
 * - Jury : multiplicateur = 2.0 (activité valorisée)
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeActivite extends Model
{
    protected $table = 'type_activite';

    protected $primaryKey = 'id_typ_activite';

    public $timestamps = false;

    protected $fillable = [
        'lib_activite',       // Libellé (ex: "Cours Magistral", "TD", "TP")
        'multiplicateur_base', // Coefficient de pondération du type d'activité
    ];

    protected function casts(): array
    {
        return [
            'id_typ_activite' => 'integer',
            'multiplicateur_base' => 'decimal:2',
        ];
    }
}
