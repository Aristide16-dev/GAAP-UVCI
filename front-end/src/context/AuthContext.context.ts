/**
 * AuthContext.context.ts — Création du contexte React pour l'authentification
 *
 * Ce fichier crée le "canal de communication" React qui permet de partager
 * les données d'authentification entre tous les composants de l'application.
 *
 * Le contexte est créé UNE SEULE FOIS ici, puis :
 * - AuthProvider (AuthContext.tsx) FOURNIT les données dans ce canal
 * - useAuth (useAuth.ts) LIT les données depuis ce canal
 *
 * La valeur initiale est `undefined` car le contexte est vide avant qu'un
 * AuthProvider l'enveloppe. C'est pourquoi useAuth vérifie cette valeur
 * et lance une erreur si le composant est utilisé hors du Provider.
 */
import { createContext } from "react";
import type { AuthUser, Role } from "../types";
import type { User } from "./AuthContext.types";

/**
 * Interface décrivant toutes les données et fonctions disponibles
 * dans le contexte d'authentification.
 */
export interface AuthContextType {
  /** L'utilisateur actuellement connecté, ou null si déconnecté */
  user: User | null;
  /** Le rôle de l'utilisateur : "administrateur" | "secretaire" | "enseignant" */
  role: Role | null;
  /** Le token Bearer envoyé dans les en-têtes de chaque requête API */
  token: string | null;
  /** true pendant l'appel API de connexion (pour désactiver le bouton) */
  loading: boolean;
  /** Fonction de connexion — envoie les identifiants à l'API */
  login: (credentials: { type: string; login: string; password: string }) => Promise<void>;
  /** Fonction de déconnexion — efface la session et redirige vers /login */
  logout: () => void;
  /** Mise à jour partielle du profil de l'utilisateur connecté */
  updateUser: (userData: Partial<AuthUser>) => void;
  /** Raccourcis pour vérifier le rôle rapidement dans les composants */
  isAdmin: boolean;
  isSecretaire: boolean;
  isEnseignant: boolean;
}

/**
 * Création du contexte React.
 * undefined = valeur par défaut quand aucun AuthProvider n'est présent.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
