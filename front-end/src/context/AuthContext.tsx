import { useCallback, useState, type ReactNode } from "react";
import type { Role } from "../types";
import { AuthContext } from "./AuthContext.context";
import type { User, LoginResponse } from "./AuthContext.types";
import { authService } from "../services/auth.service";

const loadStoredAuth = () => {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const storedRole = localStorage.getItem("role") as Role | null;

  if (storedToken && storedUser && storedRole) {
    try {
      return {
        user: JSON.parse(storedUser) as User,
        token: storedToken,
        role: storedRole,
      };
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    }
  }

  return { user: null, token: null, role: null };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadStoredAuth().user);
  const [role, setRole] = useState<Role | null>(() => loadStoredAuth().role);
  const [token, setToken] = useState<string | null>(
    () => loadStoredAuth().token,
  );
  const [loading, setLoading] = useState(false);

  const login = useCallback(
    async (credentials: { type: string; login: string; password: string }) => {
      setLoading(true);
      try {
        const response = (await authService.login(
          credentials,
        )) as LoginResponse;
        const { access_token, data, type } = response;

        let userName = "";
        let userEmail = "";
        let userLogin = "";

        if (type === "administrateur") {
          userLogin = (data.user_log_adm as string) || "";
          userName =
            data.nom_adm && data.pren_adm
              ? `${data.pren_adm} ${data.nom_adm}`.trim()
              : userLogin;
          userEmail = (data.email_adm as string) || "admin@uvci.edu.ci";
        } else if (type === "secretaire") {
          userLogin = (data.user_log_sp as string) || "";
          userName = `${data.pren_sp || ""} ${data.nom_sp || ""}`.trim();
          userEmail = (data.email_sp as string) || "";
        } else if (type === "enseignant") {
          userLogin = (data.user_log_ens as string) || "";
          userName = `${data.pren_ens || ""} ${data.nom_ens || ""}`.trim();
          userEmail = (data.email_ens as string) || "";
        }

        const userData: User = {
          id: userLogin,
          login: userLogin,
          nom: userName,
          email: userEmail,
          role: type as Role,
          ...data,
        };

        setUser(userData);
        setToken(access_token);
        setRole(type as Role);

        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("role", type);
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setRole(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    window.location.href = "/login";
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

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
        isAdmin: role === "administrateur",
        isSecretaire: role === "secretaire",
        isEnseignant: role === "enseignant",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
