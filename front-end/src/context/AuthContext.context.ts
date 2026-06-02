import { createContext } from "react";
import type { AuthUser, Role } from "../types";
import type { User } from "./AuthContext.types";

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
  isAdmin: boolean;
  isSecretaire: boolean;
  isEnseignant: boolean;
  updateUser: (userData: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
