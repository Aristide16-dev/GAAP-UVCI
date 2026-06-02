import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/useAuth";
import type { Role } from "../../types";

// ─── Données des rôles ────────────────────────────────────────────────────────
const ROLES: { value: Role; label: string }[] = [
  { value: "administrateur", label: "Administrateur" },
  { value: "secretaire",     label: "Secrétaire"    },
  { value: "enseignant",     label: "Enseignant"    },
];

// Flèche qui glisse vers la droite au survol du bouton parent
const arrowVariants = {
  rest:  { x: 0 },
  hover: { x: 6 },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole]                 = useState<Role>("enseignant");
  const [loginValue, setLoginValue]     = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!loginValue || !password) {
      toast.warning("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    try {
      await login({ login: loginValue, password, type: role });
      toast.success("Connexion réussie !");
      setTimeout(() => {
        if (role === "administrateur") navigate("/admin/dashboard");
        else if (role === "secretaire") navigate("/secretaire/dashboard");
        else navigate("/enseignant/dashboard");
      }, 500);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Identifiants invalides";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="grow flex flex-col items-center px-6 pb-10 pt-8">

        {/* ── Logo — fixe, aucune animation ────────────────────────────────── */}
        <div className="flex w-full max-w-lg flex-col items-center text-center gap-5">
          <div className="bg-white rounded-xl py-3 px-5 shadow-sm flex justify-center items-center flex-col">
            <img src="/apple-icon.png" alt="Logo GAAP-UVCI" width={100} height={100} />
            <p className="text-md md:text-3xl text-2xl font-bold text-primary">
              GAAP-UVCI
            </p>
          </div>
          <p className="text-sm md:text-xl font-medium text-gray-600">
            Gestion Automatisée des Activités Pédagogiques de l&apos;UVCI
          </p>
        </div>

        {/* ── Carte — zoom-in + fade à l'entrée ────────────────────────────── */}
        <motion.div
          className="mt-6 w-full max-w-lg"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <form
            onSubmit={handleLogin}
            className="relative rounded-xl bg-white p-8 shadow-2xl ring-1 ring-black/5 space-y-8"
          >
            <div className="text-md font-semibold uppercase tracking-wide">
              Choisir votre rôle
            </div>

            {/* ── Sélecteur de rôle — indicateur glissant (layoutId) ───────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 bg-primary/10 rounded-xl border border-primary p-1 gap-1">
              {ROLES.map(({ value, label }, index) => (
                <button
                  key={value}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setRole(value)}
                  className={`relative h-10 text-sm font-bold rounded-lg px-2 ${
                    index === 2 ? "col-span-2 sm:col-span-1" : ""
                  }`}
                >
                  {/* Fond blanc qui glisse d'un onglet à l'autre */}
                  {role === value && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 transition-colors duration-200 ${
                      role === value ? "text-primary" : "text-primary/50"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Champs de saisie ─────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Identifiant */}
              <div>
                <label className="text-lg font-bold text-base-content">
                  Identifiant
                </label>
                <div className="relative mt-2">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"
                    size={20}
                  />
                  <input
                    value={loginValue}
                    onChange={(e) => setLoginValue(e.target.value)}
                    type="text"
                    disabled={isLoading}
                    placeholder="Votre identifiant"
                    className="input input-bordered w-full bg-transparent border-[#ead2e6] pr-3 pl-10 rounded-lg h-15 text-lg font-medium outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-lg font-bold text-base-content">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    className="btn btn-link text-sm font-semibold text-primary no-underline hover:underline"
                    onClick={() =>
                      (
                        document.getElementById("forgot_modal") as HTMLDialogElement
                      ).showModal()
                    }
                  >
                    Oublié ?
                  </button>
                </div>
                <div className="relative mt-2">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"
                    size={20}
                  />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="input input-bordered w-full bg-transparent border-[#ead2e6] pr-11 pl-10 rounded-lg h-15 text-lg font-medium outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />

                  {/* Icône œil — fondu entre Eye ↔ EyeOff */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-primary"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={showPassword ? "eye-off" : "eye-on"}
                        className="block"
                        initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.6, rotate: 10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Bouton Se connecter — flèche animée au survol ────────────── */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary h-14 w-full text-lg font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              initial="rest"
              whileHover={isLoading ? "rest" : "hover"}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {isLoading ? (
                <span className="loading loading-spinner" />
              ) : (
                <>
                  Se connecter
                  <motion.span
                    variants={arrowVariants}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <ArrowRight size={22} />
                  </motion.span>
                </>
              )}
            </motion.button>

            {/* Barre décorative bas de carte */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-2xl bg-linear-to-r from-primary via-purple-600 to-green-600" />
          </form>

          {/* Badge SSL */}
          <div className="flex w-full justify-center mt-8">
            <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white shadow-sm border border-gray-100 text-sm font-bold text-gray-500">
              <ShieldCheck className="text-green-600" size={18} />
              Connexion sécurisée 
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />

      {/* Modal — mot de passe oublié */}
      <dialog id="forgot_modal" className="modal">
        <div className="modal-box rounded-xl">
          <h3 className="font-black text-xl text-primary">
            Récupération de compte
          </h3>
          <p className="py-4 text-gray-600 leading-relaxed">
            Veuillez contacter l&apos;administrateur pour réinitialiser vos accès.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-primary rounded-xl px-8">Fermer</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
