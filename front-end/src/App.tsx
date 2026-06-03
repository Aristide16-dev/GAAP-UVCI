/**
 * App.tsx — Routeur principal de l'application GAAP-UVCI
 *
 * Ce fichier est le cœur de la navigation. Il définit TOUTES les pages
 * de l'application et qui peut y accéder.
 *
 * STRUCTURE DE LA NAVIGATION :
 * ├── /                    → Page d'accueil publique (LandingPage)
 * ├── /login               → Page de connexion (3 onglets : admin / secrétaire / enseignant)
 * ├── /unauthorized        → Page "Accès refusé"
 * ├── /admin/...           → Pages réservées à l'administrateur
 * ├── /secretaire/...      → Pages réservées à la secrétaire
 * ├── /enseignant/...      → Pages réservées à l'enseignant
 * └── *                    → Page 404 (route inconnue)
 *
 * TECHNIQUES UTILISÉES :
 * - lazy() : charge chaque page seulement quand l'utilisateur y navigue
 *   (réduit le temps de chargement initial)
 * - Suspense : affiche un spinner pendant le chargement d'une page
 * - ProtectedRoute : vérifie que l'utilisateur est connecté avec le bon rôle
 * - ErrorBoundary : affiche un message d'erreur si une page plante
 */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PageAnimate from "./components/PageAnimate";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Les layouts sont chargés immédiatement car ils sont nécessaires dès qu'une
// route protégée est accédée — on ne peut pas les lazy-loader
import AdminLayout from "./components/layouts/AdminLayout";
import SecretaireLayout from "./components/layouts/SecretaireLayout";
import EnseignentLayout from "./components/layouts/EnseignentLayout";

// ─── Pages publiques (accessibles sans connexion) ─────────────────────────────
const LandingPage  = lazy(() => import("./pages/LandingPage"));
const LoginPage    = lazy(() => import("./pages/auth/Login"));
const NotFound     = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

// ─── Pages réservées à l'administrateur ───────────────────────────────────────
const AdminDashboard       = lazy(() => import("./pages/admin/AdminDashboard"));
const ParametrageAcademique= lazy(() => import("./pages/admin/ParametrageAcademique"));
const ParametresCalcul     = lazy(() => import("./pages/admin/ParametreCalcul"));
const GestionTaux          = lazy(() => import("./pages/admin/GestionTaux"));
const GestionReferentiels  = lazy(() => import("./pages/admin/GestionReferentiels"));

// ─── Pages réservées à la secrétaire ─────────────────────────────────────────
const SecretaireDashboard  = lazy(() => import("./pages/secretaire/SecretaireDashboard"));
const EnseignantsList      = lazy(() => import("./pages/secretaire/EnseignantsList"));
const GestionCours         = lazy(() => import("./pages/secretaire/GestionCours"));
const SaisieValidation     = lazy(() => import("./pages/secretaire/SaisieValidation"));
const EtatsExports         = lazy(() => import("./pages/secretaire/EtatsExports"));

// ─── Pages réservées à l'enseignant ──────────────────────────────────────────
const EnseignantDashboard        = lazy(() => import("./pages/enseignant/EnseignantDashboard"));
const MesActivitesPedagogiques   = lazy(() => import("./pages/enseignant/MesActivitesPedagogiques"));
const SuiviHeuresComplementaires = lazy(() => import("./pages/enseignant/SuiviHeuresComplementaires"));
const MesDocumentsExports        = lazy(() => import("./pages/enseignant/MesDocumentsExports"));

/**
 * Spinner affiché pendant le chargement d'une page lazy.
 * DaisyUI loading-spinner centré sur fond clair.
 */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );
}

/**
 * Composant racine de l'application.
 * Déclare les routes et les protections d'accès.
 */
function App() {
  return (
    <Router>
      {/* Notifications toast (succès, erreur, avertissement) affichées en haut à droite */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
        limit={3}
      />

      {/* ErrorBoundary capture les erreurs JavaScript inattendues et affiche un message lisible */}
      <ErrorBoundary>
        {/* PageAnimate applique une animation de transition entre les pages */}
        <PageAnimate>
          {/* Suspense affiche PageLoader pendant le chargement d'une page lazy */}
          <Suspense fallback={<PageLoader />}>
            <Routes>

              {/* ── Routes publiques ── */}
              <Route path="/"            element={<LandingPage />} />
              <Route path="/login"       element={<LoginPage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* ── Routes admin (rôle "administrateur" requis) ── */}
              <Route element={<ProtectedRoute allowedRoles={["administrateur"]} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard"   element={<AdminDashboard />} />
                  <Route path="/admin/parametrage" element={<ParametrageAcademique />} />
                  <Route path="/admin/calcul"      element={<ParametresCalcul />} />
                  <Route path="/admin/taux"        element={<GestionTaux />} />
                  <Route path="/admin/referentiels" element={<GestionReferentiels />} />
                </Route>
              </Route>

              {/* ── Routes secrétaire (rôle "secretaire" requis) ── */}
              <Route element={<ProtectedRoute allowedRoles={["secretaire"]} />}>
                <Route element={<SecretaireLayout />}>
                  <Route path="/secretaire/dashboard"   element={<SecretaireDashboard />} />
                  <Route path="/secretaire/enseignants" element={<EnseignantsList />} />
                  <Route path="/secretaire/cours"       element={<GestionCours />} />
                  <Route path="/secretaire/validation"  element={<SaisieValidation />} />
                  <Route path="/secretaire/exports"     element={<EtatsExports />} />
                </Route>
              </Route>

              {/* ── Routes enseignant (rôle "enseignant" requis) ── */}
              <Route element={<ProtectedRoute allowedRoles={["enseignant"]} />}>
                <Route element={<EnseignentLayout />}>
                  <Route path="/enseignant/dashboard"    element={<EnseignantDashboard />} />
                  <Route path="/enseignant/activites"    element={<MesActivitesPedagogiques />} />
                  <Route path="/enseignant/suivi-heures" element={<SuiviHeuresComplementaires />} />
                  <Route path="/enseignant/exports"      element={<MesDocumentsExports />} />
                </Route>
              </Route>

              {/* ── Page 404 : toute URL inconnue ── */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </Suspense>
        </PageAnimate>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
