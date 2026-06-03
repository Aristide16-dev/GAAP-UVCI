/**
 * ProtectedRoute.tsx — Garde de route basée sur le rôle de l'utilisateur
 *
 * Ce composant agit comme un "gardien" devant les pages protégées.
 * Avant d'afficher une page, il vérifie deux conditions :
 *
 * 1. L'utilisateur est-il connecté ? (token + données en localStorage)
 *    → Non : redirige vers /login
 *
 * 2. L'utilisateur a-t-il le bon rôle pour cette section ?
 *    → Non : redirige vers /unauthorized (page "Accès refusé")
 *
 * EXEMPLE D'UTILISATION dans App.tsx :
 *   <Route element={<ProtectedRoute allowedRoles={["administrateur"]} />}>
 *     <Route element={<AdminLayout />}>
 *       <Route path="/admin/dashboard" element={<AdminDashboard />} />
 *     </Route>
 *   </Route>
 *
 * NOTE SÉCURITÉ : Cette protection est côté client (UI uniquement).
 * La vraie sécurité est assurée par le backend (middleware Sanctum + RoleMiddleware)
 * qui vérifie le token à chaque requête API. ProtectedRoute améliore l'UX
 * mais ne remplace pas la sécurité serveur.
 */
import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "../../types";

/** Props du composant */
interface ProtectedRouteProps {
  /** Liste des rôles autorisés à accéder aux routes enfants */
  allowedRoles: Role[];
}

/**
 * Composant ProtectedRoute.
 * Lit le token et le rôle depuis localStorage pour décider de la redirection.
 * Si l'accès est autorisé, <Outlet /> rend les routes enfants normalement.
 */
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  // Vérifier si l'utilisateur est connecté (token + données présents)
  const user = localStorage.getItem("user");
  const role = localStorage.getItem("role") as Role | null;

  // Pas de session → rediriger vers la page de connexion
  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  // Mauvais rôle → rediriger vers la page "Accès refusé"
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Accès autorisé → rendre les composants enfants (pages de la section)
  return <Outlet />;
}
