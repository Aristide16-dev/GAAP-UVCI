import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  RefreshCw,
  CheckCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import { ExcelJS, STYLE, wbToBlob, downloadBlob as dlBlob } from "../../utils/excelBuilder";
import { SuiviSkeleton } from "../../components/SkeletonLoader";
import { toast } from "react-toastify";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";

interface Activite {
  id_activite: number;
  id_ens: number;
  id_cours: number;
  id_niv_complex: number;
  id_typ_activite: number;
  vol_hor_cal: number;
  date_saisie: string;
  statut?: string;
}

interface Cours {
  id_cours: number;
  int_cours: string;
  filiere?: string;
  nb_heures?: number;
}
interface NiveauComplexite {
  id_niv_complex: number;
  lib_niv_complex: string;
}
interface TypeActivite {
  id_typ_activite: number;
  lib_activite: string;
}
interface Niveau {
  id_niveau: number;
  lib_niveau: string;
}

const PAGE_SIZE = 5;

export default function MesActivitesPedagogiques() {
  const { user } = useAuth();
  const idEns = (user as any)?.id_ens;

  const [activites, setActivites] = useState<Activite[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [niveauxComplexite, setNiveauxComplexite] = useState<
    NiveauComplexite[]
  >([]);
  const [typesActivite, setTypesActivite] = useState<TypeActivite[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExport, setLoadingExport] = useState(false);
  const [page, setPage] = useState(1);
  const [filterNiveau, setFilterNiveau] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!idEns) return;
    try {
      setLoading(true);
      const [actRes, coursRes, nivComplexRes, typesRes, niveauxRes] =
        await Promise.all([
          api.get("/activites-pedagogiques"),
          api.get("/cours"),
          api.get("/niveaux-complexite"),
          api.get("/types-activites"),
          api.get("/niveaux"),
        ]);
      const toutes: Activite[] = actRes.data.data ?? [];
      setActivites(toutes.filter((a) => Number(a.id_ens) === Number(idEns)));
      setCours(coursRes.data.data ?? []);
      setNiveauxComplexite(nivComplexRes.data.data ?? []);
      setTypesActivite(typesRes.data.data ?? []);
      setNiveaux(niveauxRes.data.data ?? []);
    } catch {
      toast.error("Erreur lors du chargement des activités");
    } finally {
      setLoading(false);
    }
  }, [idEns]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCours = (id: number) =>
    cours.find((c) => Number(c.id_cours) === Number(id));
  const getNivComplex = (id: number) =>
    niveauxComplexite.find((n) => Number(n.id_niv_complex) === Number(id));
  const getType = (id: number) =>
    typesActivite.find((t) => Number(t.id_typ_activite) === Number(id));

  const filteredActivites = filterNiveau
    ? activites.filter((a) => {
        const c = getCours(a.id_cours);
        return c && Number((c as any).id_niveau) === Number(filterNiveau);
      })
    : activites;

  const totalPages = Math.ceil(filteredActivites.length / PAGE_SIZE);
  const paginated = filteredActivites.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const totalHeures = activites.reduce((s, a) => s + Number(a.vol_hor_cal), 0);
  const totalConceptions = activites.filter((a) => {
    const t = getType(a.id_typ_activite);
    return t?.lib_activite?.toLowerCase().includes("conception");
  }).length;
  const totalMaj = activites.filter((a) => {
    const t = getType(a.id_typ_activite);
    return (
      t?.lib_activite?.toLowerCase().includes("mise") ||
      t?.lib_activite?.toLowerCase().includes("update")
    );
  }).length;
  const toutValide =
    activites.length > 0 && activites.every((a) => a.statut === "approuve");

  const exportCSV = async () => {
    if (!filteredActivites.length) {
      toast.warning("Aucune donnée à exporter");
      return;
    }
    setLoadingExport(true);
    try {
      const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
      const dateFile = new Date().toISOString().split("T")[0];

      const wb = new ExcelJS.Workbook();
      wb.creator = "GAAP-UVCI";
      const ws = wb.addWorksheet("Activités Pédagogiques");
      ws.columns = [
        { width: 42 }, { width: 28 }, { width: 20 }, { width: 14 }, { width: 16 }, { width: 14 },
      ];

      ws.addRow(["UNIVERSITÉ VIRTUELLE DE CÔTE D'IVOIRE"]);
      STYLE.title(ws, 1, 6);
      ws.addRow(["Mes Activités Pédagogiques — GAAP-UVCI"]);
      STYLE.subtitle(ws, 2, 6);
      ws.addRow([`Exporté le ${today}   •   ${filteredActivites.length} activité(s) affichée(s)`]);
      STYLE.dateRow(ws, 3, 6);
      ws.addRow([]);

      ws.addRow(["Cours", "Type d'Activité", "Complexité", "Volume (h)", "Date", "Statut"]);
      STYLE.headers(ws, 5);
      ws.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];

      filteredActivites.forEach((a, idx) => {
        const c = getCours(a.id_cours);
        const n = getNivComplex(a.id_niv_complex);
        const t = getType(a.id_typ_activite);
        const row = ws.addRow([
          c?.int_cours ?? `#${a.id_cours}`,
          t?.lib_activite ?? "—",
          n?.lib_niv_complex ?? "—",
          Number(Number(a.vol_hor_cal).toFixed(2)),
          new Date(a.date_saisie).toLocaleDateString("fr-FR", { timeZone: "UTC" }),
          a.statut === "approuve" ? "Validé" : "En attente",
        ]);
        STYLE.dataRow(ws, row.number, idx % 2 === 1);
        row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
        row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
      });

      ws.addRow([]);
      const totRow = ws.addRow(["", "Total des heures", "", Number(totalHeures.toFixed(2)), "", ""]);
      STYLE.totalRow(ws, totRow.number);
      totRow.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
      const totConc = ws.addRow(["", "Total conceptions", "", totalConceptions, "", ""]);
      STYLE.totalRow(ws, totConc.number);
      const totMajRow = ws.addRow(["", "Total mises à jour", "", totalMaj, "", ""]);
      STYLE.totalRow(ws, totMajRow.number);

      const blob = await wbToBlob(wb);
      dlBlob(blob, `activites_${dateFile}.xlsx`);
      toast.success("Export Excel téléchargé");
    } catch {
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setLoadingExport(false);
    }
  };

  if (loading) return <SuiviSkeleton />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-up">
        <div>
          <p className="uppercase tracking-[0.25em] text-[10px] font-black text-primary">
            Espace Académique
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-base-content tracking-tight mt-1">
            Mes Activités Pédagogiques
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Consultez l'ensemble des activités pédagogiques validées pour
            l'année universitaire en cours.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <div className="bg-base-100 px-4 py-2 rounded-xl border border-base-300/30 text-center">
            <span className="text-[9px] uppercase font-bold tracking-wider opacity-40 block">
              Total Validé
            </span>
            <span className="text-md font-black text-primary">
              {totalHeures.toFixed(1)}h
            </span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="btn btn-ghost bg-base-100/50 hover:bg-base-300 gap-2 text-sm rounded-xl"
          >
            <RefreshCw size={14} /> Actualiser
          </button>
          <button
            type="button"
            onClick={exportCSV}
            disabled={loadingExport}
            className="btn bg-primary hover:bg-primary/90 text-white border-none rounded-xl font-bold text-sm normal-case h-11 gap-2 px-5 shadow-sm"
          >
            {loadingExport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {loadingExport ? "Génération..." : "Export Excel (.xlsx)"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up anim-d1">
        <div className="card bg-base-100 shadow-sm border border-base-300/30 p-4 flex flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] opacity-40 font-bold uppercase tracking-wider block">
              Conceptions
            </span>
            <span className="text-xl font-black">
              {String(totalConceptions).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300/30 p-4 flex flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] opacity-40 font-bold uppercase tracking-wider block">
              Mises à Jour
            </span>
            <span className="text-xl font-black">
              {String(totalMaj).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300/30 p-4 flex flex-row items-center gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toutValide ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
          >
            {toutValide ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
          <div>
            <span className="text-[10px] opacity-40 font-bold uppercase tracking-wider block">
              Statut Global
            </span>
            <span
              className={`badge border-none font-bold text-[10px] uppercase tracking-wide px-2 mt-0.5 ${
                toutValide
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {toutValide
                ? "Tout validé"
                : `${activites.filter((a) => a.statut !== "approuve").length} en attente`}
            </span>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-300/30 overflow-hidden animate-slide-up anim-d2">
        <div className="p-6 border-b border-base-300/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h3 className="text-md font-bold tracking-tight">
            Registre des Actions Pédagogiques
          </h3>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <span className="text-sm opacity-50">Niveau:</span>
            <button
              type="button"
              onClick={() => {
                setFilterNiveau(null);
                setPage(1);
              }}
              className={`btn btn-sm text-sm normal-case font-bold rounded-lg px-3 ${
                filterNiveau === null
                  ? "bg-primary text-white border-none"
                  : "btn-ghost opacity-60"
              }`}
            >
              Tous
            </button>
            {niveaux.map((n) => (
              <button
                key={n.id_niveau}
                type="button"
                onClick={() => {
                  setFilterNiveau(Number(n.id_niveau));
                  setPage(1);
                }}
                className={`btn btn-sm text-sm normal-case font-bold rounded-lg px-3 ${
                  filterNiveau === Number(n.id_niveau)
                    ? "bg-primary text-white border-none"
                    : "btn-ghost opacity-60"
                }`}
              >
                {n.lib_niveau}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {paginated.length === 0 ? (
            <p className="text-sm text-neutral text-center py-10">
              Aucune activité trouvée
            </p>
          ) : (
            <table className="table w-full text-sm">
              <thead>
                <tr className="bg-base-200/50 uppercase tracking-wider text-[10px] opacity-60 border-b border-base-300/30">
                  <th className="py-4 pl-6">Intitulé du Cours</th>
                  <th className="py-4 text-center">Type d'Action</th>
                  <th className="py-4 text-center">Complexité</th>
                  <th className="py-4 text-center">Volume Horaire</th>
                  <th className="py-4 text-center">Statut</th>
                  <th className="py-4 pr-6 text-center">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((a) => {
                  const c = getCours(a.id_cours);
                  const n = getNivComplex(a.id_niv_complex);
                  const t = getType(a.id_typ_activite);
                  const isConception = t?.lib_activite
                    ?.toLowerCase()
                    .includes("conception");
                  const isValide = a.statut === "approuve";
                  return (
                    <tr
                      key={a.id_activite}
                      className="border-b border-base-200/40 hover:bg-base-200/20 transition-colors"
                    >
                      <td className="py-4 pl-6">
                        <span className="font-bold block text-sm max-w-[200px] truncate">
                          {c?.int_cours ?? `Cours #${a.id_cours}`}
                        </span>
                        <span className="text-[10px] opacity-40 font-medium">
                          {c?.filiere ?? "—"}
                        </span>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge border-none font-bold text-[10px] px-3 py-2 ${
                            isConception
                              ? "bg-primary/10 text-primary"
                              : "bg-base-200 text-base-content/70"
                          }`}
                        >
                          {t?.lib_activite ?? "—"}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary font-bold inline-flex items-center justify-center text-sm">
                          {n?.lib_niv_complex ?? "—"}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="font-bold block text-sm">
                          {Number(a.vol_hor_cal).toFixed(2)}h
                        </span>
                      </td>
                      <td className="text-center">
                        {isValide ? (
                          <span className="badge bg-success/10 text-success border-none font-bold text-[9px] uppercase px-2 py-1.5">
                            Validé
                          </span>
                        ) : (
                          <span className="badge bg-warning/10 text-warning border-none font-bold text-[9px] uppercase px-2 py-1.5">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="text-center pr-6 opacity-60 text-[11px]">
                        {new Date(a.date_saisie).toLocaleDateString("fr-FR", { timeZone: "UTC" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-base-300/30 flex flex-col sm:flex-row justify-between items-center gap-4 bg-base-200/20">
          <span className="text-sm opacity-50 font-medium">
            {filteredActivites.length === 0
              ? "Aucune activité"
              : `${(page - 1) * PAGE_SIZE + 1} à ${Math.min(page * PAGE_SIZE, filteredActivites.length)} sur ${filteredActivites.length} activité(s)`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-ghost btn-sm btn-square opacity-40 disabled:opacity-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`btn btn-sm btn-square font-bold text-sm rounded-lg ${
                    page === p
                      ? "bg-primary text-white border-none"
                      : "btn-ghost opacity-60"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-ghost btn-sm btn-square opacity-40 disabled:opacity-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
