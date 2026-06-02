import { useState, useMemo, useEffect } from "react";
import {
  Users, UserCheck, GraduationCap, UserX, MoreVertical, Edit, Trash2,
  Power, UserPlus, Download, Filter as FilterIcon, ChevronLeft, ChevronRight,
  AlertTriangle, Search, Clock, BarChart3, BookOpen, AlertCircle, Loader2,
} from "lucide-react";
import { ExcelJS, STYLE, wbToBlob, downloadBlob as dlBlob } from "../../utils/excelBuilder";
import UserModal from "../../components/UserModal";
import type { User, Role, Status } from "../../types";
import { adminService } from "../../services/admin.service";
import { toast } from "react-toastify";

interface ConfirmModalProps {
  isOpen: boolean; title: string; message: string;
  confirmText: string; confirmColor: string;
  onConfirm: () => void; onCancel: () => void;
}

function ConfirmModal({ isOpen, title, message, confirmText, confirmColor, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${confirmColor === "error" ? "bg-red-100" : confirmColor === "warning" ? "bg-orange-100" : "bg-blue-100"}`}>
            <AlertTriangle size={24} className={confirmColor === "error" ? "text-red-600" : confirmColor === "warning" ? "text-orange-600" : "text-blue-600"} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-ghost flex-1 rounded-xl normal-case">Annuler</button>
          <button
            onClick={onConfirm}
            className={`btn flex-1 rounded-xl normal-case text-white border-none ${confirmColor === "error" ? "bg-red-600 hover:bg-red-700" : confirmColor === "warning" ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SystemStats {
  volumeHoraireGlobal: number;
  enseignantsActifs: number;
  depassementsCritiques: number;
  anneeAcademique: string | null;
  enseignantsDepassement: Array<{
    id_ens: number; nom: string; prenom: string;
    departement: string; quota: number; done: number; exceed: number;
  }>;
}

export default function AdminDashboard() {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | "ALL">("ALL");
  const [filterRole, setFilterRole] = useState<Role | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingExport, setLoadingExport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalKey, setModalKey] = useState(0);
  const itemsPerPage = 10;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string;
    confirmText: string; confirmColor: string; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", confirmText: "", confirmColor: "", onConfirm: () => {} });

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [usersRes, dashboardRes] = await Promise.allSettled([
        adminService.getUsers(),
        adminService.getDashboard(),
      ]);

      if (usersRes.status === "fulfilled") {
        const mappedUsers: User[] = usersRes.value.data.map((u) => ({
          id: String(u.id), login: u.login, nom: u.nom, email: u.email,
          role: u.role as Role, status: u.status as Status, last_login_at: u.last_login_at,
        }));
        setUsersList(mappedUsers);
      }

      if (dashboardRes.status === "fulfilled" && dashboardRes.value?.data) {
        setSystemStats(dashboardRes.value.data);
      }
    } catch (error) {
      console.error(error);
      if (!silent) toast.error("Erreur lors du chargement");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const dashboardRes = await adminService.getDashboard();
      if (dashboardRes?.data) setSystemStats(dashboardRes.data);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => { if (isMounted) await loadData(); };
    init();
    const interval = setInterval(() => { if (isMounted) loadData(true); }, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = usersList;
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((u) =>
        u.nom?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        (u.login as string || "").toLowerCase().includes(term)
      );
    }
    if (filterStatus !== "ALL") filtered = filtered.filter((u) => u.status === filterStatus);
    if (filterRole !== "ALL") filtered = filtered.filter((u) => u.role === filterRole);
    return filtered;
  }, [usersList, filterStatus, filterRole, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const accountStats = [
    { label: "TOTAL", value: usersList.length.toString(), sub: "Comptes enregistrés", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "ACTIFS", value: usersList.filter((u) => u.status === "ACTIF").length.toString(), sub: "Comptes activés", icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: "ENSEIGNANTS", value: usersList.filter((u) => u.role === "enseignant").length.toString(), sub: "Corps professoral", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "INACTIFS", value: usersList.filter((u) => u.status === "INACTIF").length.toString(), sub: "Comptes suspendus", icon: UserX, color: "text-red-600", bg: "bg-red-50" },
  ];

  const toggleStatus = (user: User) => {
    const newStatus: Status = user.status === "ACTIF" ? "INACTIF" : "ACTIF";
    const action = newStatus === "ACTIF" ? "activer" : "désactiver";
    setConfirmModal({
      isOpen: true,
      title: `${newStatus === "ACTIF" ? "Activer" : "Désactiver"} ce compte`,
      message: `Voulez-vous vraiment ${action} le compte de ${user.nom} ?\n\n${newStatus === "INACTIF" ? "L'utilisateur ne pourra plus se connecter." : "L'utilisateur pourra de nouveau se connecter."}`,
      confirmText: newStatus === "ACTIF" ? "Activer" : "Désactiver",
      confirmColor: newStatus === "ACTIF" ? "success" : "warning",
      onConfirm: async () => {
        try {
          await adminService.toggleUserStatus(user.id, newStatus);
          setUsersList((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus } : u));
          toast.success(`Compte ${newStatus === "ACTIF" ? "activé" : "désactivé"} avec succès`, { toastId: `toggle-status-${user.id}` });
          loadStats();
        } catch (error) {
          console.error(error);
          toast.error("Erreur lors du changement de statut");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSave = async (data: Partial<User> & { password?: string }) => {
    try {
      if (selectedUser) {
        await adminService.updateUser(selectedUser.id, data);
        toast.success("Utilisateur modifié avec succès", { toastId: "update-user" });
      } else {
        const createPayload: Parameters<typeof adminService.createUser>[0] = {
          login: data.login || "", nom: data.nom || "", email: data.email || "",
          role: (data.role as Role) || "enseignant",
          status: (data.status as Status) || "ACTIF",
          password: data.password || "password123",
        };
        const d = data as typeof data & { id_grade?: number; id_statut?: number; id_depart?: number };
        if (d.id_grade) createPayload.id_grade = d.id_grade;
        if (d.id_statut) createPayload.id_statut = d.id_statut;
        if (d.id_depart) createPayload.id_depart = d.id_depart;
        await adminService.createUser(createPayload);
        toast.success("Utilisateur créé avec succès", { toastId: "create-user" });
      }
      setIsModalOpen(false);
      await loadData();
      setModalKey((prev) => prev + 1);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      const msg = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(", ")
        : err?.response?.data?.message ?? err?.message ?? "Erreur lors de l'enregistrement";
      toast.error(msg);
    }
  };

  const handleDelete = (user: User) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer ce compte",
      message: `Voulez-vous vraiment supprimer le compte de ${user.nom} ?\n\nCette action est irréversible et supprimera toutes les données associées.`,
      confirmText: "Supprimer",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          await adminService.deleteUser(user.id);
          setUsersList((prev) => prev.filter((u) => u.id !== user.id));
          toast.success("Utilisateur supprimé avec succès", { toastId: `delete-user-${user.id}` });
          loadStats();
        } catch (error) {
          console.error(error);
          toast.error("Erreur lors de la suppression");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "administrateur": return "bg-purple-100 text-purple-700";
      case "secretaire": return "bg-pink-100 text-pink-700";
      case "enseignant": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getInitials = (nom: string) =>
    nom.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const getAvatarColor = (role: string) => {
    switch (role) {
      case "administrateur": return "bg-purple-500 text-white";
      case "secretaire": return "bg-pink-500 text-white";
      case "enseignant": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getTimeAgo = (timestamp: string | null | undefined) => {
    if (!timestamp) return "Jamais";
    const diffMs = new Date().getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} jours`;
  };

  const handleExportExcel = async () => {
    setLoadingExport(true);
    try {
      const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
      const dateFile = new Date().toISOString().split("T")[0];

      const roleLabel = (role: string) =>
        role === "administrateur" ? "Administrateur" : role === "secretaire" ? "Secrétaire" : "Enseignant";
      const statutLabel = (s: string) => (s === "ACTIF" ? "Actif" : "Inactif");
      const loginLabel = (u: User) => String(u.login ?? u.id ?? "—");
      const lastLogin = (u: User) =>
        u.last_login_at ? new Date(u.last_login_at).toLocaleString("fr-FR") : "Jamais connecté";

      const wb = new ExcelJS.Workbook();
      wb.creator = "GAAP-UVCI";
      const ws = wb.addWorksheet("Utilisateurs");
      ws.columns = [
        { width: 5 }, { width: 28 }, { width: 22 }, { width: 32 },
        { width: 16 }, { width: 10 }, { width: 24 },
      ];

      ws.addRow(["UNIVERSITÉ VIRTUELLE DE CÔTE D'IVOIRE"]);
      STYLE.title(ws, 1, 7);
      ws.addRow(["GAAP-UVCI — Liste des Utilisateurs"]);
      STYLE.subtitle(ws, 2, 7);
      ws.addRow([`Exporté le ${today}   •   Total : ${filteredUsers.length} utilisateur(s)`]);
      STYLE.dateRow(ws, 3, 7);
      ws.addRow([]);

      ws.addRow(["N°", "Nom complet", "Login / Identifiant", "Adresse e-mail", "Rôle", "Statut", "Dernière connexion"]);
      STYLE.headers(ws, 5);
      ws.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];

      filteredUsers.forEach((u, idx) => {
        const row = ws.addRow([
          idx + 1,
          u.nom ?? "—",
          loginLabel(u),
          u.email ?? "—",
          roleLabel(u.role ?? ""),
          statutLabel(String(u.status ?? "")),
          lastLogin(u),
        ]);
        STYLE.dataRow(ws, row.number, idx % 2 === 1);
        row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
      });

      ws.addRow([]);
      const totRow = ws.addRow(["", "", "", "", "", "Total", filteredUsers.length]);
      STYLE.totalRow(ws, totRow.number);
      totRow.getCell(7).alignment = { horizontal: "right", vertical: "middle" };

      const blob = await wbToBlob(wb);
      dlBlob(blob, `utilisateurs_${dateFile}.xlsx`);
      toast.success("Export Excel téléchargé", { toastId: "export-xlsx" });
    } catch {
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setLoadingExport(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-gray-200 animate-pulse rounded-lg"></div>
            <div className="h-4 w-80 bg-gray-100 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-100 h-28 animate-pulse"></div>
          ))}
        </div>
        <div className="bg-white rounded-xl h-64 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestion des Comptes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les accès et les privilèges des utilisateurs de la plateforme académique UVCI.
          </p>
        </div>
        <button
          onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
          className="btn bg-primary hover:bg-primary/90 text-white border-none rounded-xl h-12 px-6 gap-2 shadow-lg normal-case"
        >
          <UserPlus size={20} /> Créer un compte
        </button>
      </div>

      {/* System Overview (CdC: supervision générale du système) */}
      {systemStats && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up anim-d1">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <BarChart3 size={24} className="text-primary" />
            <h2 className="text-md font-bold text-gray-700 uppercase tracking-wider">Supervision du système</h2>
            {systemStats.anneeAcademique && (
              <span className="ml-auto text-sm bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">
                Année {systemStats.anneeAcademique}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
            <div className="p-5">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <BookOpen size={20} className="text-primary"/>
                <span className="text-sm font-bold uppercase tracking-wide">Année active</span>
              </div>
              <div className="text-2xl font-black text-primary">
                {systemStats.anneeAcademique ?? <span className="text-orange-500 text-base">Non configurée</span>}
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <GraduationCap size={20} className="text-primary"/>
                <span className="text-sm font-bold uppercase tracking-wide">Enseignants actifs</span>
              </div>
              <div className="text-2xl font-black text-gray-900">{systemStats.enseignantsActifs}</div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Clock size={20} className="text-primary"/>
                <span className="text-sm font-bold uppercase tracking-wide">Volume horaire total</span>
              </div>
              <div className="text-2xl font-black text-gray-900">{systemStats.volumeHoraireGlobal.toFixed(2)}h</div>
            </div>
            <div className={`p-5 ${systemStats.depassementsCritiques > 0 ? "bg-red-50/60" : ""}`}>
              <div className={`flex items-center gap-2 mb-2 ${systemStats.depassementsCritiques > 0 ? "text-red-400" : "text-gray-400"}`}>
                <AlertCircle size={20} className="text-primary"/>
                <span className="text-sm font-bold uppercase tracking-wide">Dépassements critiques</span>
              </div>
              <div className={`text-2xl font-black ${systemStats.depassementsCritiques > 0 ? "text-red-600" : "text-green-600"}`}>
                {systemStats.depassementsCritiques}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {systemStats.depassementsCritiques === 0 ? "Aucun dépassement" : "Enseignants concernés"}
              </div>
            </div>
          </div>

          {/* Teachers exceeding workload list */}
          {systemStats.enseignantsDepassement.length > 0 && (
            <div className="px-6 pb-4 border-t border-red-100 bg-red-50/30">
              <p className="text-sm font-bold text-red-600 uppercase tracking-wider pt-4 mb-3 flex items-center gap-2">
                <AlertTriangle size={14} /> Enseignants en dépassement de charge
              </p>
              <div className="flex flex-wrap gap-2">
                {systemStats.enseignantsDepassement.map((e) => (
                  <div key={e.id_ens} className="bg-white border border-red-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-800">{e.prenom} {e.nom}</span>
                    <span className="text-sm text-gray-400">{e.departement}</span>
                    <span className="text-sm font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      +{e.exceed.toFixed(1)}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accountStats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${stat.color}`}>{stat.label}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-slide-up anim-d2">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Liste des Utilisateurs</h2>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Filter */}
              <div className="dropdown dropdown-end">
                <button tabIndex={0} className="btn btn-sm btn-ghost gap-1 rounded-lg px-2 sm:px-3">
                  <FilterIcon size={16} /> <span className="hidden sm:inline">Filtrer</span>
                </button>
                <ul tabIndex={0} className="dropdown-content z-10 menu p-2 shadow-lg bg-white rounded-xl w-52 border border-gray-100">
                  <li className="menu-title text-sm">Par statut</li>
                  <li><button onClick={() => setFilterStatus("ALL")}>Tous</button></li>
                  <li><button onClick={() => setFilterStatus("ACTIF")}>Actifs</button></li>
                  <li><button onClick={() => setFilterStatus("INACTIF")}>Inactifs</button></li>
                  <li className="menu-title text-sm mt-2">Par rôle</li>
                  <li><button onClick={() => setFilterRole("ALL")}>Tous</button></li>
                  <li><button onClick={() => setFilterRole("administrateur")}>Administrateurs</button></li>
                  <li><button onClick={() => setFilterRole("secretaire")}>Secrétaires</button></li>
                  <li><button onClick={() => setFilterRole("enseignant")}>Enseignants</button></li>
                </ul>
              </div>
              <button onClick={handleExportExcel} disabled={loadingExport} className="btn btn-sm btn-ghost gap-1 rounded-lg hover:bg-primary/10 px-2 sm:px-3" title="Exporter en Excel">
                {loadingExport ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                <span className="hidden sm:inline">{loadingExport ? "Export..." : "Exporter"}</span>
              </button>
            </div>
          </div>
          {/* Search — full width on mobile */}
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Rechercher un utilisateur…"
              className="input input-sm pl-9 pr-4 rounded-lg border-gray-200 w-full focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Active filters badge */}
        {(searchTerm || filterStatus !== "ALL" || filterRole !== "ALL") && (
          <div className="px-6 py-2 bg-primary/5 border-b border-primary/10 flex items-center gap-2 text-sm text-primary font-semibold">
            <span>{filteredUsers.length} résultat{filteredUsers.length !== 1 ? "s" : ""}</span>
            {searchTerm && <span className="bg-primary/10 px-2 py-0.5 rounded-full">"{searchTerm}"</span>}
            {filterStatus !== "ALL" && <span className="bg-primary/10 px-2 py-0.5 rounded-full">{filterStatus}</span>}
            {filterRole !== "ALL" && <span className="bg-primary/10 px-2 py-0.5 rounded-full capitalize">{filterRole}</span>}
            <button onClick={() => { setSearchTerm(""); setFilterStatus("ALL"); setFilterRole("ALL"); }} className="ml-auto text-gray-400 hover:text-red-500 transition-colors">
              Effacer les filtres
            </button>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="bg-purple-50/50 text-sm font-bold uppercase text-gray-600">Utilisateur</th>
                <th className="bg-purple-50/50 text-sm font-bold uppercase text-gray-600">Identifiant / Email</th>
                <th className="bg-purple-50/50 text-sm font-bold uppercase text-gray-600">Rôle</th>
                <th className="bg-purple-50/50 text-sm font-bold uppercase text-gray-600">Statut</th>
                <th className="bg-purple-50/50 text-sm font-bold uppercase text-gray-600">Dernière connexion</th>
                <th className="bg-purple-50/50 text-sm font-bold uppercase text-gray-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Search size={32} className="opacity-30" />
                      <p className="font-medium">Aucun utilisateur trouvé</p>
                      {searchTerm && <p className="text-sm">Essayez un autre terme de recherche</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={`${u.role}-${u.id}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(u.role)}`}>
                          {getInitials(u.nom || "")}
                        </div>
                        <span className="font-semibold text-gray-900">{u.nom}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{u.login || u.id}</span>
                        <span className="text-sm text-gray-500">{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadgeColor(u.role)}`}>
                        {u.role === "administrateur" ? "Admin" : u.role === "secretaire" ? "Secrétaire" : "Enseignant"}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${u.status === "ACTIF" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === "ACTIF" ? "bg-green-500" : "bg-red-500"}`}></span>
                        {u.status === "ACTIF" ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">{getTimeAgo(u.last_login_at)}</span>
                    </td>
                    <td className="text-center">
                      <div className="dropdown dropdown-left">
                        <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                          <MoreVertical size={18} className="text-gray-400" />
                        </button>
                        <ul tabIndex={0} className="dropdown-content z-10 menu p-2 shadow-lg bg-white rounded-xl w-48 border border-gray-100">
                          <li>
                            <button onClick={() => { setSelectedUser(u); setIsModalOpen(true); }} className="gap-3 text-sm">
                              <Edit size={16} className="text-blue-500" /> Modifier
                            </button>
                          </li>
                          <li>
                            <button onClick={() => toggleStatus(u)} className="gap-3 text-sm">
                              <Power size={16} className="text-orange-500" />
                              {u.status === "ACTIF" ? "Désactiver" : "Activer"}
                            </button>
                          </li>
                          <li>
                            <button onClick={() => handleDelete(u)} className="gap-3 text-sm text-red-600">
                              <Trash2 size={16} /> Supprimer
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {paginatedUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-gray-400 py-12">
              <Search size={32} className="opacity-30" />
              <p className="font-medium">Aucun utilisateur trouvé</p>
              {searchTerm && <p className="text-sm">Essayez un autre terme de recherche</p>}
            </div>
          ) : (
            paginatedUsers.map((u) => (
              <div key={`${u.role}-${u.id}`} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(u.role)}`}>
                      {getInitials(u.nom || "")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{u.nom}</p>
                      <p className="text-sm text-gray-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="dropdown dropdown-left shrink-0">
                    <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                      <MoreVertical size={18} className="text-gray-400" />
                    </button>
                    <ul tabIndex={0} className="dropdown-content z-10 menu p-2 shadow-lg bg-white rounded-xl w-48 border border-gray-100">
                      <li>
                        <button onClick={() => { setSelectedUser(u); setIsModalOpen(true); }} className="gap-3 text-sm">
                          <Edit size={16} className="text-blue-500" /> Modifier
                        </button>
                      </li>
                      <li>
                        <button onClick={() => toggleStatus(u)} className="gap-3 text-sm">
                          <Power size={16} className="text-orange-500" />
                          {u.status === "ACTIF" ? "Désactiver" : "Activer"}
                        </button>
                      </li>
                      <li>
                        <button onClick={() => handleDelete(u)} className="gap-3 text-sm text-red-600">
                          <Trash2 size={16} /> Supprimer
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${getRoleBadgeColor(u.role)}`}>
                    {u.role === "administrateur" ? "Admin" : u.role === "secretaire" ? "Secrétaire" : "Enseignant"}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold ${u.status === "ACTIF" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === "ACTIF" ? "bg-green-500" : "bg-red-500"}`}></span>
                    {u.status === "ACTIF" ? "Actif" : "Inactif"}
                  </span>
                  <span className="text-sm text-gray-400 ml-auto">{getTimeAgo(u.last_login_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filteredUsers.length > 0
              ? `Affichage de ${(currentPage - 1) * itemsPerPage + 1} à ${Math.min(currentPage * itemsPerPage, filteredUsers.length)} sur ${filteredUsers.length}`
              : "0 résultat"}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="btn btn-sm btn-ghost gap-2 rounded-lg disabled:opacity-50">
              <ChevronLeft size={16} /> Précédent
            </button>
            <span className="text-sm text-gray-500 font-medium px-2">
              {currentPage} / {Math.max(1, totalPages)}
            </span>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
              className="btn btn-sm btn-ghost gap-2 rounded-lg disabled:opacity-50">
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <UserModal
        key={modalKey}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        title={selectedUser ? "Modifier l'utilisateur" : "Nouveau compte"}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmColor={confirmModal.confirmColor}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
