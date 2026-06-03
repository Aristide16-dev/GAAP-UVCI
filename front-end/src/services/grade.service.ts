/**
 * grade.service.ts — Service de gestion des grades
 *
 * Un "grade" représente le niveau hiérarchique d'un enseignant
 * (ex: Professeur Titulaire, Maître de Conférences, Assistant...).
 * Chaque grade définit le taux horaire applicable (permanent et vacataire)
 * ainsi que le quota annuel d'heures complémentaires autorisées.
 *
 * Utilisé par l'administrateur dans la page GestionTaux.
 */
import api from "../api/axios";

/**
 * Grade — Barème horaire associé à un niveau de grade académique.
 */
export interface Grade {
  id_grade:           number;       // Identifiant unique
  lib_grade:          string;       // Libellé (ex: "Maître de Conférences")
  taux_hor_permanent: number | null; // Taux/heure pour les permanents
  taux_hor_vacataire: number | null; // Taux/heure pour les vacataires
  quota_max?:         number | null; // Quota annuel d'heures complémentaires
}

export const gradeService = {
  /** Récupère tous les grades avec leurs barèmes — utilisé dans les formulaires */
  getAll: async (): Promise<Grade[]> => {
    const response = await api.get("/grades");
    return response.data.data;
  },

  /**
   * Met à jour les taux horaires et quota d'un grade.
   * Un historique de modification est automatiquement créé côté serveur.
   */
  update: async (idGrade: number, data: Partial<Grade>): Promise<Grade> => {
    const response = await api.put(`/grades/${idGrade}`, data);
    return response.data.data;
  },

  /** Récupère l'historique de toutes les modifications des barèmes */
  getHistory: async (): Promise<unknown[]> => {
    const response = await api.get("/grades/history");
    return response.data.data;
  },
};
