import api from "../api/axios";

export interface Cours {
  id_cours: number;
  int_cours: string;
  filiere: string;
  id_niveau: number;
  semestre: string;
  nb_credits: number;
  nb_heures: number;
  nb_sequences?: number;
  id_typ_res?: number | null;
}

export interface CreateCoursData {
  int_cours: string;
  filiere: string;
  id_niveau: number;
  semestre: string;
  nb_credits: number;
  nb_heures: number;
  id_typ_res?: number | null;
}

export const coursService = {
  getAll: async (): Promise<Cours[]> => {
    const response = await api.get("/cours");
    return response.data.data;
  },

  getById: async (id: number): Promise<Cours> => {
    const response = await api.get(`/cours/${id}`);
    return response.data.data;
  },

  create: async (data: CreateCoursData): Promise<Cours> => {
    const response = await api.post("/cours", data);
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<CreateCoursData>,
  ): Promise<Cours> => {
    const response = await api.put(`/cours/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/cours/${id}`);
  },
};
