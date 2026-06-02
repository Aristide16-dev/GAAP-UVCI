import api from "../api/axios";

export interface Niveau {
  id_niveau: number;
  lib_niveau: string;
}

export const niveauService = {
  getAll: async (): Promise<Niveau[]> => {
    const response = await api.get("/niveaux");
    return response.data.data;
  },

  getById: async (id: number): Promise<Niveau> => {
    const response = await api.get(`/niveaux/${id}`);
    return response.data.data;
  },

  create: async (data: Omit<Niveau, "id_niveau">): Promise<Niveau> => {
    const response = await api.post("/niveaux", data);
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<Omit<Niveau, "id_niveau">>,
  ): Promise<Niveau> => {
    const response = await api.put(`/niveaux/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/niveaux/${id}`);
  },
};
