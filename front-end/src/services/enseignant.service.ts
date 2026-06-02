import api from "../api/axios";

export interface Enseignant {
  id_ens: number;
  user_log_ens: string;
  nom_ens: string;
  pren_ens: string;
  email_ens: string;
  tel_ens: string;
  id_grade: number;
  id_statut: number;
  id_depart: number;
  taux_hor_ens: number;
  status: string;
}

export interface CreateEnseignantData {
  nom_ens: string;
  pren_ens: string;
  email_ens: string;
  tel_ens: string;
  id_grade: number;
  id_statut: number;
  id_depart: number;
  taux_hor_ens: number;
  user_log_ens?: string;
  user_pasw_ens?: string;
}

export const enseignantService = {
  getAll: async (): Promise<Enseignant[]> => {
    const response = await api.get("/enseignants");
    return response.data.data;
  },

  getById: async (id: number): Promise<Enseignant> => {
    const response = await api.get(`/enseignants/${id}`);
    return response.data.data;
  },

  create: async (data: CreateEnseignantData): Promise<Enseignant> => {
    const response = await api.post("/enseignants", data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateEnseignantData>): Promise<Enseignant> => {
    const response = await api.put(`/enseignants/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/enseignants/${id}`);
  },

  search: async (query: string): Promise<Enseignant[]> => {
    const response = await api.get("/enseignants", { params: { search: query } });
    return response.data.data;
  },
};