<?php

/**
 * Administrateur.php — Modèle Eloquent pour les administrateurs
 *
 * L'administrateur est le gestionnaire principal de l'application.
 * Il peut créer des comptes, configurer les barèmes, les années académiques,
 * consulter tous les rapports et envoyer des notifications.
 *
 * PARTICULARITÉS :
 * - La clé primaire est une STRING (user_log_adm) et non un entier auto-incrémenté.
 *   Cela est dû à la conception initiale de la base de données.
 * - HasApiTokens : permet l'authentification via token Bearer (Sanctum)
 * - Pas de timestamps : created_at/updated_at ne sont pas gérés par Laravel
 *
 * CHAMPS ACADÉMIQUES SPÉCIFIQUES :
 * - ann_aca   : année académique de référence
 * - para_cal  : paramètre de calcul des volumes horaires
 * - coef_niv  : coefficient de niveau (utilisé dans les formules de calcul)
 * - taux_hor  : taux horaire de référence de l'établissement
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Administrateur extends Model
{
    use HasApiTokens;

    protected $table = 'administrateur';

    /**
     * Clé primaire STRING (login) au lieu d'un entier auto-incrémenté.
     * incrementing = false indique à Laravel que la clé n'est pas auto-générée.
     */
    protected $primaryKey = 'user_log_adm';
    public $incrementing  = false;
    protected $keyType    = 'string';

    public $timestamps = false;

    protected $fillable = [
        'user_log_adm',  // Login unique de l'administrateur
        'user_pasw_adm', // Mot de passe haché
        'ann_aca',       // Année académique (ex: 2026)
        'rol_usr',       // Rôle dans l'application ("Administrateur")
        'para_cal',      // Paramètre de calcul des heures
        'coef_niv',      // Coefficient global des niveaux
        'taux_hor',      // Taux horaire de référence
        'nom_adm',       // Nom de famille (optionnel, peut être null)
        'pren_adm',      // Prénom (optionnel)
        'email_adm',     // Email professionnel
        'status',        // ACTIF ou INACTIF
        'last_login_at', // Horodatage de la dernière connexion
    ];

    /** Le mot de passe est exclu de toutes les réponses JSON */
    protected $hidden = ['user_pasw_adm'];

    /** Conversions de types automatiques pour les champs numériques */
    protected function casts(): array
    {
        return [
            'ann_aca'   => 'integer',
            'para_cal'  => 'decimal:2',
            'coef_niv'  => 'decimal:2',
            'taux_hor'  => 'decimal:2',
        ];
    }
}
