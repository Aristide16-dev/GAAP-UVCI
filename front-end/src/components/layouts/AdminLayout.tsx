import { useState, useEffect, useRef } from "react";
import {
  UserRoundCog, HandCoins, GraduationCap, Calculator,
  HelpCircle, LogOut, Menu, X, MessageSquare, Database,
  Bell, AlertTriangle, ChevronRight, RefreshCw,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import UserModal from "../../components/UserModal";
import { toast } from "react-toastify";
import type { User } from "../../types";
import { adminService } from "../../services/admin.service";

const navItems = [
  { name: "Gestion des Comptes", href: "/admin/dashboard", icon: UserRoundCog },
  { name: "Paramétrage Académique", href: "/admin/parametrage", icon: GraduationCap },
  { name: "Paramètres de Calcul", href: "/admin/calcul", icon: Calculator },
  { name: "Gestion des Taux", href: "/admin/taux", icon: HandCoins },
  { name: "Référentiels", href: "/admin/referentiels", icon: Database },
];

interface TeacherAlert {
  id_ens: number;
  nom: string;
  prenom: string;
  departement: string;
  quota: number;
  done: number;
  exceed: number;
}

interface NotifState {
  count: number;
  teachers: TeacherAlert[];
  anneeAcademique: string | null;
  loading: boolean;
}

export default function AdminLayout() {
  const { user, logout, loading, isAdmin, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const notifPanelRef = useRef<HTMLDivElement>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifState, setNotifState] = useState<NotifState>({
    count: 0, teachers: [], anneeAcademique: null, loading: true,
  });

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/login");
  }, [isAdmin, loading, navigate]);

  // Load notification data
  useEffect(() => {
    if (!isAdmin) return;
    let isMounted = true;
    const loadNotifs = async (silent = false) => {
      try {
        if (!silent) setNotifState((p) => ({ ...p, loading: true }));
        const res = await adminService.getDashboard();
        if (isMounted && res?.data) {
          setNotifState({
            count: res.data.depassementsCritiques ?? 0,
            teachers: res.data.enseignantsDepassement ?? [],
            anneeAcademique: res.data.anneeAcademique ?? null,
            loading: false,
          });
        }
      } catch {
        if (isMounted) setNotifState((p) => ({ ...p, loading: false }));
      }
    };
    loadNotifs();
    const interval = setInterval(() => loadNotifs(true), 60000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [isAdmin]);

  // Close notif panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    if (showNotifPanel) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifPanel]);

  const handleRefreshNotifs = async () => {
    setNotifState((p) => ({ ...p, loading: true }));
    try {
      const res = await adminService.getDashboard();
      if (res?.data) {
        setNotifState({
          count: res.data.depassementsCritiques ?? 0,
          teachers: res.data.enseignantsDepassement ?? [],
          anneeAcademique: res.data.anneeAcademique ?? null,
          loading: false,
        });
        toast.success("Notifications actualisées", { toastId: "notif-refresh", autoClose: 1500 });
      }
    } catch {
      setNotifState((p) => ({ ...p, loading: false }));
      toast.error("Impossible d'actualiser les notifications");
    }
  };

  const handleNotifyTeachers = async () => {
    setNotifying(true);
    try {
      await import("../../services/notification.service").then(({ notificationService }) =>
        notificationService.notifyExceedingTeachers()
      );
      toast.success("Enseignants notifiés avec succès");
      setShowNotifPanel(false);
    } catch {
      toast.error("Erreur lors de l'envoi des notifications");
    } finally {
      setNotifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const fullName = user?.nom || "Administrateur";
  const initials = fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const handleUpdateProfile = async (data: Partial<User> & { password?: string }) => {
    try {
      const response = await adminService.updateProfile({ nom: data.nom, email: data.email, password: data.password });
      if (response.data) updateUser({ nom: response.data.nom, email: response.data.email });
      toast.success("Profil mis à jour avec succès");
      setIsProfileModalOpen(false);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Erreur lors de la mise à jour du profil");
    }
  };

  return (
    <div className="drawer lg:drawer-open h-screen overflow-hidden bg-base-100">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="navbar bg-white/90 backdrop-blur-md border-b border-base-300 px-4 lg:px-8 h-20 sticky top-0 z-30 w-full shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <label htmlFor="admin-drawer" className="btn btn-ghost lg:hidden drawer-button">
              <Menu size={24} className="text-primary" />
            </label>
          </div>

          <div className="hidden lg:flex items-center justify-center mx-4 border-2 border-primary shadow-lg shadow-primary/20 rounded-md">
            <h2 className="text-xl font-bold px-3 py-2 text-primary uppercase tracking-widest">
              Interface Administrateur
            </h2>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 ml-auto shrink-0">
            {/* Notification Bell */}
            <div className="relative" ref={notifPanelRef}>
              <button
                onClick={() => setShowNotifPanel((p) => !p)}
                className="btn btn-ghost btn-circle btn-sm relative"
                title="Notifications"
              >
                <Bell size={20} className={notifState.count > 0 ? "text-orange-500" : "text-gray-400"} />
                {notifState.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {notifState.count > 9 ? "9+" : notifState.count}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {showNotifPanel && (
                <div className="fixed top-20 left-2 right-2 sm:absolute sm:top-12 sm:left-auto sm:right-0 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Bell size={18} className="text-primary" />
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                      {notifState.anneeAcademique && (
                        <span className="text-sm text-gray-400">• {notifState.anneeAcademique}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleRefreshNotifs}
                        className="btn btn-ghost btn-sm btn-circle"
                        title="Actualiser"
                      >
                        <RefreshCw size={14} className={notifState.loading ? "animate-spin" : ""} />
                      </button>
                      <button onClick={() => setShowNotifPanel(false)} className="btn btn-ghost btn-sm btn-circle">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifState.loading ? (
                      <div className="flex items-center justify-center py-8">
                        <span className="loading loading-spinner loading-sm text-primary"></span>
                      </div>
                    ) : notifState.count === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <Bell size={32} className="opacity-30 mb-3" />
                        <p className="font-medium text-sm">Aucun dépassement de charge</p>
                        <p className="text-sm mt-1">Tous les enseignants sont dans les normes</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifState.teachers.map((t) => (
                          <div key={t.id_ens} className="p-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                <AlertTriangle size={16} className="text-red-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm">
                                  {t.prenom} {t.nom}
                                </p>
                                <p className="text-sm text-gray-400 mt-0.5">{t.departement}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-sm text-gray-500">Quota : {t.quota}h</span>
                                  <span className="text-sm text-gray-500">Réalisé : {t.done.toFixed(1)}h</span>
                                  <span className="text-sm font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                    +{t.exceed.toFixed(1)}h
                                  </span>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifState.count > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                      <button
                        onClick={handleNotifyTeachers}
                        disabled={notifying}
                        className="btn btn-sm bg-primary text-white border-none w-full rounded-xl normal-case font-bold gap-2 shadow-md shadow-primary/20"
                      >
                        {notifying ? <span className="loading loading-spinner loading-sm"></span> : <Bell size={14} />}
                        Notifier les {notifState.count} enseignant{notifState.count > 1 ? "s" : ""} concerné{notifState.count > 1 ? "s" : ""}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => setIsSupportModalOpen(true)} className="btn btn-ghost btn-circle btn-sm">
              <HelpCircle size={20} className="text-gray-400" />
            </button>

            {/* Profile button */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="group flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer py-1 px-2 rounded-xl hover:bg-base-200 transition-all"
            >
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-gray-800 leading-none group-hover:text-primary transition-colors">{fullName}</p>
                <p className="text-sm badge badge-ghost badge-sm mt-1 bg-primary/10 text-primary border-none font-bold capitalize">
                  {user?.role?.toLowerCase() || "administrateur"}
                </p>
              </div>
              <div className="avatar placeholder">
                <div className="w-10 h-10 rounded-full ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100 bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
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
        <label htmlFor="admin-drawer" className="drawer-overlay"></label>
        <aside className="w-80 min-h-full bg-primary text-white flex flex-col shadow-xl relative">
          <div className="absolute right-4 top-4 lg:hidden">
            <label htmlFor="admin-drawer" className="btn btn-ghost btn-circle text-white hover:bg-white/20">
              <X size={28} />
            </label>
          </div>

          <div className="flex flex-col items-center py-10 shrink-0">
            <div className="bg-white rounded-md py-3 px-5 shadow-sm flex justify-center items-center flex-col">
              <img src="/apple-icon.png" alt="Logo" width={80} height={80} />
              <p className="text-md md:text-xl font-bold text-primary">GAAP-UVCI</p>
            </div>
            {notifState.count > 0 && (
              <div className="mt-4 bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-300" />
                <span className="text-sm text-red-200 font-semibold">
                  {notifState.count} dépassement{notifState.count > 1 ? "s" : ""} détecté{notifState.count > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${isActive ? "bg-white text-primary font-bold shadow-lg scale-105" : "hover:bg-white/10 text-white/80"}`}
                >
                  <item.icon size={22} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-6 mt-auto border-t border-white/10 space-y-2">
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="flex items-center gap-3 px-5 py-3 text-white/80 hover:bg-white/10 w-full rounded-xl transition-colors"
            >
              <HelpCircle size={18} />
              <span className="text-sm">Assistance</span>
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 px-5 py-3 text-white/80 hover:bg-red-500 hover:text-white w-full rounded-xl transition-all"
            >
              <LogOut size={18} />
              <span className="text-sm font-bold uppercase tracking-wider">Déconnexion</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Profile Modal */}
      <UserModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user as User | null}
        title="Modifier mon profil"
        onSave={handleUpdateProfile}
        isProfileEdit={true}
      />

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut size={22} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirmer la déconnexion</h3>
            </div>
            <p className="text-sm text-gray-600">Êtes-vous sûr de vouloir vous déconnecter de l'interface administrateur ?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="btn btn-ghost flex-1 rounded-xl normal-case">
                Rester connecté
              </button>
              <button
                onClick={logout}
                className="btn bg-red-600 hover:bg-red-700 text-white border-none flex-1 rounded-xl normal-case"
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSupportModalOpen(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl relative z-50 overflow-hidden animate-scale-in">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Besoin d'aide ?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pour toute assistance technique ou pour résoudre un problème sur l'application,
                veuillez contacter l'équipe de développement. Nous restons à votre entière disposition.
              </p>
              <button onClick={() => setIsSupportModalOpen(false)} className="btn btn-primary w-full mt-8 rounded-xl normal-case font-bold shadow-lg shadow-primary/20">
                J'ai compris
              </button>
            </div>
            <button onClick={() => setIsSupportModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
