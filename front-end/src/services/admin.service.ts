import api from "../api/axios";

export interface User {
  id: string | number;
  nom: string;
  email: string;
  role: string;
  status: string;
  login?: string;
  last_login_at?: string;
}

export interface Grade {
  id_grade: number;
  lib_grade: string;
  taux_hor_permanent: number;
  taux_hor_vacataire: number;
  quota_annuel?: number;
}

export interface Statut {
  id_statut: number;
  lib_statut: string;
}

export interface Departement {
  id_depart: number;
  lib_depart: string;
}

export interface HistoryEntry {
  id: number;
  user: string;
  action: string;
  date: string;
  time: string;
}

export interface AcademicYear {
  id?: number;
  year_label: string;
  odd_semester_start?: string;
  odd_semester_end?: string;
  even_semester_start?: string;
  even_semester_end?: string;
  is_active?: boolean;
}

export interface NiveauComplexite {
  id_niv_complex: number;
  lib_niv_complex: string;
  coeff_niv_complex: number;
}

export const adminService = {
  async getUsers() {
    const response = await api.get<{ success: boolean; data: User[] }>("/admin/users");
    return response.data;
  },

  async createUser(data: Omit<User, "id"> & { password: string; id_grade?: number; id_statut?: number; id_depart?: number }) {
    const response = await api.post("/admin/users", data);
    return response.data;
  },

  async updateUser(id: string | number, data: Partial<User> & { password?: string }) {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  async toggleUserStatus(id: string | number, status: string) {
    const response = await api.patch(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  async deleteUser(id: string | number) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  async getGrades() {
    const response = await api.get<{ data: Grade[] }>("/grades");
    return response.data;
  },

  async updateGrade(idGrade: number, data: Partial<Grade>) {
    const response = await api.put(`/grades/${idGrade}`, data);
    return response.data;
  },

  async getGradesHistory() {
    const response = await api.get<{ success: boolean; data: HistoryEntry[] }>("/grades/history");
    return response.data;
  },

  async deleteGradeHistory(id: number) {
    const response = await api.delete(`/grades/history/${id}`);
    return response.data;
  },

  async clearGradesHistory() {
    const response = await api.delete("/grades/history");
    return response.data;
  },

  async getStatuts() {
    const response = await api.get<{ data: Statut[] }>("/statuts");
    return response.data;
  },

  async getDepartements() {
    const response = await api.get<{ data: Departement[] }>("/departements");
    return response.data;
  },

  async getAcademicYears() {
    const response = await api.get<{
      success: boolean;
      data: {
        active_year: string | null;
        years: Array<{
          id: number;
          year_label: string;
          odd_semester_start: string | null;
          odd_semester_end: string | null;
          even_semester_start: string | null;
          even_semester_end: string | null;
          is_active: boolean;
        }>;
      };
    }>("/academic-years");
    return response.data;
  },

  async createAcademicYear(data: {
    year_label: string;
    odd_semester_start: string;
    odd_semester_end: string;
    even_semester_start: string;
    even_semester_end: string;
    is_active?: boolean;
  }) {
    const response = await api.post("/academic-years", data);
    return response.data;
  },

  async updateAcademicYear(id: number, data: Partial<AcademicYear>) {
    const response = await api.put(`/academic-years/${id}`, data);
    return response.data;
  },

  async activateAcademicYear(id: number) {
    const response = await api.patch(`/academic-years/${id}/activate`);
    return response.data;
  },

  async deactivateAcademicYear(id: number) {
    const response = await api.patch(`/academic-years/${id}/deactivate`);
    return response.data;
  },

  async deleteAcademicYear(id: number) {
    const response = await api.delete(`/academic-years/${id}`);
    return response.data;
  },

  async getNiveauxComplexite() {
    const response = await api.get<{ data: NiveauComplexite[] }>("/niveaux-complexite");
    return response.data;
  },

  async updateNiveauComplexite(idNivComplex: number, data: Partial<NiveauComplexite>) {
    const response = await api.put(`/niveaux-complexite/${idNivComplex}`, data);
    return response.data;
  },

  async getNiveauxComplexiteHistory() {
    const response = await api.get<{
      success: boolean;
      data: Array<{
        id: number;
        date: string;
        title: string;
        user: string;
        type: string;
      }>;
    }>("/niveaux-complexite/history");
    return response.data;
  },

  async deleteNiveauxComplexiteHistory(id: number) {
    const response = await api.delete(`/niveaux-complexite-history/${id}`);
    return response.data;
  },

  async clearNiveauxComplexiteHistory() {
    const response = await api.delete("/niveaux-complexite-history/clear");
    return response.data;
  },

  // --- Departements CRUD ---
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

  // --- Statuts CRUD ---
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

  // --- Niveaux d'études CRUD ---
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

  // --- Types de ressources CRUD ---
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

  // --- Types d'activités CRUD ---
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

  // --- Grades CRUD complet ---
  async createGrade(data: { lib_grade: string; taux_hor_permanent?: number; taux_hor_vacataire?: number }) {
    const response = await api.post("/grades", data);
    return response.data;
  },

  async deleteGrade(id: number) {
    const response = await api.delete(`/grades/${id}`);
    return response.data;
  },

  async getDashboard() {
    const response = await api.get("/dashboard");
    return response.data;
  },

  async updateProfile(data: { nom?: string; email?: string; password?: string }) {
    const response = await api.put("/profile", data);
    return response.data;
  },
};