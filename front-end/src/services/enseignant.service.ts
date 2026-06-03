/**
 * enseignant.service.ts — Service de gestion des enseignants
 *
 * Ce fichier regroupe toutes les fonctions qui permettent de communiquer
 * avec l'API pour gérer les enseignants de l'UVCI.
 *
 * Utilisé principalement par la secrétaire dans la page EnseignantsList.
 * L'administrateur peut aussi créer des enseignants via AdminDashboard
 * (en passant par adminService).
 *
 * OPÉRATIONS DISPONIBLES :
 * - Lister tous les enseignants
 * - Récupérer un enseignant par son identifiant
 * - Créer un nouvel enseignant
 * - Modifier les informations d'un enseignant
 * - Supprimer un enseignant
 * - Rechercher des enseignants par nom/prénom/email
 */
import api from "../api/axios";

/**
 * Enseignant — Structure complète d'un enseignant telle que renvoyée par l'API.
 */
export interface Enseignant {
  id_ens:       number;  // Identifiant unique
  user_log_ens: string;  // Login de connexion
  nom_ens:      string;  // Nom de famille
  pren_ens:     string;  // Prénom
  email_ens:    string;  // Email professionnel
  tel_ens:      string;  // Téléphone
  id_grade:     number;  // Référence vers le grade (barème horaire)
  id_statut:    number;  // Référence vers le statut (Permanent / Vacataire)
  id_depart:    number;  // Référence vers le département
  taux_hor_ens: number;  // Taux horaire personnalisé (si différent du grade)
  status:       string;  // "ACTIF" ou "INACTIF"
}

/**
 * CreateEnseignantData — Données nécessaires pour créer un nouvel enseignant.
 * Le login et mot de passe sont optionnels (générés automatiquement si absents).
 */
export interface CreateEnseignantData {
  nom_ens:      string;
  pren_ens:     string;
  email_ens:    string;
  tel_ens:      string;
  id_grade:     number;
  id_statut:    number;
  id_depart:    number;
  taux_hor_ens: number;
  user_log_ens?:  string; // Login optionnel
  user_pasw_ens?: string; // Mot de passe optionnel
}

export const enseignantService = {
  /**
   * Récupère la liste complète de tous les enseignants.
   * Utilisé pour afficher le tableau dans EnseignantsList.
   */
  getAll: async (): Promise<Enseignant[]> => {
    const response = await api.get("/enseignants");
    return response.data.data;
  },

  /**
   * Récupère les données d'un seul enseignant par son identifiant.
   * @param id - L'identifiant unique (id_ens) de l'enseignant
   */
  getById: async (id: number): Promise<Enseignant> => {
    const response = await api.get(`/enseignants/${id}`);
    return response.data.data;
  },

  /**
   * Crée un nouvel enseignant dans la base de données.
   * @param data - Les informations du nouvel enseignant
   */
  create: async (data: CreateEnseignantData): Promise<Enseignant> => {
    const response = await api.post("/enseignants", data);
    return response.data.data;
  },

  /**
   * Met à jour les informations d'un enseignant existant.
   * Seuls les champs fournis dans `data` seront modifiés.
   * @param id   - L'identifiant de l'enseignant à modifier
   * @param data - Les champs à mettre à jour
   */
  update: async (id: number, data: Partial<CreateEnseignantData>): Promise<Enseignant> => {
    const response = await api.put(`/enseignants/${id}`, data);
    return response.data.data;
  },

  /**
   * Supprime définitivement un enseignant.
   * @param id - L'identifiant de l'enseignant à supprimer
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/enseignants/${id}`);
  },

  /**
   * Recherche des enseignants par nom, prénom ou email.
   * @param query - Le terme de recherche (minimum 2 caractères recommandé)
   */
  search: async (query: string): Promise<Enseignant[]> => {
    const response = await api.get("/enseignants", { params: { search: query } });
    return response.data.data;
  },
};
