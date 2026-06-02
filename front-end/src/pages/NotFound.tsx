export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 text-center px-4">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="text-3xl font-semibold mt-4">Oups ! Page introuvable</h2>
      <p className="mt-2 text-base-content/70">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div className="mt-6">
        <a href="/" className="btn btn-primary">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
