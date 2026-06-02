import { useState, useEffect, useCallback } from "react";
import {
  Coins,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { ExcelJS, STYLE, wbToBlob, downloadBlob as dlBlob } from "../../utils/excelBuilder";
import { SuiviSkeleton } from "../../components/SkeletonLoader";
import { toast } from "react-toastify";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";

interface VolumeHoraireData {
  volume_total_heures: number;
  montant_estime: number;
  taux_horaire: number;
  activites: ActiviteDetail[];
}

interface ActiviteDetail {
  id_activite: number;
  id_cours: number;
  id_typ_activite: number;
  date_saisie: string;
  vol_hor_cal: number;
  statut?: string;
}

interface Grade {
  id_grade: number;
  lib_grade: string;
  quota_annuel: number;
  taux_hor_permanent?: number;
}
interface Cours {
  id_cours: number;
  int_cours: string;
  filiere?: string;
}
interface TypeActivite {
  id_typ_activite: number;
  lib_activite: string;
}

export default function SuiviHeuresComplementaires() {
  const { user } = useAuth();
  const idEns = (user as any)?.id_ens;
  const idGrade = (user as any)?.id_grade;

  const [volumeData, setVolumeData] = useState<VolumeHoraireData | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [cours, setCours] = useState<Cours[]>([]);
  const [typesActivite, setTypesActivite] = useState<TypeActivite[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExport, setLoadingExport] = useState(false);

  const loadData = useCallback(async () => {
    if (!idEns) return;
    try {
      setLoading(true);
      const [volRes, coursRes, typesRes, gradeRes] = await Promise.all([
        api.get(`/enseignants/${idEns}/volume-horaire`),
        api.get("/cours"),
        api.get("/types-activites"),
        idGrade ? api.get(`/grades/${idGrade}`).catch(() => null) : Promise.resolve(null),
      ]);
      setVolumeData(volRes.data.data ?? null);
      setCours(coursRes.data.data ?? []);
      setTypesActivite(typesRes.data.data ?? []);
      if (gradeRes) setGrade(gradeRes.data.data ?? null);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [idEns, idGrade]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <SuiviSkeleton />;

  const quota = grade?.quota_annuel ?? 192;
  const totalHeures = volumeData?.volume_total_heures ?? 0;
  const tauxHoraire = volumeData?.taux_horaire ?? 0;
  const heuresCompl = Math.max(totalHeures - quota, 0);
  const pourcentage = quota > 0 ? Math.min((totalHeures / quota) * 100, 110) : 0;
  const montantHC = heuresCompl * tauxHoraire;
  const activites = volumeData?.activites ?? [];

  const getCoursLabel = (idCours: number) =>
    cours.find((c) => Number(c.id_cours) === Number(idCours))?.int_cours ??
    `Cours #${idCours}`;
  const getTypeLabel = (idType: number) =>
    typesActivite.find((t) => Number(t.id_typ_activite) === Number(idType))
      ?.lib_activite ?? "—";

  const exportTableau = async () => {
    if (!activites.length) {
      toast.warning("Aucune donnée à exporter");
      return;
    }
    setLoadingExport(true);
    try {
      const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
      const dateFile = new Date().toISOString().split("T")[0];
      const nomEns = (user as any)?.nom ?? "";

      const wb = new ExcelJS.Workbook();
      wb.creator = "GAAP-UVCI";
      const ws = wb.addWorksheet("Heures Complémentaires");
      ws.columns = [{ width: 42 }, { width: 28 }, { width: 16 }, { width: 16 }];

      ws.addRow(["UNIVERSITÉ VIRTUELLE DE CÔTE D'IVOIRE"]);
      STYLE.title(ws, 1, 4);
      ws.addRow(["Suivi des Heures Complémentaires — GAAP-UVCI"]);
      STYLE.subtitle(ws, 2, 4);
      ws.addRow([`Exporté le ${today}   •   ${nomEns}   •   Grade : ${grade?.lib_grade ?? "—"}`]);
      STYLE.dateRow(ws, 3, 4);
      ws.addRow([]);

      ws.addRow(["Cours", "Type d'Activité", "Volume (h)", "Statut"]);
      STYLE.headers(ws, 5);
      ws.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];

      activites.forEach((a, idx) => {
        const row = ws.addRow([
          getCoursLabel(a.id_cours),
          getTypeLabel(a.id_typ_activite),
          Number(Number(a.vol_hor_cal).toFixed(2)),
          a.statut === "approuve" ? "Validé" : "En attente",
        ]);
        STYLE.dataRow(ws, row.number, idx % 2 === 1);
        row.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
        row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      });

      ws.addRow([]);
      const addTot = (label: string, val: string | number) => {
        const r = ws.addRow(["", label, val, ""]);
        STYLE.totalRow(ws, r.number);
        r.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
      };
      addTot("Total des heures", Number(totalHeures.toFixed(2)));
      addTot("Quota annuel", quota);
      if (heuresCompl > 0) {
        addTot("Heures complémentaires", Number(heuresCompl.toFixed(2)));
        addTot("Taux horaire HC (FCFA/h)", tauxHoraire);
        addTot("Montant estimé (FCFA)", Math.round(montantHC));
      }

      const blob = await wbToBlob(wb);
      dlBlob(blob, `heures_complementaires_${dateFile}.xlsx`);
      toast.success("Export Excel téléchargé");
    } catch {
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setLoadingExport(false);
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
            Suivi des Heures Complémentaires
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Analyse comparative de la charge d'enseignement et rémunération associée.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {heuresCompl > 0 && (
            <div className="badge bg-warning/10 text-warning border-none font-bold text-sm px-3 py-3 gap-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse"></span>
              +{heuresCompl.toFixed(1)}h identifiées
            </div>
          )}
          <button
            type="button"
            onClick={loadData}
            className="btn btn-ghost bg-base-100/50 hover:bg-base-300 gap-2 shrink-0"
          >
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch animate-slide-up anim-d1">
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-300/30 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-md font-bold text-base-content">
                  Progression de la Charge Annuelle
                </h3>
                <span className="text-[10px] opacity-40 font-semibold">
                  Seuil réglementaire : {quota}h — {grade?.lib_grade ?? "Enseignant"}
                </span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black text-primary">
                  {totalHeures.toFixed(1)}
                </span>
                <span className="text-sm opacity-40 font-bold">/ {quota}h</span>
              </div>
            </div>

            <div className="w-full bg-base-200 h-7 rounded-xl overflow-hidden relative p-1 flex items-center gap-1">
              <div
                className="h-full rounded-lg bg-primary transition-all"
                style={{
                  width: `${Math.min(pourcentage, heuresCompl > 0 ? 90 : 100)}%`,
                }}
              />
              {heuresCompl > 0 && (
                <div className="bg-warning text-white text-[10px] font-black h-full px-2.5 flex items-center justify-center rounded-lg shrink-0">
                  +{heuresCompl.toFixed(1)}h
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-base-200/40 p-3 rounded-xl border border-base-300/10">
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-40 block mb-0.5">
                  Service Statutaire
                </span>
                <span className="text-sm font-bold">{quota}h</span>
              </div>
              <div className="bg-base-200/40 p-3 rounded-xl border border-base-300/10">
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-40 block mb-0.5">
                  Total Effectué
                </span>
                <span className="text-sm font-bold">{totalHeures.toFixed(1)}h</span>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  heuresCompl > 0
                    ? "bg-warning/5 border-warning/20"
                    : "bg-base-200/40 border-base-300/10"
                }`}
              >
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider block mb-0.5 ${
                    heuresCompl > 0 ? "text-warning/70" : "opacity-40"
                  }`}
                >
                  HC Identifiées
                </span>
                <span
                  className={`text-sm font-bold ${heuresCompl > 0 ? "text-warning" : ""}`}
                >
                  {heuresCompl > 0 ? `+${heuresCompl.toFixed(1)}h` : "0h"}
                </span>
              </div>
              <div className="bg-base-200/40 p-3 rounded-xl border border-base-300/10">
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-40 block mb-0.5">
                  Taux Réalisation
                </span>
                <span className="text-sm font-bold">{Math.round(pourcentage)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-primary text-primary-content p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div>
            <div className="flex justify-between items-start mb-4 z-10 relative">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                Estimatif
              </span>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 z-10 relative">
              Estimation Rémunération HC
            </h3>
            <p className="text-[10px] opacity-70 leading-relaxed mt-1 mb-4 max-w-[200px]">
              Basé sur le taux horaire de{" "}
              {new Intl.NumberFormat("fr-FR").format(tauxHoraire)} FCFA/h.
            </p>
          </div>
          <div className="my-2 z-10 relative">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tight">
                {new Intl.NumberFormat("fr-FR").format(Math.round(montantHC))}
              </span>
              <span className="text-sm font-bold opacity-80">FCFA</span>
            </div>
            <span className="text-[9px] block opacity-50 mt-1 italic font-medium">
              Sous réserve de validation finale par les services RH
            </span>
          </div>
          <div className="mt-4 z-10 relative space-y-2 text-sm border-t border-white/20 pt-4">
            <div className="flex justify-between opacity-80">
              <span>Heures HC</span>
              <span className="font-bold">{heuresCompl.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between opacity-80">
              <span>Taux / heure</span>
              <span className="font-bold">
                {new Intl.NumberFormat("fr-FR").format(tauxHoraire)} F
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-300/30 overflow-hidden animate-slide-up anim-d2">
        <div className="p-6 border-b border-base-300/30 flex justify-between items-center">
          <h3 className="text-md font-bold tracking-tight">
            Détail des Heures par Activité
          </h3>
          <button
            type="button"
            onClick={exportTableau}
            disabled={loadingExport}
            className="btn btn-sm btn-ghost text-base-content/60 px-3 rounded-lg gap-2"
          >
            {loadingExport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {loadingExport ? "Génération..." : "Export Excel (.xlsx)"}
          </button>
        </div>

        <div className="overflow-x-auto">
          {activites.length === 0 ? (
            <p className="text-sm text-neutral text-center py-8">
              Aucune activité enregistrée
            </p>
          ) : (
            <table className="table w-full text-sm">
              <thead>
                <tr className="bg-base-200/50 uppercase tracking-wider text-[10px] opacity-60 border-b border-base-300/30">
                  <th className="py-4 pl-6">Cours</th>
                  <th className="py-4">Type</th>
                  <th className="py-4">Date</th>
                  <th className="py-4 text-center">Volume (h)</th>
                  <th className="py-4 text-center">Surplus HC</th>
                  <th className="py-4 pr-6 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {activites.map((a) => {
                  const vh = Number(a.vol_hor_cal);
                  const surplus =
                    heuresCompl > 0 && vh > 0
                      ? (vh / totalHeures) * heuresCompl
                      : 0;
                  return (
                    <tr
                      key={a.id_activite}
                      className="border-b border-base-200/40 hover:bg-base-200/20 transition-colors"
                    >
                      <td className="font-bold py-4 pl-6 max-w-[200px] truncate">
                        {getCoursLabel(a.id_cours)}
                      </td>
                      <td className="opacity-70">{getTypeLabel(a.id_typ_activite)}</td>
                      <td className="opacity-60">
                        {new Date(a.date_saisie).toLocaleDateString("fr-FR", { timeZone: "UTC" })}
                      </td>
                      <td className="font-bold text-center">{vh.toFixed(2)}h</td>
                      <td className="text-center">
                        {surplus > 0 ? (
                          <span className="font-bold text-warning text-sm">
                            +{surplus.toFixed(1)}h
                          </span>
                        ) : (
                          <span className="opacity-40 text-sm">0h</span>
                        )}
                      </td>
                      <td className="pr-6 text-center">
                        {a.statut === "approuve" ? (
                          <span className="badge bg-success/10 text-success border-none font-bold text-[9px] uppercase px-2 py-1.5">
                            Validé
                          </span>
                        ) : (
                          <span className="badge bg-warning/10 text-warning border-none font-bold text-[9px] uppercase px-2 py-1.5">
                            En cours
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="text-center pt-4 border-t border-base-300/20">
        <p className="text-[10px] font-bold opacity-30 tracking-widest uppercase">
          © {new Date().getFullYear()} Université Virtuelle de Côte d'Ivoire •
          Système de Gestion Pédagogique
        </p>
      </div>
    </div>
  );
}
