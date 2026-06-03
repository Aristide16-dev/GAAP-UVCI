/**
 * dashboard.service.ts — Service du tableau de bord secrétaire
 *
 * Ce fichier fournit les fonctions pour récupérer les statistiques
 * affichées sur le tableau de bord de la secrétaire.
 *
 * Les statistiques incluent :
 * - Volume horaire global de l'année académique en cours
 * - Nombre d'enseignants actifs
 * - Nombre d'enseignants ayant dépassé leur quota annuel
 * - Production mensuelle (graphique d'évolution)
 * - Heures par département
 * - Liste des enseignants en dépassement
 */
import api from "../api/axios";

/**
 * DashboardStats — Toutes les statistiques renvoyées par l'API pour le tableau de bord.
 */
export interface DashboardStats {
  /** Total des heures complémentaires calculées pour l'année en cours */
  volumeHoraireGlobal: number;
  /** Nombre d'enseignants avec un compte ACTIF */
  enseignantsActifs: number;
  /** Nombre d'enseignants ayant dépassé leur quota annuel */
  depassementsCritiques: number;
  /** Libellé de l'année académique active (ex: "2025-2026") */
  anneeAcademique: string;
  /** Évolution de la production heure par heure selon la période choisie */
  productionMensuelle: {
    mois:  string; // Format "YYYY-MM" (mensuel) ou "YYYY" (annuel)
    total: number; // Total des heures pour cette période
  }[];
  /** Heures complémentaires regroupées par département */
  heuresParDepartement: {
    name:  string; // Nom du département
    desc:  string; // Description (vide dans cette version)
    hours: number; // Total heures du département
  }[];
  /** Enseignants dont le volume horaire dépasse le quota de leur grade */
  enseignantsDepassement: {
    id_ens:      number;
    nom:         string;
    prenom:      string;
    departement: string;
    quota:       number; // Quota autorisé par le grade
    done:        number; // Heures effectuées
    exceed:      number; // Heures en dépassement (done - quota)
  }[];
}

export const dashboardService = {
  /**
   * Récupère toutes les statistiques du tableau de bord.
   * @param period - Période des graphiques : "monthly" (6 derniers mois, défaut)
   *                 ou "annual" (5 dernières années)
   */
  getStats: async (period?: string): Promise<DashboardStats> => {
    const response = await api.get("/dashboard", { params: { period } });
    return response.data.data;
  },
};
