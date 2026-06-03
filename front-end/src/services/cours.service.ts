/**
 * cours.service.ts — Service de gestion des cours
 *
 * Un "cours" dans GAAP-UVCI représente une matière enseignée
 * (ex: Algorithmes, Base de données, Réseaux...).
 * Chaque cours a un nombre d'heures et appartient à un niveau d'études.
 *
 * Utilisé par la secrétaire dans la page GestionCours.
 * Les cours sont aussi référencés lors de la saisie des activités pédagogiques.
 */
import api from "../api/axios";

/**
 * Cours — Représentation d'une matière enseignée.
 */
export interface Cours {
  id_cours:     number;        // Identifiant unique
  int_cours:    string;        // Intitulé/nom du cours
  filiere:      string;        // Filière concernée (ex: "Informatique")
  id_niveau:    number;        // Niveau d'études associé (L1, L2, M1...)
  semestre:     string;        // Semestre (S1, S2, S3...)
  nb_credits:   number;        // Nombre de crédits ECTS
  nb_heures:    number;        // Volume horaire total prévu
  nb_sequences?: number;       // Nombre de séquences (calculé : nb_heures × 4)
  id_typ_res?:  number | null; // Type de ressource par défaut pour ce cours
}

/**
 * CreateCoursData — Données nécessaires pour créer ou modifier un cours.
 */
export interface CreateCoursData {
  int_cours:  string;
  filiere:    string;
  id_niveau:  number;
  semestre:   string;
  nb_credits: number;
  nb_heures:  number;
  id_typ_res?: number | null;
}

export const coursService = {
  /** Récupère tous les cours — utilisé pour les listes déroulantes de saisie */
  getAll: async (): Promise<Cours[]> => {
    const response = await api.get("/cours");
    return response.data.data;
  },

  /** Récupère un cours spécifique par son identifiant */
  getById: async (id: number): Promise<Cours> => {
    const response = await api.get(`/cours/${id}`);
    return response.data.data;
  },

  /** Crée un nouveau cours */
  create: async (data: CreateCoursData): Promise<Cours> => {
    const response = await api.post("/cours", data);
    return response.data.data;
  },

  /** Modifie un cours existant (seuls les champs fournis sont mis à jour) */
  update: async (id: number, data: Partial<CreateCoursData>): Promise<Cours> => {
    const response = await api.put(`/cours/${id}`, data);
    return response.data.data;
  },

  /** Supprime définitivement un cours */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/cours/${id}`);
  },
};
