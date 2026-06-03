/**
 * PageAnimate.tsx — Animation de transition entre les pages
 *
 * Ce composant enveloppe le contenu d'une page et lui applique
 * une animation d'entrée douce : la page apparaît en fondu
 * en remontant légèrement (fade-in + slide-up).
 *
 * Il utilise la bibliothèque Framer Motion qui est déjà installée
 * dans le projet pour les animations fluides.
 *
 * ANIMATION :
 * - État initial : transparent (opacity 0) et légèrement en bas (y: 10px)
 * - État final   : visible (opacity 1) et à sa position normale (y: 0)
 * - Durée        : 0.4 secondes avec accélération en fin
 *
 * UTILISATION dans App.tsx :
 * <PageAnimate>
 *   <Suspense>
 *     <Routes>...</Routes>
 *   </Suspense>
 * </PageAnimate>
 */
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Props : children = tout ce qui sera animé à l'entrée */
export default function PageAnimate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}       // Départ : invisible, 10px vers le bas
      animate={{ opacity: 1, y: 0 }}         // Arrivée : visible, position normale
      transition={{ duration: 0.4, ease: "easeOut" }} // 0.4s avec décélération
    >
      {children}
    </motion.div>
  );
}
