import { useEffect, useRef, useState } from "react";
import {
  CircleCheck,
  Dot,
  FileText,
  SquareRoundCorner,
  TriangleAlert,
  Zap,
  History,
  Layers,
  GraduationCap,
  ShieldCheck,
  ShieldCogCorner,
  Percent,
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { motion, useInView, animate } from "framer-motion";

// ─── Compteur animé ────────────────────────────────────────────────────────────
function Counter({ target, suffix = "%" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, target, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return controls.stop;
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}

// ─── Variantes partagées ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0 },
};
const fadeRight = {
  hidden: { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0 },
};

const TRANSITION_BASE = { duration: 0.45, ease: "easeOut" } as const;
const VIEWPORT        = { once: true, margin: "-60px" } as const;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="bg-base-100 overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <div className="px-[6%]">
        <div className="flex justify-center bg-white/30">
          <div className="flex items-center justify-center md:justify-between top-0 left-0 shrink-0 fixed z-50 backdrop-blur-sm w-full py-6 px-10 border-b border-base-300">
            <div className="bg-white rounded-xl p-3 shadow-sm flex justify-center items-center">
              <Link to="/" aria-label="Accueil">
                <img src="/apple-icon.png" alt="Logo" width={70} height={70} />
              </Link>
              <p className="text-md md:text-xl font-bold text-primary ml-2">
                GAAP-UVCI
              </p>
            </div>
            <Link
              to="/login"
              className="hidden md:flex items-center justify-center btn btn-primary btn-md rounded-sm px-8 transition-all hover:scale-105"
              aria-label="Se connecter au portail"
            >
              Se connecter au portail
            </Link>
          </div>
        </div>

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <div className="flex justify-center items-center py-12 md:py-20 px-[6%] mt-30 md:mt-20 max-w-7xl mx-auto">
          <div className="max-w-7xl w-full flex flex-col md:flex-row items-center justify-between">

            {/* Texte — fade-in up */}
            <motion.div
              className="w-full md:w-1/2 flex justify-center flex-col items-center md:items-start text-center md:text-left md:mr-2"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h1 className="text-4xl md:text-5xl font-semibold mt-4 leading-tight">
                <span className="text-primary font-bold">GAAP-UVCI</span> :{" "}
                <span className="text-primary font-bold">G</span>estion{" "}
                <span className="text-primary font-bold">A</span>utomatisée des{" "}
                <span className="text-primary font-bold">A</span>ctivités{" "}
                <span className="text-primary font-bold">P</span>édagogiques de
                l&apos;
                <span className="text-primary font-bold">U</span>niversité{" "}
                <span className="text-primary font-bold">V</span>irtuelle de{" "}
                <span className="text-primary font-bold">C</span>ôte{" "}
                d&apos;
                <span className="text-primary font-bold">I</span>voire
              </h1>
              <p className="text-base md:text-lg mt-4 opacity-80 max-w-xl">
                Une architecture académique de pointe pour une transparence
                absolue. Automatisez le suivi, validez avec rigueur et accédez à
                vos rapports en un clic.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
                <Link
                  to="/login"
                  className="btn btn-lg btn-primary shadow-primary shadow-lg px-8 rounded-md"
                  aria-label="Voir le système"
                >
                  Voir le système
                </Link>
                <a
                  href="#barème"
                  className="btn btn-lg px-8 rounded-md btn-default"
                  aria-label="Voir le barème"
                >
                  Barème
                </a>
              </div>
            </motion.div>

            {/* Image — fade-in depuis la droite */}
            <motion.div
              className="w-full md:w-1/2 flex justify-center items-center mt-12 md:mt-0 md:ml-9"
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
            >
              <div className="bg-white rounded-xl p-4 shadow-2xl">
                <img
                  src="/Uvci-img1.png"
                  alt="Aperçu du système GAAP-UVCI"
                  width={400}
                  height={400}
                  className="object-cover rounded-xl"
                  id="image"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Défis / Excellence ─────────────────────────────────────────────── */}
      <div className="flex justify-center mt-16 bg-white py-12 px-5 w-full max-w-7xl mx-auto md:flex-row flex-col gap-0">

        {/* Défis — slide depuis la gauche */}
        <motion.div
          className="md:w-1/2 bg-gray-100 rounded-t-2xl md:rounded-t-none md:rounded-l-2xl p-10 flex flex-col justify-center"
          variants={fadeLeft}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          transition={TRANSITION_BASE}
        >
          <div className="flex items-center gap-3 mb-6">
            <TriangleAlert className="text-error w-10 h-10" />
            <h2 className="text-3xl font-bold">Les Défis Actuels</h2>
          </div>
          <ul className="space-y-4">
            {[
              "Erreurs de calcul manuel impactant la rémunération.",
              "Absence de traçabilité en temps réel des vacations.",
              "Processus de validation lent et opaque.",
            ].map((text) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-error/20 text-error rounded-full flex items-center justify-center">
                  <Dot size={24} />
                </div>
                <span className="text-lg">{text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Excellence — slide depuis la droite */}
        <motion.div
          className="md:w-1/2 bg-primary rounded-b-2xl md:rounded-b-none md:rounded-r-2xl p-10 text-white flex flex-col justify-center"
          variants={fadeRight}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          transition={{ ...TRANSITION_BASE, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <CircleCheck className="text-accent w-10 h-10" />
            <h2 className="text-3xl font-bold">L&apos;Excellence UVCI</h2>
          </div>
          <ul className="space-y-4">
            {[
              { icon: <Zap size={20} />,              text: "Calcul automatisé et précis des heures." },
              { icon: <SquareRoundCorner size={20} />, text: "Tableau de bord de suivi en temps réel." },
              { icon: <FileText size={20} />,          text: "Génération instantanée des rapports officiels." },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 text-white bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                  {icon}
                </div>
                <span className="text-lg">{text}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* ── Barème ─────────────────────────────────────────────────────────── */}
      <div className="py-16">

        {/* Titre section */}
        <motion.div
          className="flex justify-center items-center flex-col px-4"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          transition={TRANSITION_BASE}
        >
          <h3
            className="text-4xl md:text-5xl font-bold mb-5 text-center text-primary"
            id="barème"
          >
            Barème de Calcul Intelligent
          </h3>
          <p className="text-center max-w-2xl opacity-80">
            Notre algorithme applique strictement les règles de l&apos;UVCI pour
            garantir l&apos;équité académique. D&apos;ailleurs{" "}
            <span className="text-primary font-bold">l&apos;administrateur</span>{" "}
            peut modifier ces règles.
          </p>
        </motion.div>

        {/* 3 cartes barème — fade-up + hover lift */}
        <div className="mt-10 px-[6%]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Carte 1 — Unité de Mesure */}
            <motion.div
              className="bg-white rounded-xl p-8 shadow-sm border border-base-200 cursor-default"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              transition={{ ...TRANSITION_BASE, delay: 0 }}
              whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(0,0,0,0.10)" }}
            >
              <History className="text-accent w-12 h-12 mb-4" />
              <h3 className="text-2xl text-primary font-bold mb-2">
                Unité de Mesure
              </h3>
              <p className="mb-4 opacity-70">Standardisation temporelle :</p>
              <div className="bg-base-200 rounded-xl font-bold py-4 flex justify-center items-center flex-wrap flex-col md:flex-row">
                <span className="text-primary">4 Séquences</span>
                <span className="mx-2 text-black">=</span>
                <span className="text-accent">1 Heure</span>
              </div>
            </motion.div>

            {/* Carte 2 — Complexité Support */}
            <motion.div
              className="bg-white rounded-xl p-8 shadow-sm border border-base-200 cursor-default"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              transition={{ ...TRANSITION_BASE, delay: 0.1 }}
              whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(0,0,0,0.10)" }}
            >
              <Layers className="text-primary w-12 h-12 mb-4" />
              <h3 className="text-2xl text-primary font-bold mb-2">
                Complexité Support
              </h3>
              <div className="flex flex-wrap gap-2 my-4">
                <span className="badge badge-soft badge-success">Niveau 1</span>
                <span className="badge badge-soft badge-warning">Niveau 2</span>
                <span className="badge badge-soft badge-error">Niveau 3</span>
              </div>
              <p className="text-sm opacity-70">
                Le coefficient de charge s&apos;adapte à la nature pédagogique
                du support.
              </p>
            </motion.div>

            {/* Carte 3 — Taux de Pondération + compteurs animés */}
            <motion.div
              className="bg-white rounded-xl p-8 shadow-sm border border-base-200 cursor-default"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              transition={{ ...TRANSITION_BASE, delay: 0.2 }}
              whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(0,0,0,0.10)" }}
            >
              <Percent className="text-primary w-12 h-12 mb-4" />
              <h3 className="text-2xl text-primary font-bold mb-4">
                Taux de Pondération
              </h3>
              <div className="space-y-4">
                <div className="w-full">
                  <div className="flex justify-between mb-1 text-sm font-medium">
                    <span>Conception</span>
                    <span className="font-bold text-primary">
                      <Counter target={100} />
                    </span>
                  </div>
                  <progress
                    className="progress progress-primary w-full"
                    value="100"
                    max="100"
                  />
                </div>
                <div className="w-full">
                  <div className="flex justify-between mb-1 text-sm font-medium">
                    <span>Mise à jour</span>
                    <span className="font-bold text-accent">
                      <Counter target={50} />
                    </span>
                  </div>
                  <progress
                    className="progress progress-accent w-full"
                    value="50"
                    max="100"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Rôles ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-[6%] mt-12 bg-white py-10">
          {[
            {
              icon:  <ShieldCogCorner className="text-primary w-16 h-16 mb-4" />,
              title: "Administrateur",
              color: "text-primary",
              desc:  "Supervision technique, contrôle des accès et configuration des paramètres de calcul globaux",
              delay: 0,
            },
            {
              icon:  <ShieldCheck className="text-accent w-16 h-16 mb-4" />,
              title: "Secrétaire",
              color: "text-accent",
              desc:  "Gestion administrative, validation des activités numériques et préparation automatisée des états de paiement",
              delay: 0.1,
            },
            {
              icon:  <GraduationCap className="text-primary w-16 h-16 mb-4" />,
              title: "Enseignant",
              color: "text-primary",
              desc:  "Espace personnel pour le suivi des volumes horaires et le téléchargement des récapitulatifs individuels",
              delay: 0.2,
            },
          ].map((role) => (
            <motion.div
              key={role.title}
              className="flex flex-col items-center text-center p-6"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              transition={{ ...TRANSITION_BASE, delay: role.delay }}
            >
              {role.icon}
              <h4 className={`${role.color} text-xl font-bold mb-2`}>
                {role.title}
              </h4>
              <p className="text-sm opacity-70">{role.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
