/**
 * AuthContext.types.ts — Types spécifiques au contexte d'authentification
 *
 * Ce fichier définit les interfaces (formes de données) utilisées
 * uniquement dans le système d'authentification.
 *
 * NOTE : Ces types complètent ceux de src/types/index.ts
 * en ajoutant des détails propres à la gestion de session.
 */
import type { AuthUser, Role } from "../types";

/**
 * User — Représentation complète de l'utilisateur connecté dans le contexte.
 * Étend AuthUser (données brutes de l'API) avec des champs normalisés
 * communs aux trois rôles pour simplifier leur utilisation.
 */
export interface User extends AuthUser {
  /** Identifiant unique (peut être un login string ou un id_ens number) */
  id?: string | number;
  /** Login de connexion */
  login?: string;
  /** Nom complet affiché dans l'interface */
  nom?: string;
  /** Email de l'utilisateur */
  email?: string;
  /** Rôle dans l'application */
  role?: Role;
}

/**
 * LoginResponse — Structure exacte de la réponse du serveur après connexion.
 * Correspond à ce que retourne AuthController::loginUser() dans le backend.
 */
export interface LoginResponse {
  /** Message de confirmation ("Connexion reussie.") */
  message: string;
  /** Type de compte connecté */
  type: Role;
  /** Type de token (toujours "Bearer") */
  token_type: string;
  /** Token d'accès à inclure dans les en-têtes Authorization */
  access_token: string;
  /** Données brutes du compte (champs différents selon le rôle) */
  data: AuthUser;
}

/**
 * AuthContextType — Interface du contexte React d'authentification.
 * Définit ce qui est accessible via useAuth() dans tous les composants.
 */
export interface AuthContextType {
  user: User | null;
  role: Role | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { type: string; login: string; password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAdmin: boolean;
  isSecretaire: boolean;
  isEnseignant: boolean;
}
