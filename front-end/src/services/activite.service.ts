/**
 * activite.service.ts — Service de gestion des activités pédagogiques
 *
 * Une "activité pédagogique" représente une intervention d'un enseignant :
 * cours magistral, TD, TP, encadrement de stage, jury, etc.
 * C'est le CŒUR du système : chaque activité saisie génère un volume
 * horaire calculé qui s'accumule et peut dépasser le quota du grade.
 *
 * Utilisé dans la page SaisieValidation (secrétaire) et dans les pages
 * de suivi de l'enseignant.
 */
import api from "../api/axios";

/**
 * ActivitePedagogique — Une intervention enregistrée d'un enseignant.
 * Les champs `enseignant`, `cours`, `niveau_complexite` et `type_activite`
 * sont des données jointes optionnelles (relations Laravel eager-loaded).
 */
export interface ActivitePedagogique {
  id_activite:     number;  // Identifiant unique
  id_ens:          number;  // Enseignant concerné
  id_cours:        number;  // Cours dans lequel l'activité a eu lieu
  id_niv_complex:  number;  // Niveau de complexité (coefficient de calcul)
  id_typ_activite: number;  // Type d'activité (CM, TD, TP, etc.)
  id_param:        number;  // Paramètre académique de l'année en cours
  id_res:          number;  // Ressource pédagogique utilisée
  vol_hor_cal:     number;  // Volume horaire calculé automatiquement
  date_saisie:     string;  // Date de la saisie
  statut?:         string;  // Statut de validation ("validé", "en attente"...)

  // Données jointes par le serveur (disponibles si eager-loaded)
  enseignant?: { nom_ens: string; pren_ens: string; };
  cours?: { lib_cours: string; nb_sequences: number; };
  niveau_complexite?: { lib_niv_complex: string; coeff_niv_complex: number; };
  type_activite?: { lib_typ_activite: string; multiplicateur_base: number; };
}

/**
 * CreateActiviteData — Données envoyées lors de la création d'une activité.
 */
export interface CreateActiviteData {
  id_ens:          number;
  id_cours:        number;
  id_niv_complex:  number;
  id_typ_activite: number;
  id_param:        number;
  id_res:          number | null;
  vol_hor_cal:     number; // Calculé côté client avant envoi
}

export const activiteService = {
  /** Récupère toutes les activités pédagogiques (filtrables par l'API) */
  getAll: async (): Promise<ActivitePedagogique[]> => {
    const response = await api.get("/activites-pedagogiques");
    return response.data.data;
  },

  /**
   * Enregistre une nouvelle activité pédagogique.
   * Le volume horaire (vol_hor_cal) est calculé côté client avant envoi.
   */
  create: async (data: CreateActiviteData): Promise<ActivitePedagogique> => {
    const response = await api.post("/activites-pedagogiques", data);
    return response.data.data;
  },

  /**
   * Met à jour une activité (modification ou changement de statut).
   * @param id   - Identifiant de l'activité
   * @param data - Champs à modifier (peut inclure `statut` pour valider)
   */
  update: async (
    id: number,
    data: Partial<CreateActiviteData & { statut: string }>,
  ): Promise<ActivitePedagogique> => {
    const response = await api.put(`/activites-pedagogiques/${id}`, data);
    return response.data.data;
  },

  /** Supprime définitivement une activité pédagogique */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/activites-pedagogiques/${id}`);
  },
};
