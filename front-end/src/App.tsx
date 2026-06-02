import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PageAnimate from "./components/PageAnimate";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Layouts chargés immédiatement (nécessaires dès la navigation)
import AdminLayout from "./components/layouts/AdminLayout";
import SecretaireLayout from "./components/layouts/SecretaireLayout";
import EnseignentLayout from "./components/layouts/EnseignentLayout";

// Pages publiques
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/auth/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

// Pages admin
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ParametrageAcademique = lazy(() => import("./pages/admin/ParametrageAcademique"));
const ParametresCalcul = lazy(() => import("./pages/admin/ParametreCalcul"));
const GestionTaux = lazy(() => import("./pages/admin/GestionTaux"));
const GestionReferentiels = lazy(() => import("./pages/admin/GestionReferentiels"));

// Pages secrétaire
const SecretaireDashboard = lazy(() => import("./pages/secretaire/SecretaireDashboard"));
const EnseignantsList = lazy(() => import("./pages/secretaire/EnseignantsList"));
const GestionCours = lazy(() => import("./pages/secretaire/GestionCours"));
const SaisieValidation = lazy(() => import("./pages/secretaire/SaisieValidation"));
const EtatsExports = lazy(() => import("./pages/secretaire/EtatsExports"));

// Pages enseignant
const EnseignantDashboard = lazy(() => import("./pages/enseignant/EnseignantDashboard"));
const MesActivitesPedagogiques = lazy(() => import("./pages/enseignant/MesActivitesPedagogiques"));
const SuiviHeuresComplementaires = lazy(() => import("./pages/enseignant/SuiviHeuresComplementaires"));
const MesDocumentsExports = lazy(() => import("./pages/enseignant/MesDocumentsExports"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );
}

function App() {
  return (
    <Router>
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

      <PageAnimate>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route element={<ProtectedRoute allowedRoles={["administrateur"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard"    element={<AdminDashboard />} />
                <Route path="/admin/parametrage"  element={<ParametrageAcademique />} />
                <Route path="/admin/calcul"        element={<ParametresCalcul />} />
                <Route path="/admin/taux"          element={<GestionTaux />} />
                <Route path="/admin/referentiels"  element={<GestionReferentiels />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["secretaire"]} />}>
              <Route element={<SecretaireLayout />}>
                <Route path="/secretaire/dashboard"   element={<SecretaireDashboard />} />
                <Route path="/secretaire/enseignants" element={<EnseignantsList />} />
                <Route path="/secretaire/cours"       element={<GestionCours />} />
                <Route path="/secretaire/validation"  element={<SaisieValidation />} />
                <Route path="/secretaire/exports"     element={<EtatsExports />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["enseignant"]} />}>
              <Route element={<EnseignentLayout />}>
                <Route path="/enseignant/dashboard"   element={<EnseignantDashboard />} />
                <Route path="/enseignant/activites"   element={<MesActivitesPedagogiques />} />
                <Route path="/enseignant/suivi-heures" element={<SuiviHeuresComplementaires />} />
                <Route path="/enseignant/exports"     element={<MesDocumentsExports />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </PageAnimate>
    </Router>
  );
}

export default App;
