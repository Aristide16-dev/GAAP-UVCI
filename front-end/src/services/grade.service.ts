import api from "../api/axios";

export interface Grade {
  id_grade: number;
  lib_grade: string;
  taux_hor_permanent: number | null;
  taux_hor_vacataire: number | null;
  quota_max?: number | null;
}

export const gradeService = {
  getAll: async (): Promise<Grade[]> => {
    const response = await api.get("/grades");
    return response.data.data;
  },

  update: async (idGrade: number, data: Partial<Grade>): Promise<Grade> => {
    const response = await api.put(`/grades/${idGrade}`, data);
    return response.data.data;
  },

  getHistory: async (): Promise<any[]> => {
    const response = await api.get("/grades/history");
    return response.data.data;
  },
};