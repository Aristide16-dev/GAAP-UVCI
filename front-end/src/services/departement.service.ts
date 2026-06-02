import api from "../api/axios";

export interface Departement {
  id_depart: number;
  lib_depart: string;
  desc_depart?: string;
}

export const departementService = {
  getAll: async (): Promise<Departement[]> => {
    const response = await api.get("/departements");
    return response.data.data;
  },

  getById: async (id: number): Promise<Departement> => {
    const response = await api.get(`/departements/${id}`);
    return response.data.data;
  },

  create: async (data: Omit<Departement, 'id_depart'>): Promise<Departement> => {
    const response = await api.post("/departements", data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Omit<Departement, 'id_depart'>>): Promise<Departement> => {
    const response = await api.put(`/departements/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/departements/${id}`);
  },
};