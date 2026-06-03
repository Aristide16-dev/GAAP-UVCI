<?php

/**
 * SecretairePrincipal.php — Modèle Eloquent pour la secrétaire principale
 *
 * La secrétaire principale est l'opératrice principale du système.
 * Elle saisit les activités pédagogiques des enseignants, gère les cours,
 * et génère les exports de données.
 *
 * PARTICULARITÉS :
 * - Clé primaire STRING : user_log_sp (login), pas un entier auto-incrémenté
 * - Liée à un administrateur via user_log_adm (qui l'a créée)
 * - Authentification via token Sanctum (HasApiTokens)
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class SecretairePrincipal extends Model
{
    use HasApiTokens;

    protected $table = 'secretaire_principal';

    /** Clé primaire STRING (login) — pas d'auto-incrément */
    protected $primaryKey = 'user_log_sp';
    public $incrementing  = false;
    protected $keyType    = 'string';

    public $timestamps = false;

    protected $fillable = [
        'user_log_sp',   // Login unique de la secrétaire
        'user_log_adm',  // Login de l'administrateur référent
        'user_pasw_sp',  // Mot de passe haché
        'nom_sp',        // Nom de famille
        'pren_sp',       // Prénom
        'email_sp',      // Email professionnel
        'rol_sp',        // Rôle ("Secrétaire")
    ];

    /** Mot de passe jamais exposé dans les réponses JSON */
    protected $hidden = ['user_pasw_sp'];
}
