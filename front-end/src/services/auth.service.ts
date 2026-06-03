/**
 * auth.service.ts — Service d'authentification
 *
 * Ce fichier regroupe toutes les fonctions qui communiquent avec
 * l'API pour les opérations liées à la connexion et à la déconnexion.
 *
 * Chaque fonction retourne une Promise (résultat asynchrone) car
 * les appels réseau ne sont pas instantanés.
 *
 * FONCTIONS DISPONIBLES :
 * - login()  : envoie les identifiants et récupère le token
 * - logout() : invalide le token côté serveur et efface le localStorage
 * - me()     : récupère les informations de l'utilisateur actuellement connecté
 */
import axiosInstance from "../api/axios";

export const authService = {
  /**
   * Envoie les identifiants de connexion au serveur.
   * En cas de succès, le serveur retourne un token Bearer et les données du compte.
   * En cas d'échec (mauvais mot de passe, compte inactif...), une erreur est lancée.
   *
   * @param credentials - Objet contenant login, password et type (rôle)
   * @returns Les données de l'utilisateur et le token d'accès
   */
  async login(credentials: { login: string; password: string; type: string }) {
    const response = await axiosInstance.post("/login", credentials);
    return response.data;
  },

  /**
   * Déconnecte l'utilisateur.
   * Appelle le serveur pour invalider le token (empêcher toute réutilisation),
   * puis efface les données de session du navigateur (localStorage).
   */
  async logout() {
    await axiosInstance.post("/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  },

  /**
   * Récupère le profil de l'utilisateur actuellement connecté.
   * Utile pour rafraîchir les données après une modification de profil.
   *
   * @returns Les données actualisées du compte connecté
   */
  async me() {
    const response = await axiosInstance.get("/me");
    return response.data;
  },
};
