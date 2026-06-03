/**
 * NotFound.tsx — Page d'erreur 404 (page introuvable)
 *
 * Cette page s'affiche quand l'utilisateur essaie d'accéder à une URL
 * qui n'existe pas dans l'application. Elle est configurée dans App.tsx
 * via la route <Route path="*" element={<NotFound />} /> qui capture
 * toutes les URLs non définies.
 *
 * Elle affiche un grand "404", un message explicatif,
 * et un bouton pour retourner à la page d'accueil.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 text-center px-4">
      {/* Grand numéro 404 en couleur principale */}
      <h1 className="text-9xl font-bold text-primary">404</h1>

      {/* Titre et message explicatif */}
      <h2 className="text-3xl font-semibold mt-4">Oups ! Page introuvable</h2>
      <p className="mt-2 text-base-content/70">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>

      {/* Bouton de retour à l'accueil */}
      <div className="mt-6">
        <a href="/" className="btn btn-primary">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
