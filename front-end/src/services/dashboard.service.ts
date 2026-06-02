import api from "../api/axios";

export interface DashboardStats {
  volumeHoraireGlobal: number;
  enseignantsActifs: number;
  depassementsCritiques: number;
  anneeAcademique: string; // ← AJOUTÉ
  productionMensuelle: {
    mois: string;
    total: number;
  }[];
  heuresParDepartement: {
    name: string;
    desc: string;
    hours: number;
  }[];
  enseignantsDepassement: {
    id_ens: number;
    nom: string;
    prenom: string;
    departement: string;
    quota: number;
    done: number;
    exceed: number;
  }[];
}

export const dashboardService = {
  getStats: async (period?: string): Promise<DashboardStats> => {
    const response = await api.get("/dashboard", { params: { period } });
    return response.data.data;
  },
};
