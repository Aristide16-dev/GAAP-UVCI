export type Role = "administrateur" | "secretaire" | "enseignant";

export interface AuthUser {
  id_ens?: number;
  nom_ens?: string;
  pren_ens?: string;
  email_ens?: string;
  tel_ens?: string;
  taux_hor_ens?: number;

  user_log_sp?: string;
  nom_sp?: string;
  pren_sp?: string;
  email_sp?: string;

  user_log_adm?: string;
  ann_aca?: string;
  rol_usr?: string;
}

export interface LoginResponse {
  message: string;
  type: Role;
  token_type: string;
  access_token: string;
  data: AuthUser;
}
