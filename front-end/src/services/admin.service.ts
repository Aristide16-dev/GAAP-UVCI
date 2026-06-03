/**
 * admin.service.ts — Service principal de l'administrateur
 *
 * Ce fichier centralise TOUS les appels API utilisés par l'interface administrateur.
 * Il regroupe des fonctions organisées par domaine métier :
 *
 * DOMAINES COUVERTS :
 * 1. Comptes utilisateurs (admin, secrétaire, enseignant)
 * 2. Grades et barèmes horaires (avec historique)
 * 3. Années académiques (activation/désactivation)
 * 4. Niveaux de complexité (avec historique)
 * 5. Référentiels : départements, statuts, niveaux d'études,
 *    types de ressources, types d'activités
 * 6. Dashboard statistiques
 * 7. Profil utilisateur
 *
 * Ce service est aussi utilisé en partie par la secrétaire
 * pour les fonctions qu'elle partage avec l'admin.
 */
import api from "../api/axios";

// ─── Interfaces (formes des données) ─────────────────────────────────────────

/** Compte utilisateur unifié (normalisé depuis les 3 tables) */
export interface User {
  id:            string | number;
  nom:           string;
  email:         string;
  role:          string;          // "administrateur" | "secretaire" | "enseignant"
  status:        string;          // "ACTIF" | "INACTIF"
  login?:        string;
  last_login_at?: string;
}

/** Grade académique avec barème horaire */
export interface Grade {
  id_grade:           number;
  lib_grade:          string;
  taux_hor_permanent: number;     // Taux pour les permanents (en FCFA ou €/h)
  taux_hor_vacataire: number;     // Taux pour les vacataires
  quota_annuel?:      number;     // Quota annuel d'heures complémentaires
}

/** Statut de contrat d'un enseignant */
export interface Statut {
  id_statut:  number;
  lib_statut: string;             // Ex: "Permanent", "Vacataire"
}

/** Département universitaire */
export interface Departement {
  id_depart:  number;
  lib_depart: string;             // Ex: "Informatique", "Gestion"
}

/** Entrée d'historique (pour grades et niveaux de complexité) */
export interface HistoryEntry {
  id:     number;
  user:   string;   // Nom de l'utilisateur qui a fait la modification
  action: string;   // Description de l'action
  date:   string;   // Date de la modification
  time:   string;   // Heure de la modification
}

/** Année académique avec ses semestres */
export interface AcademicYear {
  id?:                  number;
  year_label:           string;  // Ex: "2025-2026"
  odd_semester_start?:  string;  // Début du 1er semestre
  odd_semester_end?:    string;  // Fin du 1er semestre
  even_semester_start?: string;  // Début du 2ème semestre
  even_semester_end?:   string;  // Fin du 2ème semestre
  is_active?:           boolean; // true = année en cours
}

/** Niveau de complexité pour le calcul du volume horaire */
export interface NiveauComplexite {
  id_niv_complex:    number;
  lib_niv_complex:   string;  // Ex: "N1 - Simple", "N2 - Moyen", "N3 - Complexe"
  coeff_niv_complex: number;  // Ex: 0.40, 0.75, 1.50
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const adminService = {

  // ── Gestion des comptes utilisateurs ─────────────────────────────────────

  /** Récupère la liste unifiée de tous les comptes (admin + secrétaires + enseignants) */
  async getUsers() {
    const response = await api.get<{ success: boolean; data: User[] }>("/admin/users");
    return response.data;
  },

  /**
   * Crée un nouveau compte utilisateur.
   * Pour les enseignants, id_grade, id_statut et id_depart sont requis.
   */
  async createUser(data: Omit<User, "id"> & {
    password: string;
    id_grade?:  number;
    id_statut?: number;
    id_depart?: number;
  }) {
    const response = await api.post("/admin/users", data);
    return response.data;
  },

  /** Modifie un compte (nom, email, mot de passe) */
  async updateUser(id: string | number, data: Partial<User> & { password?: string }) {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  /** Active ou désactive un compte (status: "ACTIF" | "INACTIF") */
  async toggleUserStatus(id: string | number, status: string) {
    const response = await api.patch(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  /** Supprime définitivement un compte (retourne 409 si données liées) */
  async deleteUser(id: string | number) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // ── Gestion des grades (barèmes horaires) ────────────────────────────────

  /** Récupère tous les grades avec leurs taux horaires */
  async getGrades() {
    const response = await api.get<{ data: Grade[] }>("/grades");
    return response.data;
  },

  /**
   * Met à jour les taux et quota d'un grade.
   * Une entrée d'historique est automatiquement créée (dans une transaction DB).
   */
  async updateGrade(idGrade: number, data: Partial<Grade>) {
    const response = await api.put(`/grades/${idGrade}`, data);
    return response.data;
  },

  /** Récupère l'historique des modifications des barèmes */
  async getGradesHistory() {
    const response = await api.get<{ success: boolean; data: HistoryEntry[] }>("/grades/history");
    return response.data;
  },

  /** Supprime une entrée spécifique de l'historique des grades */
  async deleteGradeHistory(id: number) {
    const response = await api.delete(`/grades/history/${id}`);
    return response.data;
  },

  /** Vide tout l'historique des modifications de grades */
  async clearGradesHistory() {
    const response = await api.delete("/grades/history");
    return response.data;
  },

  // ── Référentiels simples ──────────────────────────────────────────────────

  /** Récupère les statuts d'enseignants (Permanent, Vacataire...) */
  async getStatuts() {
    const response = await api.get<{ data: Statut[] }>("/statuts");
    return response.data;
  },

  /** Récupère les départements de l'université */
  async getDepartements() {
    const response = await api.get<{ data: Departement[] }>("/departements");
    return response.data;
  },

  // ── Gestion des années académiques ───────────────────────────────────────

  /** Récupère toutes les années académiques avec l'année active */
  async getAcademicYears() {
    const response = await api.get<{
      success: boolean;
      data: {
        active_year: string | null;
        years: Array<{
          id:                   number;
          year_label:           string;
          odd_semester_start:   string | null;
          odd_semester_end:     string | null;
          even_semester_start:  string | null;
          even_semester_end:    string | null;
          is_active:            boolean;
        }>;
      };
    }>("/academic-years");
    return response.data;
  },

  /** Crée une nouvelle année académique avec ses semestres */
  async createAcademicYear(data: {
    year_label:           string;
    odd_semester_start:   string;
    odd_semester_end:     string;
    even_semester_start:  string;
    even_semester_end:    string;
    is_active?:           boolean;
  }) {
    const response = await api.post("/academic-years", data);
    return response.data;
  },

  /** Modifie une année académique existante */
  async updateAcademicYear(id: number, data: Partial<AcademicYear>) {
    const response = await api.put(`/academic-years/${id}`, data);
    return response.data;
  },

  /** Active une année académique (désactive automatiquement l'ancienne) */
  async activateAcademicYear(id: number) {
    const response = await api.patch(`/academic-years/${id}/activate`);
    return response.data;
  },

  /** Désactive une année académique (sans en activer une autre) */
  async deactivateAcademicYear(id: number) {
    const response = await api.patch(`/academic-years/${id}/deactivate`);
    return response.data;
  },

  /** Supprime une année académique */
  async deleteAcademicYear(id: number) {
    const response = await api.delete(`/academic-years/${id}`);
    return response.data;
  },

  // ── Niveaux de complexité ────────────────────────────────────────────────

  /** Récupère les niveaux de complexité (N1, N2, N3) et leurs coefficients */
  async getNiveauxComplexite() {
    const response = await api.get<{ data: NiveauComplexite[] }>("/niveaux-complexite");
    return response.data;
  },

  /** Met à jour le coefficient d'un niveau de complexité (avec historique) */
  async updateNiveauComplexite(idNivComplex: number, data: Partial<NiveauComplexite>) {
    const response = await api.put(`/niveaux-complexite/${idNivComplex}`, data);
    return response.data;
  },

  /** Récupère l'historique des modifications des niveaux de complexité */
  async getNiveauxComplexiteHistory() {
    const response = await api.get<{
      success: boolean;
      data: Array<{ id: number; date: string; title: string; user: string; type: string }>;
    }>("/niveaux-complexite/history");
    return response.data;
  },

  /** Supprime une entrée de l'historique des niveaux de complexité */
  async deleteNiveauxComplexiteHistory(id: number) {
    const response = await api.delete(`/niveaux-complexite-history/${id}`);
    return response.data;
  },

  /** Vide tout l'historique des niveaux de complexité */
  async clearNiveauxComplexiteHistory() {
    const response = await api.delete("/niveaux-complexite-history/clear");
    return response.data;
  },

  // ── Référentiels CRUD complets ────────────────────────────────────────────

  /** CRUD Départements */
  async createDepartement(data: { lib_depart: string }) {
    const response = await api.post("/departements", data);
    return response.data;
  },
  async updateDepartement(id: number, data: { lib_depart: string }) {
    const response = await api.put(`/departements/${id}`, data);
    return response.data;
  },
  async deleteDepartement(id: number) {
    const response = await api.delete(`/departements/${id}`);
    return response.data;
  },

  /** CRUD Statuts d'enseignants */
  async createStatut(data: { lib_statut: string }) {
    const response = await api.post("/statuts", data);
    return response.data;
  },
  async updateStatut(id: number, data: { lib_statut: string }) {
    const response = await api.put(`/statuts/${id}`, data);
    return response.data;
  },
  async deleteStatut(id: number) {
    const response = await api.delete(`/statuts/${id}`);
    return response.data;
  },

  /** CRUD Niveaux d'études (L1, L2, M1...) */
  async getNiveaux() {
    const response = await api.get<{ data: Array<{ id_niveau: number; lib_niveau: string }> }>("/niveaux");
    return response.data;
  },
  async createNiveau(data: { lib_niveau: string }) {
    const response = await api.post("/niveaux", data);
    return response.data;
  },
  async updateNiveau(id: number, data: { lib_niveau: string }) {
    const response = await api.put(`/niveaux/${id}`, data);
    return response.data;
  },
  async deleteNiveau(id: number) {
    const response = await api.delete(`/niveaux/${id}`);
    return response.data;
  },

  /** CRUD Types de ressources pédagogiques */
  async getTypesRessources() {
    const response = await api.get<{ data: Array<{ id_typ_res: number; typ_res: string }> }>("/types-ressources");
    return response.data;
  },
  async createTypeRessource(data: { typ_res: string; id_niv_complex?: number | null }) {
    const response = await api.post("/types-ressources", data);
    return response.data;
  },
  async updateTypeRessource(id: number, data: { typ_res: string; id_niv_complex?: number | null }) {
    const response = await api.put(`/types-ressources/${id}`, data);
    return response.data;
  },
  async deleteTypeRessource(id: number) {
    const response = await api.delete(`/types-ressources/${id}`);
    return response.data;
  },

  /** CRUD Types d'activités pédagogiques (CM, TD, TP...) */
  async getTypesActivites() {
    const response = await api.get<{ data: Array<{ id_typ_activite: number; lib_activite: string; multiplicateur_base?: number }> }>("/types-activites");
    return response.data;
  },
  async createTypeActivite(data: { lib_activite: string; multiplicateur_base?: number }) {
    const response = await api.post("/types-activites", data);
    return response.data;
  },
  async updateTypeActivite(id: number, data: { lib_activite: string; multiplicateur_base?: number }) {
    const response = await api.put(`/types-activites/${id}`, data);
    return response.data;
  },
  async deleteTypeActivite(id: number) {
    const response = await api.delete(`/types-activites/${id}`);
    return response.data;
  },

  /** CRUD Grades complet (création et suppression — modification via updateGrade) */
  async createGrade(data: { lib_grade: string; taux_hor_permanent?: number; taux_hor_vacataire?: number }) {
    const response = await api.post("/grades", data);
    return response.data;
  },
  async deleteGrade(id: number) {
    const response = await api.delete(`/grades/${id}`);
    return response.data;
  },

  // ── Dashboard et profil ───────────────────────────────────────────────────

  /** Récupère les statistiques du tableau de bord secrétaire/admin */
  async getDashboard() {
    const response = await api.get("/dashboard");
    return response.data;
  },

  /** Met à jour le profil de l'utilisateur connecté (nom, email, mot de passe) */
  async updateProfile(data: { nom?: string; email?: string; password?: string }) {
    const response = await api.put("/profile", data);
    return response.data;
  },
};
