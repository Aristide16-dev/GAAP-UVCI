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

type NiveauApi = Partial<Niveau> & {
  id?: number | string;
  id_niv?: number | string;
  niveau_id?: number | string;
  lib?: string;
  lib_niv?: string;
  nom?: string;
};

const normalizeNiveau = (niveau: NiveauApi): Niveau => ({
  id_niveau: Number(niveau.id_niveau ?? niveau.id_niv ?? niveau.niveau_id ?? niveau.id ?? 0),
  lib_niveau: String(niveau.lib_niveau ?? niveau.lib_niv ?? niveau.lib ?? niveau.nom ?? ""),
});

const getNiveauxPayload = (responseData: unknown): NiveauApi[] => {
  if (Array.isArray(responseData)) return responseData;
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData &&
    Array.isArray((responseData as { data?: unknown }).data)
  ) {
    return (responseData as { data: NiveauApi[] }).data;
  }
  return [];
};

export const niveauService = {
  /** Récupère tous les niveaux — pour les listes déroulantes */
  getAll: async (): Promise<Niveau[]> => {
    const response = await api.get("/niveaux");
    return getNiveauxPayload(response.data).map(normalizeNiveau);
  },

  /** Récupère un niveau par son identifiant */
  getById: async (id: number): Promise<Niveau> => {
    const response = await api.get(`/niveaux/${id}`);
    return normalizeNiveau(response.data.data ?? {});
  },

  /** Crée un nouveau niveau d'études (Omit exclut l'id car il est généré par le serveur) */
  create: async (data: Omit<Niveau, "id_niveau">): Promise<Niveau> => {
    const response = await api.post("/niveaux", data);
    return normalizeNiveau(response.data.data ?? {});
  },

  /** Modifie le libellé d'un niveau existant */
  update: async (id: number, data: Partial<Omit<Niveau, "id_niveau">>): Promise<Niveau> => {
    const response = await api.put(`/niveaux/${id}`, data);
    return normalizeNiveau(response.data.data ?? {});
  },

  /** Supprime un niveau (possible seulement s'il n'est pas utilisé par des cours) */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/niveaux/${id}`);
  },
};
