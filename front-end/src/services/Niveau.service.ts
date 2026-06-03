/**
 * Niveau.service.ts — Service de gestion des niveaux d'études
 *
 * Un "niveau" représente un niveau académique (Licence 1, Licence 2,
 * Licence 3, Master 1, Master 2...). Les cours sont associés à un niveau.
 *
 * Utilisé dans la page GestionReferentiels et lors de la création de cours.
 */
import api from "../api/axios";

/**
 * Niveau — Un niveau d'études universitaires.
 */
export interface Niveau {
  id_niveau:  number; // Identifiant unique
  lib_niveau: string; // Libellé (ex: "Licence 2", "Master 1")
}

export const niveauService = {
  /** Récupère tous les niveaux — pour les listes déroulantes */
  getAll: async (): Promise<Niveau[]> => {
    const response = await api.get("/niveaux");
    return response.data.data;
  },

  /** Récupère un niveau par son identifiant */
  getById: async (id: number): Promise<Niveau> => {
    const response = await api.get(`/niveaux/${id}`);
    return response.data.data;
  },

  /** Crée un nouveau niveau d'études (Omit exclut l'id car il est généré par le serveur) */
  create: async (data: Omit<Niveau, "id_niveau">): Promise<Niveau> => {
    const response = await api.post("/niveaux", data);
    return response.data.data;
  },

  /** Modifie le libellé d'un niveau existant */
  update: async (id: number, data: Partial<Omit<Niveau, "id_niveau">>): Promise<Niveau> => {
    const response = await api.put(`/niveaux/${id}`, data);
    return response.data.data;
  },

  /** Supprime un niveau (possible seulement s'il n'est pas utilisé par des cours) */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/niveaux/${id}`);
  },
};
