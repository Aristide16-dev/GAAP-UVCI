import api from "../api/axios";

export interface Statut {
  id_statut: number;
  lib_statut: string;
  desc_statut?: string;
}

export const statutService = {
  getAll: async (): Promise<Statut[]> => {
    const response = await api.get("/statuts");
    return response.data.data;
  },

  getById: async (id: number): Promise<Statut> => {
    const response = await api.get(`/statuts/${id}`);
    return response.data.data;
  },

  create: async (data: Omit<Statut, 'id_statut'>): Promise<Statut> => {
    const response = await api.post("/statuts", data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Omit<Statut, 'id_statut'>>): Promise<Statut> => {
    const response = await api.put(`/statuts/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/statuts/${id}`);
  },
};