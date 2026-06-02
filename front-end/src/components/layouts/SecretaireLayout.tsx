import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, UserPlus, BookOpen, CheckSquare,
  FileBarChart, LogOut, Menu, HelpCircle, MessageSquare, X,
  Bell, AlertTriangle, RefreshCw,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { adminService } from "../../services/admin.service";
import UserModal from "../../components/UserModal";
import type { User } from "../../types";

const navItems = [
  { name: "Tableau de Bord",            href: "/secretaire/dashboard",  icon: LayoutDashboard },
  { name: "Enregistrement Enseignants", href: "/secretaire/enseignants", icon: UserPlus },
  { name: "Gestion des Cours",          href: "/secretaire/cours",       icon: BookOpen },
  { name: "Saisie & Validation",        href: "/secretaire/validation",  icon: CheckSquare },
  { name: "États & Exports",            href: "/secretaire/exports",     icon: FileBarChart },
];

interface DepassementItem {
  nom: string;
  prenom: string;
  departement: string;
  quota: number;
  done: number;
  exceed: number;
}

export default function SecretaireLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [depassements, setDepassements] = useState<DepassementItem[]>([]);
  const [depassementCount, setDepassementCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDashboard = async () => {
    setNotifLoading(true);
    try {
      const data = await adminService.getDashboard();
      const d = data?.data ?? data;
      setDepassementCount(d?.depassementsCritiques ?? 0);
      setDepassements(d?.enseignantsDepassement ?? []);
    } catch {
      // silently fail — dashboard may be unavailable
    } finally {
      setNotifLoading(false);
    }
  };

  const initials = user?.nom?.substring(0, 2).toUpperCase() || "SP";

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  const handleProfileSave = async (data: { nom?: string; email?: string; password?: string }) => {
    try {
      await adminService.updateProfile(data);
    } catch {
      // continue even if API fails
    } finally {
      if (user) {
        const updated = { ...user, ...data };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      }
      setIsProfileModalOpen(false);
    }
  };

  return (
    <div className="drawer lg:drawer-open h-screen overflow-hidden bg-base-200">
      <input id="secretaire-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col overflow-y-auto">
        {/* Navbar */}
        <header className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-300/30 px-4 lg:px-8 h-20 sticky top-0 z-30 w-full flex justify-between">
          <div className="flex items-center gap-4">
            <label htmlFor="secretaire-drawer" className="btn btn-ghost lg:hidden drawer-button">
              <Menu size={24} className="text-primary" />
            </label>
            <div className="hidden lg:flex items-center justify-center mx-4 border-2 border-primary shadow-lg shadow-primary/20 rounded-md">
              <h2 className="text-xl font-bold px-3 py-2 text-primary uppercase tracking-widest">
                Interface Secrétaire
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifPanel((v) => !v)}
                className="btn btn-ghost btn-circle btn-sm relative"
              >
                <Bell size={20} className={depassementCount > 0 ? "text-error" : "text-base-content/70"} />
                {depassementCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                    {depassementCount > 9 ? "9+" : depassementCount}
                  </span>
                )}
              </button>

              {showNotifPanel && (
                <div className="fixed top-20 left-2 right-2 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:w-80 sm:mt-2 bg-base-100 rounded-xl shadow-2xl border border-base-300 z-50 overflow-hidden">
                  <div className="p-4 border-b border-base-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-error" />
                      <h3 className="font-bold text-sm">Dépassements d'heures</h3>
                      {depassementCount > 0 && (
                        <span className="badge badge-error badge-sm font-bold">{depassementCount}</span>
                      )}
                    </div>
                    <button
                      onClick={loadDashboard}
                      disabled={notifLoading}
                      className="btn btn-ghost btn-sm btn-circle"
                    >
                      <RefreshCw size={14} className={notifLoading ? "animate-spin" : ""} />
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {depassements.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-sm text-neutral font-medium">Aucun dépassement détecté</p>
                        <p className="text-sm text-neutral/60 mt-1">Tous les quotas sont respectés</p>
                      </div>
                    ) : (
                      depassements.map((d, i) => (
                        <div key={i} className="p-3 border-b border-base-200/60 last:border-0 hover:bg-base-200/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-sm">{d.nom} {d.prenom}</p>
                              <p className="text-sm text-neutral">{d.departement}</p>
                            </div>
                            <span className="badge badge-error badge-sm font-bold shrink-0">
                              +{Math.round(d.exceed)}h
                            </span>
                          </div>
                          <div className="flex gap-3 mt-1 text-sm text-neutral">
                            <span>Quota: {d.quota}h</span>
                            <span>Réalisé: <span className="font-bold text-error">{Math.round(d.done)}h</span></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 border-t border-base-200">
                    <Link
                      to="/secretaire/dashboard"
                      onClick={() => setShowNotifPanel(false)}
                      className="btn btn-primary btn-sm w-full normal-case font-bold rounded-xl"
                    >
                      Voir le tableau de bord
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setIsSupportModalOpen(true)} className="btn btn-ghost btn-circle btn-sm">
              <HelpCircle size={20} className="text-base-content/70" />
            </button>

            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-base-300">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-base-content">{user?.nom || "Secrétaire"}</p>
                <p className="text-[10px] badge bg-primary/10 text-primary border-none font-bold uppercase tracking-wide mt-0.5">
                  {user?.role?.toLowerCase() || "secrétaire"}
                </p>
              </div>
              <div
                onClick={() => setIsProfileModalOpen(true)}
                className="avatar cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full ring-2 ring-primary/20 ring-offset-2 bg-primary text-primary-content flex items-center justify-center font-bold">
                  <span>{initials}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 flex-1">
          <div key={location.pathname} className="animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40">
        <label htmlFor="secretaire-drawer" className="drawer-overlay"></label>
        <aside className="w-80 min-h-full bg-primary text-primary-content flex flex-col shadow-xl relative">
          <div className="flex flex-col items-center py-8 shrink-0">
            <div className="absolute right-4 top-4 lg:hidden">
              <label htmlFor="secretaire-drawer" className="btn btn-ghost btn-circle text-primary-content hover:bg-white/20">
                <X size={24} />
              </label>
            </div>
            <div className="bg-white rounded-xl py-3 px-6 shadow-sm flex justify-center items-center flex-col">
              <img src="/apple-icon.png" alt="Logo" width={60} height={60} />
              <p className="text-md font-black text-primary mt-1 tracking-wider">GAAP-UVCI</p>
            </div>
          </div>

          {depassementCount > 0 && (
            <div className="mx-4 mb-2 bg-error/20 border border-error/30 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-error shrink-0" />
              <p className="text-sm font-bold text-white">
                {depassementCount} dépassement{depassementCount > 1 ? "s" : ""} critique{depassementCount > 1 ? "s" : ""}
              </p>
            </div>
          )}

          <nav className="flex-1 px-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all ${
                    isActive ? "bg-white text-primary font-bold shadow-md" : "hover:bg-white/10 text-white/80"
                  }`}
                >
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-white/10 space-y-1">
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="flex items-center gap-3 px-5 py-3 text-white/80 hover:bg-white/10 w-full rounded-xl transition-colors"
            >
              <HelpCircle size={18} />
              <span className="text-sm">Assistance</span>
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-3 px-5 py-3 text-white/70 hover:bg-error hover:text-error-content w-full rounded-xl transition-all"
            >
              <LogOut size={18} />
              <span className="text-sm font-bold">Déconnexion</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-base-100 rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                <LogOut size={22} className="text-error" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-base-content">Confirmer la déconnexion</h3>
                <p className="text-sm text-neutral mt-0.5">Votre session sera fermée.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="btn btn-ghost flex-1 rounded-xl normal-case font-bold"
              >
                Rester connecté
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-error flex-1 rounded-xl normal-case font-bold text-white border-none"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSupportModalOpen(false)}></div>
          <div className="bg-base-100 w-full max-w-sm rounded-box shadow-2xl relative z-50 overflow-hidden border border-base-300/30 animate-scale-in">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-xl font-bold text-base-content mb-3">Assistance Technique</h3>
              <p className="text-sm opacity-70 leading-relaxed">
                Pour tout problème technique ou difficulté dans la gestion des heures, veuillez contacter
                l'équipe de développement de l'application.
              </p>
              <button onClick={() => setIsSupportModalOpen(false)} className="btn btn-primary w-full mt-6 rounded-xl font-bold shadow-md">
                Continuer
              </button>
            </div>
            <button onClick={() => setIsSupportModalOpen(false)} className="absolute top-4 right-4 text-base-content/40 hover:text-base-content/70 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <UserModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        title="Profil Secrétaire"
        onSave={handleProfileSave}
      />
    </div>
  );
}
