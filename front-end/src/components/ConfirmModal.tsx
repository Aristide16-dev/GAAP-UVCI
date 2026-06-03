/**
 * ConfirmModal — Fenêtre de confirmation réutilisable
 *
 * Ce composant affiche une petite boîte de dialogue centrée sur l'écran
 * pour demander confirmation avant une action importante (suppression,
 * modification critique, etc.).
 *
 * CARACTÉRISTIQUES :
 * - Centré par rapport à la hauteur de l'écran (viewport) via position:fixed
 * - Pas d'arrière-plan assombri (le contenu de la page reste visible)
 * - Rendu en dehors du DOM normal via createPortal → toujours au premier plan
 * - Fonctionne dans toutes les pages, même dans les layouts complexes
 *
 * COULEURS DISPONIBLES (prop confirmColor) :
 * - "error"   → rouge   (suppression, action dangereuse)
 * - "warning" → orange  (modification importante)
 * - "success" → vert    (confirmation positive)
 * - "info"    → bleu    (action neutre, défaut)
 * Raccourci : isDestructive={true} équivaut à confirmColor="error"
 *
 * EXEMPLE D'UTILISATION :
 * <ConfirmModal
 *   isOpen={open}
 *   title="Supprimer cet enseignant ?"
 *   message="Cette action est irréversible."
 *   confirmText="Supprimer"
 *   isDestructive
 *   onConfirm={handleDelete}
 *   onCancel={() => setOpen(false)}
 * />
 */
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

/** Toutes les propriétés acceptées par le composant ConfirmModal */
export interface ConfirmModalProps {
  /** Afficher ou masquer le modal */
  isOpen: boolean;
  /** Titre affiché en haut du modal */
  title: string;
  /** Message explicatif sous le titre */
  message: string;
  /** Texte du bouton de confirmation (défaut : "Confirmer") */
  confirmText?: string;
  /** Couleur du thème : "error" | "warning" | "success" | "info" */
  confirmColor?: string;
  /** Raccourci pour confirmColor="error" */
  isDestructive?: boolean;
  /** Fonction appelée quand l'utilisateur clique sur le bouton de confirmation */
  onConfirm: () => void;
  /** Fonction appelée quand l'utilisateur clique sur Annuler */
  onCancel: () => void;
  /** Ignoré — conservé pour compatibilité avec l'ancien code */
  anchorY?: number;
}

/**
 * Retourne les classes CSS Tailwind selon la couleur choisie.
 * Chaque couleur a une variante pour l'icône, le fond de l'icône,
 * et le bouton de confirmation.
 */
function resolveColorClasses(color: string) {
  switch (color) {
    case "error":
      return {
        icon: "text-red-600",
        bg:   "bg-red-50",
        btn:  "bg-red-600 hover:bg-red-700",
      };
    case "warning":
      return {
        icon: "text-orange-600",
        bg:   "bg-orange-50",
        btn:  "bg-orange-600 hover:bg-orange-700",
      };
    case "success":
      return {
        icon: "text-green-600",
        bg:   "bg-green-50",
        btn:  "bg-green-600 hover:bg-green-700",
      };
    default: // "info"
      return {
        icon: "text-blue-600",
        bg:   "bg-blue-50",
        btn:  "bg-blue-600 hover:bg-blue-700",
      };
  }
}

/**
 * Composant ConfirmModal
 * Rendu directement dans document.body pour être au-dessus de tout le reste.
 * Centré sur l'écran, sans arrière-plan sombre.
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText  = "Confirmer",
  confirmColor,
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Ne rien afficher si le modal est fermé
  if (!isOpen) return null;

  // Déterminer la couleur finale : confirmColor > isDestructive > bleu par défaut
  const color = confirmColor ?? (isDestructive ? "error" : "info");
  const { icon, bg, btn } = resolveColorClasses(color);

  // createPortal place le modal directement dans <body>
  // pour qu'il soit toujours au premier plan, peu importe le layout
  return createPortal(
    // Conteneur fixe qui couvre tout l'écran et centre le modal
    // Pas d'arrière-plan : l'utilisateur voit la page derrière
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">

      {/* Boîte du modal — pointer-events-auto pour que les clics fonctionnent */}
      <div
        className="pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-5 mx-4"
        style={{ position: "relative" }}
      >
        {/* En-tête : icône colorée + titre */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
            <AlertTriangle size={22} className={icon} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>

        {/* Message descriptif */}
        <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
          {message}
        </p>

        {/* Boutons d'action */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="btn btn-ghost flex-1 rounded-xl normal-case text-sm"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`btn flex-1 rounded-xl normal-case text-white border-none text-sm ${btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ConfirmModal;
