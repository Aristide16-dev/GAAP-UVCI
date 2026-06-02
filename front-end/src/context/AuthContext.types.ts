import type { AuthUser, Role } from "../types";

export interface User extends AuthUser {
  id?: string | number;
  login?: string;
  nom?: string;
  email?: string;
  role?: Role;
}

export interface LoginResponse {
  message: string;
  type: Role;
  token_type: string;
  access_token: string;
  data: AuthUser;
}

export interface AuthContextType {
  user: User | null;
  role: Role | null;
  token: string | null;
  loading: boolean;
  login: (credentials: {
    type: string;
    login: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAdmin: boolean;
  isSecretaire: boolean;
  isEnseignant: boolean;
}
