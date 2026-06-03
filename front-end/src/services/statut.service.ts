/**
 * statut.service.ts — Service de gestion des statuts d'enseignants
 *
 * Un "statut" définit le type de contrat d'un enseignant :
 * Permanent (fonctionnaire), Vacataire (intervenants extérieurs), etc.
 * Le statut influence le taux horaire applicable (permanent vs vacataire).
 *
 * Utilisé dans la page GestionReferentiels et dans les formulaires enseignant.
 */
import api from "../api/axios";

/**
 * Statut — Type de contrat d'un enseignant.
 */
export interface Statut {
  id_statut:   number;  // Identifiant unique
  lib_statut:  string;  // Libellé (ex: "Permanent", "Vacataire")
  desc_statut?: string; // Description optionnelle
}

export const statutService = {
  /** Récupère tous les statuts — pour les listes déroulantes */
  getAll: async (): Promise<Statut[]> => {
    const response = await api.get("/statuts");
    return response.data.data;
  },

  /** Récupère un statut par son identifiant */
  getById: async (id: number): Promise<Statut> => {
    const response = await api.get(`/statuts/${id}`);
    return response.data.data;
  },

  /** Crée un nouveau statut d'enseignant */
  create: async (data: Omit<Statut, "id_statut">): Promise<Statut> => {
    const response = await api.post("/statuts", data);
    return response.data.data;
  },

  /** Modifie un statut existant */
  update: async (id: number, data: Partial<Omit<Statut, "id_statut">>): Promise<Statut> => {
    const response = await api.put(`/statuts/${id}`, data);
    return response.data.data;
  },

  /** Supprime un statut (seulement s'il n'est plus utilisé) */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/statuts/${id}`);
  },
};
