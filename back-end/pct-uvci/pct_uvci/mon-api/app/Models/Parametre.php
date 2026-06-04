<?php

/**
 * Parametre.php — Modèle Eloquent pour les paramètres de calcul académiques
 *
 * Un paramètre représente la configuration de calcul pour une période académique.
 * Il définit l'année et les dates de référence pour les activités pédagogiques.
 *
 * UTILISATION :
 * Chaque activité pédagogique est liée à un paramètre via id_param.
 * Cela permet de filtrer les activités par année académique.
 *
 * CHAMPS :
 * - annee_acad       : l'année académique (ex: 2025 pour 2025-2026)
 * - taux_hor_defaut  : taux horaire de référence de l'établissement
 * - date_debut       : début de la période de saisie
 * - date_fin         : fin de la période de saisie
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Parametre extends Model
{
    protected $table = 'parametre';

    protected $primaryKey = 'id_param';

    public $timestamps = false;

    protected $fillable = [
        'user_log_adm',    // Administrateur ayant créé ce paramètre
        'annee_acad',      // Année académique (ex: 2025)
        'taux_hor_defaut', // Taux horaire de référence de l'établissement
        'date_debut',      // Début de la période de saisie des activités
        'date_fin',        // Fin de la période de saisie
    ];

    protected function casts(): array
    {
        return [
            'id_param' => 'integer',
            'annee_acad' => 'integer',
            'taux_hor_defaut' => 'decimal:2',
            'date_debut' => 'date',
            'date_fin' => 'date',
        ];
    }
}
