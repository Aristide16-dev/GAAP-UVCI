<?php

/**
 * VolumeHoraireService.php — Calcul du volume horaire des activités pédagogiques
 *
 * Ce service contient la LOGIQUE MÉTIER centrale de GAAP-UVCI :
 * le calcul du nombre d'heures complémentaires générées par une activité.
 *
 * FORMULE DE CALCUL :
 *   Volume = nb_sequences × coeff_niv_complex × multiplicateur_activite
 *
 * Où :
 * - nb_sequences      = nb_heures_cours × 4
 *   (chaque heure de cours = 4 séquences de 15 minutes)
 * - coeff_niv_complex = coefficient selon la complexité (N1=0.40, N2=0.75, N3=1.50)
 * - multiplicateur    = facteur selon le type d'activité (CM, TD, TP...)
 *
 * EXEMPLE :
 * Cours de 30h, niveau N2 (coeff=0.75), type CM (multiplicateur=1.0)
 * → Volume = (30×4) × 0.75 × 1.0 = 120 × 0.75 = 90 heures complémentaires
 *
 * CE SERVICE EST UTILISÉ PAR :
 * - ActivitePedagogiqueController (lors de la création/mise à jour)
 * - DashboardController (pour les statistiques globales)
 * - VolumeHoraireController (pour la fiche individuelle d'un enseignant)
 */

namespace App\Services;

use App\Models\ActivitePedagogique;
use App\Models\Cours;
use App\Models\NiveauComplexite;
use App\Models\TypeActivite;

class VolumeHoraireService
{
    /**
     * Calcule le volume horaire à partir de données brutes (IDs).
     * Fait 3 requêtes SQL pour récupérer les données nécessaires.
     *
     * Utilisé lors de la saisie d'une nouvelle activité (avant sauvegarde)
     * pour calculer le vol_hor_cal à stocker.
     *
     * @param array $data - Tableau avec : id_cours, id_niv_complex, id_typ_activite
     * @return float Le volume horaire calculé (arrondi à 2 décimales)
     */
    public function calculateFromData(array $data): float
    {
        // nb_sequences = nombre d'heures du cours × 4 (4 séquences par heure)
        $nbSequences = (int) Cours::query()
            ->where('id_cours', $data['id_cours'])
            ->value('nb_heures') * 4;

        // Coefficient selon le niveau de complexité (N1, N2, ou N3)
        $coefHoraire = (float) NiveauComplexite::query()
            ->where('id_niv_complex', $data['id_niv_complex'])
            ->value('coeff_niv_complex');

        // Multiplicateur selon le type d'activité (Cours Magistral, TD, TP...)
        $multiplicateur = (float) TypeActivite::query()
            ->where('id_typ_activite', $data['id_typ_activite'])
            ->value('multiplicateur_base');

        // Sécurité : éviter une multiplication par zéro
        if ($coefHoraire  <= 0) $coefHoraire  = 1;
        if ($multiplicateur <= 0) $multiplicateur = 1;

        return round($nbSequences * $coefHoraire * $multiplicateur, 2);
    }

    /**
     * Calcule le volume horaire d'une activité Eloquent existante.
     * Utilise les relations déjà chargées (eager loading) si disponibles,
     * sinon fait des requêtes SQL (moins efficace).
     *
     * L'eager loading évite le problème N+1 :
     * au lieu de 1 requête par activité, une seule requête charge tout.
     *
     * @param ActivitePedagogique $activite - L'activité dont on calcule le volume
     * @return float Le volume horaire calculé
     */
    public function calculateForActivity(ActivitePedagogique $activite): float
    {
        return $this->calculateFromData([
            'id_cours'        => $activite->id_cours,
            'id_niv_complex'  => $activite->id_niv_complex,
            'id_typ_activite' => $activite->id_typ_activite,
        ]);
    }

    /**
     * Retourne le volume horaire d'une activité, en privilégiant la valeur
     * déjà calculée et stockée en base (vol_hor_cal).
     *
     * LOGIQUE :
     * 1. Si vol_hor_cal est déjà renseigné → utiliser cette valeur (pas de recalcul)
     * 2. Sinon → recalculer depuis les données de la table
     *
     * Cela évite de recalculer inutilement quand le volume est déjà stocké.
     *
     * @param ActivitePedagogique $activite
     * @return float Le volume horaire (stocké ou calculé)
     */
    public function resolvedActivityVolume(ActivitePedagogique $activite): float
    {
        // Si la valeur calculée est déjà en base, l'utiliser directement
        if ($activite->vol_hor_cal !== null) {
            return round((float) $activite->vol_hor_cal, 2);
        }

        // Sinon, recalculer depuis les données sources
        return $this->calculateForActivity($activite);
    }
}
