import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  FolderArchive,
  HelpCircle,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Bell,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import UserModal from "../../components/UserModal";
import { toast } from "react-toastify";
import type { User } from "../../types";
import { adminService } from "../../services/admin.service";
import api from "../../api/axios";

const navItems = [
  { name: "Mon Tableau de Bord",              href: "/enseignant/dashboard",    icon: LayoutDashboard },
  { name: "Mes Activités Pédagogiques",       href: "/enseignant/activites",    icon: BookOpen },
  { name: "Suivi des Heures Complémentaires", href: "/enseignant/suivi-heures", icon: CalendarDays },
  { name: "Mes Documents & Exports",          href: "/enseignant/exports",      icon: FolderArchive },
];

export default function EnseignantLayout() {
  const { user, logout, loading, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [heuresCompl, setHeuresCompl] = useState(0);
  const [quotaMax, setQuotaMax] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const idEns = (user as any)?.id_ens;
  const idGrade = (user as any)?.id_grade;

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!idEns || !idGrade) return;
    loadQuotaStatus();
    const interval = setInterval(() => loadQuotaStatus(), 60000);
    return () => clearInterval(interval);
  }, [idEns, idGrade]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadQuotaStatus = async () => {
    if (!idEns || !idGrade) return;
    setNotifLoading(true);
    try {
      const [volRes, gradesRes] = await Promise.all([
        api.get(`/enseignants/${idEns}/volume-horaire`),
        api.get("/grades"),
      ]);
      const vol = volRes.data.data ?? null;
      const grades: any[] = gradesRes.data.data ?? [];
      const grade = grades.find((g) => Number(g.id_grade) === Number(idGrade));
      const quota = grade?.quota_annuel ?? 192;
      const total = Number(vol?.volume_total_heures ?? 0);
      setQuotaMax(quota);
      setHeuresCompl(Math.max(total - quota, 0));
    } catch {
      // silently fail — ne pas bloquer le layout
    } finally {
      setNotifLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const fullName = user?.nom || "Enseignant";
  const initials = fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  const handleUpdateProfile = async (data: Partial<User> & { password?: string }) => {
    try {
      const response = await adminService.updateProfile({
        nom: data.nom,
        email: data.email,
        password: data.password,
      });
      if (response.data) {
        updateUser({ nom: response.data.nom, email: response.data.email });
      }
      toast.success("Profil mis à jour avec succès");
      setIsProfileModalOpen(false);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Erreur lors de la mise à jour du profil");
    }
  };

  return (
    <div className="drawer lg:drawer-open h-screen overflow-hidden bg-base-200">
      <input id="enseignant-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col overflow-y-auto">
        {/* Navbar */}
        <header className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-300/30 px-4 lg:px-8 h-20 sticky top-0 z-30 w-full flex justify-between">
          <div className="flex items-center gap-4">
            <label htmlFor="enseignant-drawer" className="btn btn-ghost lg:hidden drawer-button">
              <Menu size={24} className="text-primary" />
            </label>
            <div className="hidden lg:flex items-center justify-center mx-4 border-2 border-primary shadow-lg shadow-primary/20 rounded-md">
              <h2 className="text-xl font-bold px-3 py-2 text-primary uppercase tracking-widest">
                Interface Enseignant
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cloche quota */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifPanel((v) => !v)}
                className="btn btn-ghost btn-circle btn-sm relative"
              >
                <Bell
                  size={20}
                  className={heuresCompl > 0 ? "text-warning" : "text-base-content/70"}
                />
                {heuresCompl > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    !
                  </span>
                )}
              </button>

              {showNotifPanel && (
                <div className="fixed left-1/2 -translate-x-1/2 top-[5.5rem] sm:absolute sm:translate-x-0 sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-2rem)] max-w-[19rem] bg-base-100 rounded-xl shadow-2xl border border-base-300 z-50 overflow-hidden">
                  <div className="p-4 border-b border-base-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        size={16}
                        className={heuresCompl > 0 ? "text-warning" : "text-base-content/40"}
                      />
                      <h3 className="font-bold text-sm">Quota d'heures</h3>
                    </div>
                    <button
                      onClick={loadQuotaStatus}
                      disabled={notifLoading}
                      className="btn btn-ghost btn-sm btn-circle"
                    >
                      <RefreshCw size={14} className={notifLoading ? "animate-spin" : ""} />
                    </button>
                  </div>

                  <div className="p-4">
                    {heuresCompl > 0 ? (
                      <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 space-y-1">
                        <p className="font-bold text-sm text-warning">Quota dépassé</p>
                        <p className="text-sm text-base-content/70">
                          Vous avez{" "}
                          <span className="font-black text-warning">
                            +{heuresCompl.toFixed(1)}h
                          </span>{" "}
                          complémentaires au-delà du quota de{" "}
                          <span className="font-bold">{quotaMax}h</span>.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-sm font-medium text-neutral">Quota respecté</p>
                        <p className="text-sm text-neutral/60 mt-1">
                          Aucun dépassement détecté
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-base-200">
                    <Link
                      to="/enseignant/suivi-heures"
                      onClick={() => setShowNotifPanel(false)}
                      className="btn btn-primary btn-sm w-full normal-case font-bold rounded-xl"
                    >
                      Voir le suivi des heures
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="btn btn-ghost btn-circle btn-sm"
            >
              <HelpCircle size={20} className="text-base-content/60" />
            </button>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="group flex items-center gap-3 pl-4 border-l border-base-300/50 cursor-pointer py-1 px-2 rounded-xl hover:bg-base-300/30 transition-all"
            >
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-base-content leading-none group-hover:text-primary transition-colors">
                  {fullName}
                </p>
                <p className="text-[10px] badge bg-primary/10 text-primary border-none font-bold uppercase mt-1 tracking-wide">
                  {user?.role?.toLowerCase() || "enseignant"}
                </p>
              </div>
              <div className="avatar placeholder">
                <div className="w-10 h-10 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100 bg-primary text-primary-content flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                  <span>{initials}</span>
                </div>
              </div>
            </button>
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
        <label htmlFor="enseignant-drawer" className="drawer-overlay"></label>

        <aside className="w-80 min-h-full bg-primary text-primary-content flex flex-col shadow-xl relative">
          <div className="absolute right-4 top-4 lg:hidden">
            <label
              htmlFor="enseignant-drawer"
              className="btn btn-ghost btn-circle text-primary-content hover:bg-white/20"
            >
              <X size={24} />
            </label>
          </div>

          <div className="flex flex-col items-center py-8 shrink-0">
            <div className="bg-white rounded-xl py-3 px-6 shadow-sm flex justify-center items-center flex-col">
              <img src="/apple-icon.png" alt="Logo" width={60} height={60} />
              <p className="text-md font-black text-primary mt-1 tracking-wider">GAAP-UVCI</p>
            </div>
          </div>

          {heuresCompl > 0 && (
            <div className="mx-4 mb-2 bg-warning/20 border border-warning/30 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning shrink-0" />
              <p className="text-sm font-bold text-white">
                +{heuresCompl.toFixed(1)}h complémentaires identifiées
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
                    isActive
                      ? "bg-white text-primary font-bold shadow-md"
                      : "hover:bg-white/10 text-white/80"
                  }`}
                >
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-white/10 space-y-1">
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="flex items-center gap-3 px-5 py-3 text-white/80 hover:bg-white/10 w-full rounded-xl transition-colors text-left"
            >
              <HelpCircle size={18} />
              <span className="text-sm font-medium">Assistance</span>
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-3 px-5 py-3 text-white/70 hover:bg-error hover:text-error-content w-full rounded-xl transition-all text-left"
            >
              <LogOut size={18} />
              <span className="text-sm font-bold">Déconnexion</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Modal confirmation déconnexion */}
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

      {/* Modal assistance */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsSupportModalOpen(false)}
          ></div>
          <div className="bg-base-100 w-full max-w-sm rounded-box shadow-2xl relative z-50 overflow-hidden border border-base-300/30 animate-scale-in">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-xl font-bold text-base-content mb-3">Besoin d'aide ?</h3>
              <p className="text-sm opacity-70 leading-relaxed">
                Pour toute assistance technique concernant la saisie ou le suivi de vos heures,
                veuillez contacter l'équipe de développement. Nous restons à votre entière
                disposition.
              </p>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="btn btn-primary w-full mt-6 rounded-xl font-bold shadow-md"
              >
                J'ai compris
              </button>
            </div>
            <button
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute top-4 right-4 text-base-content/40 hover:text-base-content/70 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <UserModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user as User | null}
        title="Modifier mon profil"
        onSave={handleUpdateProfile}
        isProfileEdit={true}
      />
    </div>
  );
}
