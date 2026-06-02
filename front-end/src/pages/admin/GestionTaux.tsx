import { useState, useEffect } from "react";
import {
  Save, FileText, History, GraduationCap,
  X, User, Clock, AlertTriangle, Trash2, ShieldAlert, Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { adminService } from "../../services/admin.service";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";
import { GestionTauxSkeleton } from "../../components/SkeletonLoader";

interface GradeRate {
  id_grade: number;
  lib_grade: string;
  taux_hor_permanent: number;
  taux_hor_vacataire: number;
  quota_max: number;
}

interface HistoryEntry {
  id: number;
  user: string;
  action: string;
  date: string;
  time: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, isDestructive = false }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDestructive ? "bg-red-100" : "bg-blue-100"}`}>
            <AlertTriangle size={24} className={isDestructive ? "text-red-600" : "text-blue-600"} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-ghost flex-1 rounded-xl normal-case">Annuler</button>
          <button
            onClick={onConfirm}
            className={`btn flex-1 rounded-xl normal-case text-white border-none ${isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestionTaux() {
  const { user } = useAuth();
  const adminFullName = (user as any)?.pren_adm
    ? `${(user as any).pren_adm} ${(user as any).nom_adm}`
    : (user as any)?.user_log_adm ?? "Administrateur";

  const [rates, setRates] = useState<GradeRate[]>([]);
  const [originalRates, setOriginalRates] = useState<GradeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null | "all">(undefined as any);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [gradesRes, historyRes] = await Promise.all([
          adminService.getGrades(),
          adminService.getGradesHistory(),
        ]);
        if (isMounted) {
          if (gradesRes.data) {
            const mapped: GradeRate[] = gradesRes.data.map((g) => ({
              id_grade: g.id_grade,
              lib_grade: g.lib_grade,
              taux_hor_permanent: g.taux_hor_permanent ?? 0,
              taux_hor_vacataire: g.taux_hor_vacataire ?? 0,
              quota_max: g.quota_annuel ?? 0,
            }));
            setRates(mapped);
            setOriginalRates(mapped);
          }
          if (historyRes.data) setHistoryData(historyRes.data);
        }
      } catch {
        if (isMounted) toast.error("Erreur lors du chargement");
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const updateRateValue = (
    id: number,
    field: "taux_hor_permanent" | "taux_hor_vacataire" | "quota_max",
    value: string,
  ) => {
    setRates((prev) =>
      prev.map((r) => r.id_grade === id ? { ...r, [field]: parseInt(value) || 0 } : r),
    );
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const changedRates = rates.filter((rate) => {
        const original = originalRates.find((r) => r.id_grade === rate.id_grade);
        return !original
          || original.taux_hor_permanent !== rate.taux_hor_permanent
          || original.taux_hor_vacataire !== rate.taux_hor_vacataire
          || original.quota_max !== rate.quota_max;
      });

      if (changedRates.length === 0) {
        toast.info("Aucune modification détectée");
        return;
      }

      await Promise.all(
        changedRates.map((rate) =>
          adminService.updateGrade(rate.id_grade, {
            taux_hor_permanent: rate.taux_hor_permanent,
            taux_hor_vacataire: rate.taux_hor_vacataire,
            quota_annuel: rate.quota_max,
          }),
        ),
      );
      const historyRes = await adminService.getGradesHistory();
      if (historyRes.data) setHistoryData(historyRes.data);
      setOriginalRates(rates);
      toast.success("Barème enregistré avec succès");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setRates(originalRates);
    toast.info("Modifications annulées");
  };

  const requestDeleteHistory = (id: number | null) => {
    setDeleteTarget(id === null ? "all" : id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      if (deleteTarget === "all") {
        await adminService.clearGradesHistory();
        setHistoryData([]);
        toast.success("Historique vidé");
      } else if (typeof deleteTarget === "number") {
        await adminService.deleteGradeHistory(deleteTarget);
        setHistoryData((prev) => prev.filter((h) => h.id !== deleteTarget));
        toast.success("Entrée supprimée");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(undefined as any);
    }
  };

  const handleExportPDF = async () => {
    setLoadingPDF(true);
    try {
      const response = await api.get("/exports/taux-horaires/pdf", { responseType: "blob" });
      const today = new Date();
      const fileName = `Bareme_Taux_${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}.pdf`;
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(blobUrl);
      toast.success("PDF exporté avec succès");
    } catch {
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setLoadingPDF(false);
    }
  };

  if (initialLoading) return <GestionTauxSkeleton />;

  return (
    <div className="p-2 md:p-4 font-sans bg-base-100 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 animate-slide-up">
        <div className="w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-base-content tracking-tight">Configuration du Barème</h1>
          <p className="mt-2 text-neutral text-sm font-medium max-w-2xl">
            Définissez les taux horaires et le quota maximum d'heures complémentaires par grade.
          </p>
        </div>
        <div className="flex gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
          <button onClick={handleCancel} className="btn btn-ghost text-gray-500 font-bold px-4 rounded-xl normal-case flex-1 sm:flex-none">Annuler</button>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={loading}
            className="btn btn-accent text-white px-6 rounded-xl shadow-lg shadow-accent/20 normal-case text-base gap-2 flex-1 lg:flex-none"
          >
            {loading ? <span className="loading loading-spinner"></span> : <Save size={20} />}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-xl p-4 md:p-8 border border-base-200 shadow-sm animate-slide-up anim-d1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.4 h-8 bg-primary rounded-xl"></div>
            <h2 className="text-xl md:text-2xl font-bold text-base-content">Grille de Rémunération</h2>
          </div>

          {/* Column headers */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 mb-3 px-4">
            <div className="col-span-3"></div>
            <div className="col-span-3 text-center text-[10px] font-black uppercase tracking-widest text-neutral opacity-60">Permanent</div>
            <div className="col-span-3 text-center text-[10px] font-black uppercase tracking-widest text-neutral opacity-60">Vacataire</div>
            <div className="col-span-3 text-center text-[10px] font-black uppercase tracking-widest text-error opacity-70">Quota Max (H)</div>
          </div>

          {rates.length > 0 ? (
            <div className="space-y-2">
              {rates.map((item, idx) => (
                <div
                  key={item.id_grade}
                  className="flex flex-col md:grid md:grid-cols-12 items-center gap-3 p-4 rounded-xl bg-base-200/30 border border-transparent hover:shadow-md transition-shadow animate-slide-right"
                  style={{ animationDelay: `${200 + idx * 55}ms` }}
                >
                  <div className="w-full md:col-span-3 flex items-center gap-2 min-w-0">
                    <div className="p-2 rounded-xl shrink-0 bg-primary/10 text-primary">
                      <GraduationCap size={18} />
                    </div>
                    <span className="font-bold text-base-content text-sm leading-tight truncate">{item.lib_grade}</span>
                  </div>

                  <div className="w-full md:col-span-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold opacity-40 ml-1 uppercase md:hidden">Permanent</span>
                    <input
                      type="number"
                      value={item.taux_hor_permanent}
                      onChange={(e) => updateRateValue(item.id_grade, "taux_hor_permanent", e.target.value)}
                      className="w-full bg-white rounded-xl py-3 px-2 text-center font-black text-primary border-none shadow-sm focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                  </div>

                  <div className="w-full md:col-span-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold opacity-40 ml-1 uppercase md:hidden">Vacataire</span>
                    <input
                      type="number"
                      value={item.taux_hor_vacataire}
                      onChange={(e) => updateRateValue(item.id_grade, "taux_hor_vacataire", e.target.value)}
                      className="w-full bg-white rounded-xl py-3 px-2 text-center font-black text-primary border-none shadow-sm focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                  </div>

                  <div className="w-full md:col-span-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold opacity-40 ml-1 uppercase md:hidden">Quota Max (H)</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={item.quota_max}
                        onChange={(e) => updateRateValue(item.id_grade, "quota_max", e.target.value)}
                        className="w-full bg-red-50 rounded-xl py-3 px-2 text-center font-black text-error border-none shadow-sm focus:ring-2 focus:ring-error/20 outline-none text-sm"
                        min={0}
                      />
                      <span className="text-sm font-black text-error/60 shrink-0">H</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400">Aucune donnée disponible</p>
          )}

          {/* Legend */}
          <div className="mt-6 p-4 bg-error/5 rounded-xl border border-error/10 flex items-start gap-3">
            <ShieldAlert size={18} className="text-error shrink-0 mt-0.5" />
            <p className="text-sm text-error/80 font-semibold leading-relaxed">
              Le <strong>Quota Max</strong> définit le nombre maximum d'heures complémentaires autorisées pour les enseignants de ce grade.
              Un dépassement déclenche une alerte automatique sur le tableau de bord.
            </p>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 animate-slide-up anim-d2">
          <div className="bg-primary/5 rounded-xl p-6 md:p-8 border border-primary/5">
            <h3 className="text-xl font-bold text-base-content mb-6">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleExportPDF}
                disabled={loadingPDF}
                className="btn btn-ghost bg-white hover:bg-white border-none w-full justify-between rounded-xl h-14 normal-case text-base-content font-bold shadow-sm"
              >
                {loadingPDF ? "Génération..." : "Exporter PDF"}
                {loadingPDF ? <Loader2 size={18} className="animate-spin text-neutral/40" /> : <FileText size={18} className="text-neutral/40" />}
              </button>
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="btn btn-ghost bg-white hover:bg-white border-none w-full justify-between rounded-xl h-14 normal-case text-base-content font-bold shadow-sm"
              >
                Historique <History size={18} className="text-neutral/40" />
              </button>
            </div>
          </div>

          {/* Summary table */}
          {rates.length > 0 && (
            <div className="bg-white rounded-xl border border-base-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-base-200">
                <p className="text-sm font-black uppercase tracking-widest text-neutral">Récapitulatif</p>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-sm w-full text-sm">
                  <thead>
                    <tr className="bg-base-200/50">
                      <th className="font-bold text-neutral text-[10px] uppercase">Grade</th>
                      <th className="font-bold text-neutral text-[10px] uppercase text-center">Quota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((r) => (
                      <tr key={r.id_grade} className="border-b border-base-200/50">
                        <td className="font-semibold text-base-content py-2 max-w-30 truncate">{r.lib_grade}</td>
                        <td className="text-center">
                          <span className="badge badge-sm font-bold text-error bg-error/10 border-none">
                            {r.quota_max} h
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-content/40 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl relative z-50 overflow-hidden">
            <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-200/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl"><History size={20} /></div>
                <h3 className="text-xl font-bold text-base-content">Historique des Modifications</h3>
              </div>
              <div className="flex items-center gap-2">
                {historyData.length > 0 && (
                  <button
                    onClick={() => requestDeleteHistory(null)}
                    className="btn btn-ghost btn-sm text-error hover:bg-error/10 normal-case font-bold gap-1"
                  >
                    <Trash2 size={14} /> Tout vider
                  </button>
                )}
                <button onClick={() => setIsHistoryOpen(false)} className="btn btn-ghost btn-sm btn-circle">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {historyData.length > 0 ? (
                <div className="space-y-4">
                  {historyData.map((entry) => (
                    <div key={entry.id} className="flex gap-4 group hover:bg-base-100 p-2 rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 text-primary shrink-0">
                        <User size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-base-content">{entry.user || adminFullName}</span>
                          <span className="text-sm opacity-60">• {entry.action}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-neutral/70">
                          <span className="flex items-center gap-1"><Clock size={12} /> {entry.time}</span>
                          <span>{entry.date}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => requestDeleteHistory(entry.id)}
                        className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-sm btn-circle text-error transition-opacity shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">Aucun historique disponible</div>
              )}
            </div>
            <div className="p-6 border-t border-base-200">
              <button onClick={() => setIsHistoryOpen(false)} className="btn btn-primary w-full rounded-xl normal-case font-bold">Fermer</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirmer l'enregistrement"
        message="Voulez-vous vraiment enregistrer ces paramètres ? Cela impactera les calculs de rémunération et les seuils d'alerte de dépassement."
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title={deleteTarget === "all" ? "Vider l'historique" : "Supprimer l'entrée"}
        message={deleteTarget === "all"
          ? "Êtes-vous sûr de vouloir vider tout l'historique ? Cette action est irréversible."
          : "Êtes-vous sûr de vouloir supprimer cette entrée ?"}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(undefined as any); }}
        isDestructive
      />
    </div>
  );
}
