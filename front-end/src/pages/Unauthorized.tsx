/**
 * Unauthorized.tsx — Page d'accès refusé (erreur 403)
 *
 * Cette page s'affiche quand un utilisateur connecté essaie d'accéder
 * à une section pour laquelle il n'a pas le bon rôle.
 *
 * Exemple : un enseignant qui essaie d'aller sur /admin/dashboard
 * sera redirigé ici par le composant ProtectedRoute.
 *
 * Elle affiche une icône de bouclier barré, un message d'explication,
 * et un lien pour retourner à la page de connexion.
 */
import { ShieldX } from "lucide-react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 text-center px-4">
      {/* Icône bouclier rouge */}
      <ShieldX size={80} className="text-error mb-4" />

      {/* Titre et message */}
      <h1 className="text-4xl font-bold text-primary">Accès refusé</h1>
      <p className="mt-2 text-base-content/70 max-w-md">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>

      {/* Lien de retour vers la connexion */}
      <Link to="/login" className="btn btn-primary mt-6">
        Retour à la connexion
      </Link>
    </div>
  );
}
