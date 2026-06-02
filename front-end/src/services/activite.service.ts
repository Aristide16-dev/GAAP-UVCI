import api from "../api/axios";

export interface ActivitePedagogique {
  id_activite: number;
  id_ens: number;
  id_cours: number;
  id_niv_complex: number;
  id_typ_activite: number;
  id_param: number;
  id_res: number;
  vol_hor_cal: number;
  date_saisie: string;
  statut?: string;
  enseignant?: {
    nom_ens: string;
    pren_ens: string;
  };
  cours?: {
    lib_cours: string;
    nb_sequences: number;
  };
  niveau_complexite?: {
    lib_niv_complex: string;
    coeff_niv_complex: number;
  };
  type_activite?: {
    lib_typ_activite: string;
    multiplicateur_base: number;
  };
}

export interface CreateActiviteData {
  id_ens: number;
  id_cours: number;
  id_niv_complex: number;
  id_typ_activite: number;
  id_param: number;
  id_res: number | null;
  vol_hor_cal: number;
}

export const activiteService = {
  getAll: async (): Promise<ActivitePedagogique[]> => {
    const response = await api.get("/activites-pedagogiques");
    return response.data.data;
  },

  create: async (data: CreateActiviteData): Promise<ActivitePedagogique> => {
    const response = await api.post("/activites-pedagogiques", data);
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<CreateActiviteData & { statut: string }>,
  ): Promise<ActivitePedagogique> => {
    const response = await api.put(`/activites-pedagogiques/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/activites-pedagogiques/${id}`);
  },
};
