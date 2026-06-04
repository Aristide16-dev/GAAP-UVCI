<?php

/**
 * Cours.php — Modèle Eloquent pour les cours (matières enseignées)
 *
 * Un "cours" représente une matière universitaire enseignée à l'UVCI.
 * Chaque cours appartient à un niveau d'études et a un volume horaire défini.
 *
 * RÔLE DANS LE CALCUL :
 * nb_heures est la donnée clé utilisée dans la formule de calcul du volume horaire :
 *   nb_sequences = nb_heures × 4  (4 séquences de 15min = 1 heure)
 *   volume = nb_sequences × coeff_niv × multiplicateur_activite
 *
 * CHAMPS IMPORTANTS :
 * - int_cours   : intitulé/nom de la matière (ex: "Algorithmique")
 * - filiere     : filière concernée (ex: "Licence Informatique")
 * - nb_heures   : volume horaire total prévu par le cours
 * - id_typ_res  : type de ressource pédagogique par défaut pour ce cours
 *                 (détermine le niveau de complexité automatique en saisie)
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cours extends Model
{
    protected $table = 'cours';

    protected $primaryKey = 'id_cours';

    public $timestamps = false;

    protected $fillable = [
        'id_niveau',   // Niveau d'études (L1, L2, M1...)
        'int_cours',   // Intitulé de la matière
        'filiere',     // Filière (ex: "Informatique")
        'semestre',    // Semestre (S1, S2, S3, S4...)
        'nb_heures',   // Volume horaire total (ex: 30 heures)
        'nb_credits',  // Crédits ECTS accordés
        'id_typ_res',  // Type de ressource pédagogique par défaut
    ];

    protected function casts(): array
    {
        return [
            'id_cours' => 'integer',
            'id_niveau' => 'integer',
            'nb_heures' => 'integer',
            'nb_credits' => 'integer',
            'id_typ_res' => 'integer',
        ];
    }
}
