/**
 * AuthContext.tsx — Fournisseur du contexte d'authentification
 *
 * Ce fichier gère TOUT ce qui concerne la connexion/déconnexion dans l'app.
 * Il utilise le "Context" de React pour rendre les données de connexion
 * disponibles dans TOUS les composants sans avoir à les passer manuellement.
 *
 * DONNÉES GÉRÉES :
 * - L'utilisateur connecté (nom, email, rôle, etc.)
 * - Le token d'authentification (Bearer token envoyé à chaque requête API)
 * - Le rôle de l'utilisateur (administrateur / secretaire / enseignant)
 * - L'état de chargement pendant la connexion
 *
 * STOCKAGE :
 * Les données sont sauvegardées dans localStorage pour survivre au rechargement
 * de la page. Elles sont effacées à la déconnexion ou en cas de session expirée.
 *
 * COMMENT L'UTILISER dans un composant :
 *   import { useAuth } from "../context/useAuth";
 *   const { user, role, login, logout, isAdmin } = useAuth();
 */
import { useCallback, useState, type ReactNode } from "react";
import type { Role } from "../types";
import { AuthContext } from "./AuthContext.context";
import type { User, LoginResponse } from "./AuthContext.types";
import { authService } from "../services/auth.service";

/**
 * Charge les données de session sauvegardées dans localStorage.
 * Appelé une seule fois au démarrage de l'application.
 * Si les données sont corrompues, elles sont effacées automatiquement.
 */
const loadStoredAuth = () => {
  const storedToken = localStorage.getItem("token");
  const storedUser  = localStorage.getItem("user");
  const storedRole  = localStorage.getItem("role") as Role | null;

  if (storedToken && storedUser && storedRole) {
    try {
      return {
        user:  JSON.parse(storedUser) as User,
        token: storedToken,
        role:  storedRole,
      };
    } catch {
      // JSON invalide → on efface tout pour éviter des erreurs
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    }
  }

  return { user: null, token: null, role: null };
};

/**
 * AuthProvider — Composant qui enveloppe toute l'application.
 * Il fournit les fonctions login/logout et les données utilisateur
 * à tous les composants enfants via le contexte React.
 *
 * Dans main.tsx, l'app entière est enveloppée dans <AuthProvider>.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // État de l'utilisateur connecté, initialisé depuis localStorage
  const [user,    setUser]    = useState<User | null>(() => loadStoredAuth().user);
  const [role,    setRole]    = useState<Role | null>(() => loadStoredAuth().role);
  const [token,   setToken]   = useState<string | null>(() => loadStoredAuth().token);
  const [loading, setLoading] = useState(false);

  /**
   * Fonction de connexion — appelée depuis la page Login.
   * Envoie les identifiants à l'API, récupère le token et les données
   * de l'utilisateur, puis les sauvegarde dans l'état et localStorage.
   */
  const login = useCallback(
    async (credentials: { type: string; login: string; password: string }) => {
      setLoading(true);
      try {
        const response = (await authService.login(credentials)) as LoginResponse;
        const { access_token, data, type } = response;

        // Construire un objet utilisateur unifié selon le rôle
        let userName  = "";
        let userEmail = "";
        let userLogin = "";

        if (type === "administrateur") {
          userLogin = (data.user_log_adm as string) || "";
          // L'admin peut ne pas avoir de nom/prénom renseignés
          userName  = data.nom_adm && data.pren_adm
            ? `${data.pren_adm} ${data.nom_adm}`.trim()
            : userLogin;
          userEmail = (data.email_adm as string) || "admin@uvci.edu.ci";
        } else if (type === "secretaire") {
          userLogin = (data.user_log_sp as string) || "";
          userName  = `${data.pren_sp || ""} ${data.nom_sp || ""}`.trim();
          userEmail = (data.email_sp as string) || "";
        } else if (type === "enseignant") {
          userLogin = (data.user_log_ens as string) || "";
          userName  = `${data.pren_ens || ""} ${data.nom_ens || ""}`.trim();
          userEmail = (data.email_ens as string) || "";
        }

        // Fusionner avec toutes les données brutes de l'API (pour un accès flexible)
        const userData: User = {
          id:    userLogin,
          login: userLogin,
          nom:   userName,
          email: userEmail,
          role:  type as Role,
          ...data,
        };

        // Mettre à jour l'état React
        setUser(userData);
        setToken(access_token);
        setRole(type as Role);

        // Sauvegarder en localStorage pour survivre au rechargement de la page
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("role", type);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Fonction de déconnexion.
   * Appelle le serveur pour invalider le token, puis efface toutes les données
   * locales et redirige vers la page de connexion.
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout(); // Invalide le token côté serveur
    } catch {
      // Même si le serveur échoue, on déconnecte quand même localement
    }
    setUser(null);
    setToken(null);
    setRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/login";
  }, []);

  /**
   * Met à jour les données de l'utilisateur connecté (ex: après modification du profil).
   * Synchronise automatiquement avec localStorage.
   */
  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  // Fournir toutes les données et fonctions aux composants enfants
  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAdmin:      role === "administrateur",
        isSecretaire: role === "secretaire",
        isEnseignant: role === "enseignant",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
