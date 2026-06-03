/**
 * types/index.ts — Types TypeScript globaux de l'application GAAP-UVCI
 *
 * Ce fichier définit les "types" — c'est-à-dire la forme que doivent avoir
 * les données dans l'application. TypeScript utilise ces types pour détecter
 * les erreurs avant même d'exécuter le code.
 *
 * Exemple : si quelque part dans le code on essaie d'accéder à user.prenom
 * alors que le type ne prévoit pas ce champ, TypeScript affichera une erreur
 * immédiatement dans l'éditeur.
 */

/**
 * Les trois rôles possibles dans l'application.
 * Un utilisateur ne peut avoir qu'un seul rôle à la fois.
 */
export type Role = "administrateur" | "secretaire" | "enseignant";

/**
 * Les deux statuts possibles d'un compte utilisateur.
 * Un compte INACTIF ne peut pas se connecter.
 */
export type Status = "ACTIF" | "INACTIF";

/**
 * AuthUser — Données brutes d'un utilisateur telles que renvoyées par l'API.
 * Chaque rôle a ses propres champs (préfixe _adm, _sp, _ens).
 * L'index signature [key: string]: unknown permet d'accéder à n'importe quel
 * champ sans erreur TypeScript (utile car les 3 rôles ont des champs différents).
 */
export interface AuthUser {
  [key: string]: unknown;

  // Champs de l'enseignant
  id_ens?:       number;
  nom_ens?:      string;
  pren_ens?:     string;
  email_ens?:    string;
  tel_ens?:      string;
  taux_hor_ens?: number;

  // Champs de la secrétaire
  user_log_sp?: string;
  nom_sp?:      string;
  pren_sp?:     string;
  email_sp?:    string;

  // Champs de l'administrateur
  user_log_adm?: string;
  ann_aca?:      string;
  rol_usr?:      string;

  // Champs communs
  login?:        string;
  last_login_at?: string;
}

/**
 * LoginResponse — Structure de la réponse de l'API lors d'une connexion réussie.
 * L'API retourne le type de compte, un token Bearer, et les données de l'utilisateur.
 */
export interface LoginResponse {
  message:      string;
  type:         Role;
  access_token: string;
  token_type:   string;
  data:         AuthUser;
}

/**
 * User — Utilisateur connecté tel que stocké dans le contexte React et localStorage.
 * Étend AuthUser en ajoutant des champs normalisés (id, nom, email, role)
 * communs à tous les rôles pour simplifier leur utilisation dans les composants.
 */
export interface User extends AuthUser {
  role:   Role;
  id?:    number | string;
  nom?:   string;
  email?: string;
}
