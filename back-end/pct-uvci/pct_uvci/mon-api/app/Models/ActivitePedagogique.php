<?php

/**
 * ActivitePedagogique.php — Modèle Eloquent pour les activités pédagogiques
 *
 * Une activité pédagogique représente UNE intervention d'un enseignant :
 * cours magistral, travaux dirigés, travaux pratiques, encadrement de stage,
 * participation à un jury, etc.
 *
 * C'est la table CENTRALE du système GAAP-UVCI.
 * Chaque enregistrement génère automatiquement un volume horaire (vol_hor_cal)
 * calculé selon la formule :
 *   vol_hor_cal = nb_sequences × coeff_niv_complex × multiplicateur_activite
 *
 * RELATIONS (relations Eloquent définis dans ce modèle) :
 * - cours()          → le cours dans lequel l'activité a eu lieu
 * - niveauComplexite() → le niveau de complexité (coefficient de calcul)
 * - typeActivite()   → le type d'activité (CM, TD, TP...)
 *
 * Ces relations sont utilisées par DashboardController avec eager loading
 * (->with([...])) pour éviter les requêtes N+1.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivitePedagogique extends Model
{
    protected $table = 'activite_pedagogique';

    protected $primaryKey = 'id_activite';

    public $timestamps = false;

    /** Champs autorisés à être modifiés via Eloquent create() et update() */
    protected $fillable = [
        'id_ens',          // Enseignant qui a effectué l'activité
        'user_log_sp',     // Secrétaire qui a saisi l'activité
        'id_res',          // Ressource pédagogique associée
        'id_cours',        // Cours dans lequel l'activité s'est déroulée
        'id_param',        // Paramètre académique de l'année
        'id_niv_complex',  // Niveau de complexité (ex: N1=0.4, N2=0.75, N3=1.5)
        'id_typ_activite', // Type : Cours Magistral, TD, TP, Encadrement...
        'date_saisie',     // Date de l'intervention
        'vol_hor_cal',     // Volume horaire calculé (en heures complémentaires)
        'statut',          // Statut de validation
    ];

    /** Conversions automatiques des types pour éviter les erreurs de comparaison */
    protected function casts(): array
    {
        return [
            'id_activite' => 'integer',
            'id_ens' => 'integer',
            'id_res' => 'integer',
            'id_cours' => 'integer',
            'id_param' => 'integer',
            'id_niv_complex' => 'integer',
            'id_typ_activite' => 'integer',
            'date_saisie' => 'date',     // Convertit en objet Carbon
            'vol_hor_cal' => 'decimal:2',
            'statut' => 'string',
        ];
    }

    /**
     * Relation vers le cours associé.
     * belongsTo = "cette activité APPARTIENT À un cours"
     * Utilisé pour l'eager loading dans DashboardController : ->with('cours')
     */
    public function cours()
    {
        return $this->belongsTo(Cours::class, 'id_cours', 'id_cours');
    }

    /**
     * Relation vers le niveau de complexité.
     * Le niveau de complexité définit le coefficient multiplicateur du calcul.
     */
    public function niveauComplexite()
    {
        return $this->belongsTo(NiveauComplexite::class, 'id_niv_complex', 'id_niv_complex');
    }

    /**
     * Relation vers le type d'activité (CM, TD, TP, etc.).
     * Chaque type a un multiplicateur_base qui influence le volume horaire.
     */
    public function typeActivite()
    {
        return $this->belongsTo(TypeActivite::class, 'id_typ_activite', 'id_typ_activite');
    }
}
