<?php

/**
 * Enseignant.php — Modèle Eloquent pour les enseignants de l'UVCI
 *
 * Ce modèle représente un enseignant dans la base de données.
 * Il est connecté à la table `enseignants` et sait comment :
 * - Lire et écrire les données d'un enseignant
 * - Vérifier son authentification via Sanctum (HasApiTokens)
 * - Calculer son taux horaire effectif selon son grade et statut
 *
 * CHAMPS IMPORTANTS :
 * - user_log_ens / user_pasw_ens : identifiants de connexion
 * - id_grade : référence vers le grade (barème horaire)
 * - id_statut : Permanent ou Vacataire (influe sur le taux horaire)
 * - status : ACTIF ou INACTIF (un compte inactif ne peut pas se connecter)
 * - taux_hor_ens : taux horaire personnalisé (utilisé si le grade n'a pas de taux)
 */

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Enseignant extends Authenticatable
{
    // HasApiTokens permet à l'enseignant de s'authentifier via des tokens Sanctum
    use HasApiTokens;

    /** Nom de la table dans la base de données */
    protected $table = 'enseignants';

    /** Clé primaire (non-standard : pas "id" mais "id_ens") */
    protected $primaryKey = 'id_ens';

    /** Pas de colonnes created_at/updated_at dans cette table */
    public $timestamps = false;

    /**
     * Champs autorisés à être remplis en masse (mass assignment).
     * Tout champ absent de cette liste sera ignoré lors d'un create() ou update().
     * 'status' est inclus pour permettre la création avec statut ACTIF.
     * 'last_login_at' est inclus pour la mise à jour lors de la connexion.
     */
    protected $fillable = [
        'user_log_adm',  // Login de l'administrateur ayant créé le compte
        'user_log_sp',   // Login de la secrétaire ayant créé le compte
        'id_grade',      // Grade académique
        'id_statut',     // Type de contrat (Permanent/Vacataire)
        'id_depart',     // Département de rattachement
        'user_log_ens',  // Login de connexion
        'user_pasw_ens', // Mot de passe haché
        'nom_ens',       // Nom de famille
        'pren_ens',      // Prénom
        'email_ens',     // Email professionnel
        'tel_ens',       // Téléphone
        'taux_hor_ens',  // Taux horaire personnalisé
        'status',        // ACTIF ou INACTIF
        'last_login_at', // Dernière connexion (mis à jour automatiquement)
    ];

    /**
     * Champs exclus des réponses JSON pour protéger les données sensibles.
     * Le mot de passe ne sera JAMAIS renvoyé dans les réponses API.
     */
    protected $hidden = ['user_pasw_ens'];

    /**
     * Conversions automatiques des types de données.
     * Laravel convertit automatiquement ces champs au bon type PHP.
     */
    protected function casts(): array
    {
        return [
            'id_ens' => 'integer',
            'id_grade' => 'integer',
            'id_statut' => 'integer',
            'id_depart' => 'integer',
            'taux_hor_ens' => 'decimal:2',
        ];
    }

    /**
     * Retourne la liste des champs "publics" (sans données sensibles).
     * Utilisé dans AuthController lors de la connexion pour construire
     * la réponse JSON envoyée au frontend.
     */
    public static function publicFields(): array
    {
        return [
            'id_ens', 'user_log_adm', 'user_log_sp',
            'id_grade', 'id_statut', 'id_depart',
            'user_log_ens', 'nom_ens', 'pren_ens',
            'email_ens', 'tel_ens', 'taux_hor_ens',
        ];
    }

    /**
     * Calcule le taux horaire effectif de l'enseignant.
     *
     * La logique est :
     * 1. Chercher le grade de l'enseignant
     * 2. Vérifier si son statut est "vacataire"
     * 3. Retourner le taux vacataire ou permanent selon le cas
     * 4. Si le grade est introuvable → utiliser le taux personnalisé (taux_hor_ens)
     *
     * Ce taux est utilisé pour calculer le montant estimé des heures complémentaires.
     */
    public function tauxEffectif(): float
    {
        $grade = Grade::find($this->id_grade);

        // Si le grade n'existe plus en base, utiliser le taux personnalisé
        if (! $grade) {
            return (float) $this->taux_hor_ens;
        }

        // Vérifier si l'enseignant est vacataire en cherchant le mot "vacataire" dans le statut
        $statut = Statut::find($this->id_statut);
        $libStatut = $statut ? strtolower($statut->lib_statut) : '';
        $isVacataire = str_contains($libStatut, 'vacataire');

        // Retourner le bon taux selon le type de contrat
        return (float) ($isVacataire
            ? ($grade->taux_hor_vacataire ?? $this->taux_hor_ens) // Taux vacataire ou fallback
            : ($grade->taux_hor_permanent ?? $this->taux_hor_ens) // Taux permanent ou fallback
        );
    }
}
