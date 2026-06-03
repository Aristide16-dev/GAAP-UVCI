/**
 * departement.service.ts — Service de gestion des départements
 *
 * Un "département" est une unité organisationnelle de l'UVCI regroupant
 * plusieurs enseignants (ex: Département Informatique, Département Gestion...).
 * Les statistiques du tableau de bord sont ventilées par département.
 *
 * Utilisé dans la page GestionReferentiels et dans les formulaires enseignant.
 */
import api from "../api/axios";

/**
 * Departement — Unité d'organisation des enseignants.
 */
export interface Departement {
  id_depart:   number;  // Identifiant unique
  lib_depart:  string;  // Libellé (ex: "Informatique", "Gestion")
  desc_depart?: string; // Description optionnelle
}

export const departementService = {
  /** Récupère tous les départements — pour les listes déroulantes */
  getAll: async (): Promise<Departement[]> => {
    const response = await api.get("/departements");
    return response.data.data;
  },

  /** Récupère un département par son identifiant */
  getById: async (id: number): Promise<Departement> => {
    const response = await api.get(`/departements/${id}`);
    return response.data.data;
  },

  /** Crée un nouveau département */
  create: async (data: Omit<Departement, "id_depart">): Promise<Departement> => {
    const response = await api.post("/departements", data);
    return response.data.data;
  },

  /** Modifie un département existant */
  update: async (id: number, data: Partial<Omit<Departement, "id_depart">>): Promise<Departement> => {
    const response = await api.put(`/departements/${id}`, data);
    return response.data.data;
  },

  /** Supprime un département (seulement s'il n'a plus d'enseignants) */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/departements/${id}`);
  },
};
