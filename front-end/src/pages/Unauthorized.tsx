import { ShieldX } from "lucide-react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 text-center px-4">
      <ShieldX size={80} className="text-error mb-4" />
      <h1 className="text-4xl font-bold text-primary">Accès refusé</h1>
      <p className="mt-2 text-base-content/70 max-w-md">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <Link to="/login" className="btn btn-primary mt-6">
        Retour à la connexion
      </Link>
    </div>
  );
}
