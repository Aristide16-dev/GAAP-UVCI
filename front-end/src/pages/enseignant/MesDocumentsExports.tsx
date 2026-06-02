import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Lock,
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";
import { ExcelJS, STYLE, wbToBlob, downloadBlob as dlBlob } from "../../utils/excelBuilder";

interface ExportRecord {
  nom: string;
  type: "PDF" | "XLSX";
  date: string;
}
interface Activite {
  id_activite: number;
  id_cours: number;
  date_saisie: string;
  vol_hor_cal: number;
  statut?: string;
  id_ens?: number;
}
interface Cours {
  id_cours: number;
  int_cours: string;
}

const HISTORY_PAGE_SIZE = 5;
const SESSION_KEY = "ens_exports_recents";

export default function MesDocumentsExports() {
  const { user } = useAuth();
  const idEns = (user as any)?.id_ens;
  const nomEns = (user as any)?.nom_ens ?? "";
  const prenEns = (user as any)?.pren_ens ?? "";

  const [activites, setActivites] = useState<Activite[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExport, setLoadingExport] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  const [exportsRecents, setExportsRecents] = useState<ExportRecord[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadData = useCallback(async (showToast = false) => {
    if (!idEns) return;
    try {
      setLoading(true);
      const [actRes, coursRes] = await Promise.all([
        api.get("/activites-pedagogiques"),
        api.get("/cours"),
      ]);
      const toutes: Activite[] = actRes.data.data ?? [];
      setActivites(toutes.filter((a) => Number(a.id_ens) === Number(idEns)));
      setCours(coursRes.data.data ?? []);
      setHistoryPage(1);
      if (showToast) toast.success("Données actualisées");
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [idEns]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addExport = (nom: string, type: "PDF" | "XLSX") => {
    setExportsRecents((prev) => {
      const updated = [
        { nom, type, date: new Date().toLocaleDateString("fr-FR", { timeZone: "UTC" }) },
        ...prev.slice(0, 4),
      ];
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const downloadBlob = async (url: string, filename: string, type: "PDF" | "XLSX") => {
    try {
      const response = await api.get(url, { responseType: "blob" });
      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      addExport(filename, type);
      toast.success(`${filename} téléchargé`);
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const nom = `${nomEns}_${prenEns}`.replace(/\s+/g, "_");
  const getCoursLabel = (idCours: number) =>
    cours.find((c) => Number(c.id_cours) === Number(idCours))?.int_cours ??
    `Cours #${idCours}`;

  // Pagination historique
  const totalPages = Math.ceil(activites.length / HISTORY_PAGE_SIZE);
  const paginatedActivites = activites.slice(
    (historyPage - 1) * HISTORY_PAGE_SIZE,
    historyPage * HISTORY_PAGE_SIZE,
  );

  const handleExportExcel = async () => {
    if (!activites.length) {
      toast.warning("Aucune donnée à exporter");
      return;
    }
    setLoadingExport("details-xlsx");
    try {
      const totalVH = activites.reduce((s, a) => s + Number(a.vol_hor_cal), 0);
      const today = new Date().toLocaleDateString("fr-FR");
      const dateFile = new Date().toISOString().split("T")[0];

      const wb = new ExcelJS.Workbook();
      wb.creator = "GAAP-UVCI";
      const ws = wb.addWorksheet("Activités");
      ws.columns = [
        { width: 5 }, { width: 42 }, { width: 16 }, { width: 14 }, { width: 16 },
      ];

      ws.addRow(["UNIVERSITÉ VIRTUELLE DE CÔTE D'IVOIRE"]);
      STYLE.title(ws, 1, 5);
      ws.addRow([`Détails des Activités — ${prenEns} ${nomEns}`]);
      STYLE.subtitle(ws, 2, 5);
      ws.addRow([`Exporté le ${today}   •   ${activites.length} activité(s)`]);
      STYLE.dateRow(ws, 3, 5);
      ws.addRow([]);

      ws.addRow(["N°", "Cours", "Date", "Volume (h)", "Statut"]);
      STYLE.headers(ws, 5);
      ws.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];

      activites.forEach((a, idx) => {
        const dateStr = a.date_saisie
          ? new Date(a.date_saisie).toLocaleDateString("fr-FR", { timeZone: "UTC" })
          : "—";
        const row = ws.addRow([
          idx + 1,
          getCoursLabel(a.id_cours),
          dateStr,
          Number(Number(a.vol_hor_cal).toFixed(2)),
          a.statut === "approuve" ? "Validé" : "En attente",
        ]);
        STYLE.dataRow(ws, row.number, idx % 2 === 1);
        row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
        row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      });

      ws.addRow([]);
      const totRow = ws.addRow(["", "", "TOTAL VH", Number(totalVH.toFixed(2)), ""]);
      STYLE.totalRow(ws, totRow.number);
      totRow.getCell(4).alignment = { horizontal: "right", vertical: "middle" };

      const blob = await wbToBlob(wb);
      dlBlob(blob, `Details_${nom}_${dateFile}.xlsx`);
      addExport(`Details_${nom}`, "XLSX");
      toast.success("Export Excel téléchargé");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération de l'export Excel");
    } finally {
      setLoadingExport(null);
    }
  };

  return (
    <div className="space-y-8 text-base-content">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-up">
        <div>
          <p className="uppercase tracking-[0.25em] text-[10px] font-black text-primary">
            Espace Académique
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-base-content tracking-tight mt-1">
            Mes Documents & Exports
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Gérez, consultez et exportez vos documents administratifs et académiques en toute sécurité.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={loading}
          className="btn btn-sm bg-base-200 hover:bg-base-300 border-none text-sm font-bold gap-2 normal-case rounded-xl h-10 px-4 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 opacity-70 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Actualisation..." : "Actualiser"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch animate-slide-up anim-d1">
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-300/30 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-content flex items-center justify-center shadow-sm">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-md font-bold tracking-tight">Zone de Téléchargement Sécurisée</h3>
                <span className="text-[10px] opacity-40 font-semibold block">
                  Accès restreint • {prenEns} {nomEns}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-base-200 p-5 rounded-xl flex flex-col justify-between items-start space-y-4 hover:border-primary/20 transition-all bg-base-200/10">
                <div className="flex justify-between items-start w-full">
                  <div className="w-9 h-9 rounded-xl bg-error/10 text-error flex items-center justify-center font-black text-[10px]">
                    PDF
                  </div>
                  <span className="bg-base-200 px-2 py-0.5 rounded text-[8px] font-mono font-bold opacity-60">
                    REF_REC
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold">Récapitulatif de Service</h4>
                  <p className="text-[11px] opacity-50 mt-1 leading-relaxed">
                    Volume horaire total validé pour le semestre en cours.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingExport !== null}
                  onClick={async () => {
                    setLoadingExport("recap-pdf");
                    try {
                      await downloadBlob(
                        `/exports/enseignants/${idEns}/pdf`,
                        `Recapitulatif_${nom}.pdf`,
                        "PDF",
                      );
                    } finally {
                      setLoadingExport(null);
                    }
                  }}
                  className="btn bg-primary hover:bg-primary/90 text-white border-none w-full gap-2 text-sm normal-case h-11 rounded-xl"
                >
                  {loadingExport === "recap-pdf" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {loadingExport === "recap-pdf" ? "Génération..." : "Télécharger Récapitulatif"}
                </button>
              </div>

              <div className="border border-base-200 p-5 rounded-xl flex flex-col justify-between items-start space-y-4 hover:border-success/20 transition-all bg-base-200/10">
                <div className="flex justify-between items-start w-full">
                  <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center font-black text-[10px]">
                    XLSX
                  </div>
                  <span className="bg-base-200 px-2 py-0.5 rounded text-[8px] font-mono font-bold opacity-60">
                    DET_ACT
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold">Détails des Activités</h4>
                  <p className="text-[11px] opacity-50 mt-1 leading-relaxed">
                    Liste exhaustive des cours et heures complémentaires associées.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={loadingExport !== null}
                  className="btn bg-success hover:bg-success/90 text-white border-none w-full gap-2 text-sm normal-case h-11 rounded-xl"
                >
                  {loadingExport === "details-xlsx" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  {loadingExport === "details-xlsx" ? "Génération..." : "Exporter Fiche Excel"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-primary/5 border border-primary/10 rounded-xl p-3.5 flex items-start gap-3">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] opacity-70 leading-relaxed font-medium">
              Les documents générés sont basés sur vos activités validées en temps réel par la secrétaire.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card bg-base-100 shadow-sm border border-base-300/30 p-5 flex-1">
            <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-4">
              Exports Récents
            </h4>
            {exportsRecents.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-neutral">Aucun export récent</p>
                <p className="text-[10px] text-neutral/60 mt-1">Vos exports apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exportsRecents.map((exp, i) => (
                  <div key={i} className="flex gap-3 items-center text-sm">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        exp.type === "PDF" ? "bg-error/10" : "bg-success/10"
                      }`}
                    >
                      <span
                        className={`text-[9px] font-bold ${
                          exp.type === "PDF" ? "text-error" : "text-success"
                        }`}
                      >
                        {exp.type}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold block truncate">{exp.nom}</span>
                      <span className="text-[10px] opacity-40">{exp.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300/30 p-5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-3">
              Résumé
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Total activités</span>
                <span className="font-black">{activites.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Validées</span>
                <span className="font-black text-success">
                  {activites.filter((a) => a.statut === "approuve").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-60">En attente</span>
                <span className="font-black text-warning">
                  {activites.filter((a) => a.statut !== "approuve").length}
                </span>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Volume total</span>
                <span className="font-black text-primary">
                  {activites.reduce((s, a) => s + Number(a.vol_hor_cal), 0).toFixed(1)}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historique avec pagination */}
      <div className="card bg-base-100 shadow-sm border border-base-300/30 overflow-hidden">
        <div className="p-6 border-b border-base-300/30 flex justify-between items-center">
          <h3 className="text-md font-bold tracking-tight">Historique des Activités</h3>
          <span className="badge badge-ghost badge-sm font-bold">
            {activites.length} entrée(s)
          </span>
        </div>
        <div className="overflow-x-auto">
          {activites.length === 0 ? (
            <p className="text-sm text-neutral text-center py-8">Aucune activité enregistrée</p>
          ) : (
            <table className="table w-full text-sm">
              <thead>
                <tr className="bg-base-200/50 uppercase tracking-wider text-[10px] opacity-60 border-b border-base-300/30">
                  <th className="py-4 pl-6">Cours</th>
                  <th className="py-4">Date</th>
                  <th className="py-4 text-right">Volume (h)</th>
                  <th className="py-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {paginatedActivites.map((a) => (
                  <tr
                    key={a.id_activite}
                    className="border-b border-base-200/40 hover:bg-base-200/20 transition-colors"
                  >
                    <td className="font-bold py-4 pl-6 flex items-center gap-3">
                      <FileText className="w-4 h-4 opacity-40 shrink-0" />
                      <span className="max-w-[200px] truncate">{getCoursLabel(a.id_cours)}</span>
                    </td>
                    <td className="opacity-60">
                      {new Date(a.date_saisie).toLocaleDateString("fr-FR", { timeZone: "UTC" })}
                    </td>
                    <td className="font-bold text-right">{Number(a.vol_hor_cal).toFixed(2)}</td>
                    <td className="text-center">
                      {a.statut === "approuve" ? (
                        <span className="badge bg-success/10 text-success border-none font-bold text-[9px] uppercase px-2.5 py-2">
                          Validé
                        </span>
                      ) : (
                        <span className="badge bg-warning/10 text-warning border-none font-bold text-[9px] uppercase px-2.5 py-2">
                          En attente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-base-300/30 flex flex-col sm:flex-row justify-between items-center gap-3 bg-base-200/20">
            <span className="text-sm opacity-50 font-medium">
              {(historyPage - 1) * HISTORY_PAGE_SIZE + 1} à{" "}
              {Math.min(historyPage * HISTORY_PAGE_SIZE, activites.length)} sur{" "}
              {activites.length} activité(s)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="btn btn-ghost btn-sm btn-square opacity-40 disabled:opacity-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setHistoryPage(p)}
                  className={`btn btn-sm btn-square font-bold text-sm rounded-lg ${
                    historyPage === p
                      ? "bg-primary text-white border-none"
                      : "btn-ghost opacity-60"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                disabled={historyPage === totalPages}
                className="btn btn-ghost btn-sm btn-square opacity-40 disabled:opacity-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
