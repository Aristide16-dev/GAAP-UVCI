import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://mon-api.test/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Guard : une seule redirection même si N requêtes reçoivent 401 simultanément
let isRedirecting = false;

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthEndpoint =
      error.config?.url?.includes("/login") ||
      error.config?.url?.includes("/register") ||
      error.config?.url?.includes("/logout");

    // 401 sur un endpoint protégé → session expirée, rediriger une seule fois
    if (status === 401 && !isAuthEndpoint) {
      if (!isRedirecting) {
        isRedirecting = true;
        clearSession();
        // Laisser React Router gérer la navigation si possible,
        // sinon forcer via window
        window.location.replace("/login");
      }
      return Promise.reject(new Error("Session expirée"));
    }

    if (status === 403) {
      return Promise.reject(
        new Error(error.response?.data?.message || "Accès refusé"),
      );
    }

    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }

    if (
      !error.response &&
      (error.code === "ERR_NETWORK" || error.message?.includes("Network Error"))
    ) {
      return Promise.reject(
        new Error("Connexion au serveur impossible. Vérifiez que le serveur est démarré."),
      );
    }

    return Promise.reject(new Error("Une erreur est survenue"));
  },
);

export default api;
