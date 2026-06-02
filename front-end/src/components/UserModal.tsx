import { X, UserRoundPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserForm from "./UserForm";
import type { User } from "../types";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: Partial<User> & { password?: string }) => void;
  title: string;
  isProfileEdit?: boolean;
}

export default function UserModal({
  isOpen,
  onClose,
  user,
  onSave,
  title,
  isProfileEdit = false,
}: UserModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="relative bg-linear-to-br from-primary to-purple-700 p-5 md:p-8 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  {user?.nom ? (
                    user.nom
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()
                  ) : (
                    <UserRoundPlus />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{title}</h2>
                  <p className="text-white/80 text-sm mt-1">
                    {user?.nom
                      ? `Modifier les informations de ${user.nom}`
                      : "Remplissez les informations du nouveau compte"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-8 max-h-[70vh] sm:max-h-[calc(100vh-240px)] overflow-y-auto">
              <UserForm
                key={user?.id || "new"}
                user={user}
                onSave={onSave}
                onClose={onClose}
                isProfileEdit={isProfileEdit}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
