import { useState, useEffect, useCallback, useRef } from "react";
import { ExcelJS, STYLE, wbToBlob, downloadBlob as dlBlob } from "../../utils/excelBuilder";
import {
  BookOpen,
  Layers,
  CheckCircle,
  Info,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  enseignantService,
  type Enseignant,
} from "../../services/enseignant.service";
import { coursService, type Cours } from "../../services/cours.service";
import {
  activiteService,
  type ActivitePedagogique,
} from "../../services/activite.service";
import api from "../../api/axios";

interface NiveauComplexite {
  id_niv_complex: number;
  lib_niv_complex: string;
  coeff_niv_complex: number;
}

interface TypeActivite {
  id_typ_activite: number;
  lib_activite: string;
  multiplicateur_base: number;
}

interface Parametre {
  id_param: number;
  annee_acad: number;
}

interface RessourceCours {
  id_res: number;
  id_seq: number;
  id_typ_res: number;
  id_cours: number;
  titre_res: string;
}

interface TypeRessourceWithLevel {
  id_typ_res: number;
  id_niv_complex: number | null;
}

type SortField =
  | "lib_niv_complex"
  | "vol_hor_cal"
  | "statut"
  | "lib_activite"
  | null;
type SortDir = "asc" | "desc";

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField === field) {
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }
  return <ChevronUp size={12} className="opacity-30" />;
}

export default function SaisieValidation() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [niveauxComplexite, setNiveauxComplexite] = useState<
    NiveauComplexite[]
  >([]);
  const [typesActivite, setTypesActivite] = useState<TypeActivite[]>([]);
  const [historique, setHistorique] = useState<ActivitePedagogique[]>([]);
  const [parametreActif, setParametreActif] = useState<Parametre | null>(null);
  const [selectedEnseignant, setSelectedEnseignant] = useState<number>(0);
  const [selectedCours, setSelectedCours] = useState<number>(0);
  const [selectedNiveauComplex, setSelectedNiveauComplex] = useState<number>(0);
  const [selectedTypeActivite, setSelectedTypeActivite] = useState<number>(0);
  const [nbSequences, setNbSequences] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [deleteTarget, setDeleteTarget] = useState<ActivitePedagogique | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingExport, setLoadingExport] = useState<string | null>(null);
  const [allRessources, setAllRessources] = useState<RessourceCours[]>([]);
  const [selectedResource, setSelectedResource] = useState<number | null>(null);
  const [typesRessources, setTypesRessources] = useState<TypeRessourceWithLevel[]>([]);
  const [niveauAutoFilled, setNiveauAutoFilled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const coursSelectionne = cours.find(
    (c) => Number(c.id_cours) === Number(selectedCours),
  );
  const niveauSelectionne = niveauxComplexite.find(
    (n) => Number(n.id_niv_complex) === Number(selectedNiveauComplex),
  );
  const typeSelectionne = typesActivite.find(
    (t) => Number(t.id_typ_activite) === Number(selectedTypeActivite),
  );

  const coeff = niveauSelectionne?.coeff_niv_complex ?? 1;
  const multiplicateur = typeSelectionne?.multiplicateur_base ?? 1;
  const volumeHoraire = nbSequences * coeff * multiplicateur;

  const coursRessources = allRessources.filter(
    (r) => Number(r.id_cours) === Number(selectedCours),
  );

  const resetForm = () => {
    setSelectedEnseignant(0);
    setSelectedCours(0);
    setSelectedNiveauComplex(0);
    setSelectedTypeActivite(0);
    setNbSequences(0);
    setSelectedResource(null);
    setNiveauAutoFilled(false);
  };

  // Auto-remplissage du niveau de complexité depuis le type de ressource du cours sélectionné
  useEffect(() => {
    if (!selectedCours) {
      setNiveauAutoFilled(false);
      return;
    }
    const coursObj = cours.find((c) => Number(c.id_cours) === Number(selectedCours));
    if (!coursObj?.id_typ_res) {
      setNiveauAutoFilled(false);
      return;
    }
    const typeRes = typesRessources.find((t) => t.id_typ_res === coursObj.id_typ_res);
    if (typeRes?.id_niv_complex) {
      setSelectedNiveauComplex(typeRes.id_niv_complex);
      setNiveauAutoFilled(true);
    } else {
      setNiveauAutoFilled(false);
    }
  }, [selectedCours, cours, typesRessources]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        enseignantsData,
        coursData,
        niveauxData,
        typesData,
        historiqueData,
        parametresData,
        ressourcesData,
        typesRessourcesData,
      ] = await Promise.all([
        enseignantService.getAll(),
        coursService.getAll(),
        api.get("/niveaux-complexite").then((r) => r.data.data ?? []),
        api.get("/types-activites").then((r) => r.data.data ?? []),
        activiteService.getAll(),
        api.get("/parametres").then((r) => r.data.data ?? []),
        api.get("/ressources").then((r) => r.data.data ?? []),
        api.get("/types-ressources").then((r) => r.data.data ?? []),
      ]);
      setEnseignants(enseignantsData);
      setCours(coursData);
      setNiveauxComplexite(niveauxData);
      setTypesActivite(typesData);
      setHistorique(historiqueData.slice(0, 20));
      if (enseignantsData.length > 0)
        setSelectedEnseignant(Number(enseignantsData[0].id_ens));
      if (coursData.length > 0) {
        setSelectedCours(Number(coursData[0].id_cours));
        const seq = coursData[0].nb_sequences
          ? Number(coursData[0].nb_sequences)
          : Number(coursData[0].nb_heures) * 4;
        setNbSequences(seq);
      }
      if (niveauxData.length > 0)
        setSelectedNiveauComplex(Number(niveauxData[0].id_niv_complex));
      if (typesData.length > 0)
        setSelectedTypeActivite(Number(typesData[0].id_typ_activite));
      if (parametresData.length > 0)
        setParametreActif(parametresData[parametresData.length - 1]);
      setAllRessources(ressourcesData);
      setTypesRessources(typesRessourcesData);
    } catch {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCoursChange = (idCours: number) => {
    setSelectedCours(idCours);
    setSelectedResource(null);
    const c = cours.find((x) => Number(x.id_cours) === Number(idCours));
    if (c) {
      const seq = c.nb_sequences
        ? Number(c.nb_sequences)
        : Number(c.nb_heures) * 4;
      setNbSequences(seq);
    }
  };

  const handleValider = async () => {
    if (
      !selectedEnseignant ||
      !selectedCours ||
      !selectedNiveauComplex ||
      !selectedTypeActivite
    ) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (!parametreActif) {
      toast.error(
        "Aucun paramètre académique actif — contactez l'administrateur",
      );
      return;
    }
    try {
      setSaving(true);
      await activiteService.create({
        id_ens: selectedEnseignant,
        id_cours: selectedCours,
        id_niv_complex: selectedNiveauComplex,
        id_typ_activite: selectedTypeActivite,
        id_param: parametreActif.id_param,
        id_res: selectedResource,
        vol_hor_cal: volumeHoraire,
      });
      toast.success("Production enregistrée avec succès");
      const updated = await activiteService.getAll();
      setHistorique(updated.slice(0, 20));
      resetForm();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(error?.response?.data?.message ?? error?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleApprouver = async (activite: ActivitePedagogique) => {
    try {
      setActionId(activite.id_activite);
      setOpenMenuId(null);
      await activiteService.update(activite.id_activite, {
        statut: "approuve",
      });
      toast.success("Production validée avec succès");
      const updated = await activiteService.getAll();
      setHistorique(updated.slice(0, 20));
    } catch {
      toast.error("Erreur lors de l'approbation");
    } finally {
      setActionId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await activiteService.delete(deleteTarget.id_activite);
      toast.success("Production supprimée");
      const updated = await activiteService.getAll();
      setHistorique(updated.slice(0, 20));
      setDeleteTarget(null);
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const getRowData = (activite: ActivitePedagogique) => {
    const ens = enseignants.find(
      (e) => Number(e.id_ens) === Number(activite.id_ens),
    );
    const crs = cours.find(
      (c) => Number(c.id_cours) === Number(activite.id_cours),
    );
    const niv = niveauxComplexite.find(
      (n) => Number(n.id_niv_complex) === Number(activite.id_niv_complex),
    );
    const typ = typesActivite.find(
      (t) => Number(t.id_typ_activite) === Number(activite.id_typ_activite),
    );
    return { ens, crs, niv, typ };
  };

  const sortedHistorique = [...historique].sort((a, b) => {
    if (!sortField) return 0;
    const da = getRowData(a);
    const db = getRowData(b);
    let valA: string | number = "";
    let valB: string | number = "";
    if (sortField === "lib_niv_complex") {
      valA = da.niv?.lib_niv_complex ?? "";
      valB = db.niv?.lib_niv_complex ?? "";
    } else if (sortField === "vol_hor_cal") {
      valA = Number(a.vol_hor_cal);
      valB = Number(b.vol_hor_cal);
    } else if (sortField === "statut") {
      valA = a.statut ?? "";
      valB = b.statut ?? "";
    } else if (sortField === "lib_activite") {
      valA = da.typ?.lib_activite ?? "";
      valB = db.typ?.lib_activite ?? "";
    }
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const buildExportRows = () =>
    sortedHistorique.map((a) => {
      const { ens, crs, niv, typ } = getRowData(a);
      return {
        Enseignant: ens ? `${ens.nom_ens} ${ens.pren_ens}` : `#${a.id_ens}`,
        Cours: crs?.int_cours ?? `#${a.id_cours}`,
        "Type d'action": typ?.lib_activite ?? `#${a.id_typ_activite}`,
        Complexité: niv?.lib_niv_complex ?? `#${a.id_niv_complex}`,
        "VH Calculé": Number(a.vol_hor_cal).toFixed(2),
        Statut: a.statut === "approuve" ? "Validé" : "En attente",
      };
    });

  const exportExcel = async () => {
    const rows = buildExportRows();
    if (!rows.length) {
      toast.warning("Aucune donnée à exporter");
      return;
    }
    setLoadingExport("excel");
    try {
      const anneeLabel = parametreActif
        ? `${parametreActif.annee_acad}-${Number(parametreActif.annee_acad) + 1}`
        : String(new Date().getFullYear());
      const dateStr = new Date().toLocaleDateString("fr-FR");
      const dateFile = new Date().toISOString().split("T")[0];
      const totalVH = rows.reduce((sum, r) => sum + parseFloat(r["VH Calculé"]), 0);
      const nbValides = rows.filter((r) => r.Statut === "Validé").length;

      const wb = new ExcelJS.Workbook();
      wb.creator = "GAAP-UVCI";
      const ws = wb.addWorksheet("Productions");
      ws.columns = [{ width: 34 }, { width: 40 }, { width: 24 }, { width: 22 }, { width: 16 }, { width: 14 }];

      ws.addRow(["UNIVERSITÉ VIRTUELLE DE CÔTE D'IVOIRE"]);
      STYLE.title(ws, 1, 6);
      ws.addRow(["PRODUCTIONS PÉDAGOGIQUES — GAAP-UVCI"]);
      STYLE.subtitle(ws, 2, 6);
      ws.addRow([`Année académique : ${anneeLabel}`]);
      STYLE.dateRow(ws, 3, 6);
      ws.addRow([`Exporté le ${dateStr} — ${rows.length} enregistrement(s) — ${nbValides} validé(s)`]);
      STYLE.dateRow(ws, 4, 6);
      ws.addRow([]);

      ws.addRow(["Enseignant", "Cours", "Type d'action", "Complexité", "VH Calculé (h)", "Statut"]);
      STYLE.headers(ws, 6);
      ws.views = [{ state: "frozen", xSplit: 0, ySplit: 6 }];

      rows.forEach((r, idx) => {
        const row = ws.addRow([
          r.Enseignant,
          r.Cours,
          r["Type d'action"],
          r.Complexité,
          parseFloat(r["VH Calculé"]),
          r.Statut,
        ]);
        STYLE.dataRow(ws, row.number, idx % 2 === 1);
        row.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
        row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
      });

      ws.addRow([]);
      const totRow = ws.addRow(["", "", "", "", Number(totalVH.toFixed(2)), "TOTAL VH"]);
      STYLE.totalRow(ws, totRow.number);
      totRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };

      const blob = await wbToBlob(wb);
      dlBlob(blob, `productions_${dateFile}.xlsx`);
      toast.success("Fichier Excel téléchargé");
    } catch {
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setLoadingExport(null);
    }
  };

  const exportPDF = async () => {
    if (!historique.length) {
      toast.warning("Aucune donnée à exporter");
      return;
    }
    setLoadingExport("pdf");
    try {
      const params = new URLSearchParams();
      if (parametreActif?.id_param) params.set("id_param", String(parametreActif.id_param));
      const response = await api.get(`/exports/productions/pdf?${params.toString()}`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `productions_${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("PDF téléchargé avec succès");
    } catch {
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setLoadingExport(null);
    }
  };

  const derniereSaisie = historique[0];
  const dernierData = derniereSaisie ? getRowData(derniereSaisie) : null;

  return (
    <div className="min-h-screen p-3 md:p-4 text-base-content">
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-base-100 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-base-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} className="text-error" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-base-content text-lg">
                  Supprimer la production ?
                </h3>
                <p className="text-sm text-neutral mt-1">
                  Cette action est irréversible. La production de{" "}
                  <span className="font-bold text-base-content">
                    {dernierData?.ens
                      ? `${getRowData(deleteTarget).ens?.nom_ens} ${getRowData(deleteTarget).ens?.pren_ens}`
                      : `#${deleteTarget.id_ens}`}
                  </span>{" "}
                  sera définitivement supprimée.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-neutral hover:text-base-content"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn btn-ghost rounded-xl flex-1 normal-case font-bold"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="btn btn-error rounded-xl flex-1 normal-case font-black gap-2"
              >
                <Trash2 size={16} />
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-slide-up">
        <div>
          <p className="uppercase tracking-[0.25em] text-[10px] font-black text-primary">
            Portail Académique
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-base-content mt-1">
            Saisie de Production Pédagogique
          </h1>
          <p className="text-sm opacity-70 flex items-center gap-1.5 mt-1">
            <Info className="w-4 h-4 text-primary" />
            Enregistrez les nouvelles productions pour calcul automatique du
            Volume Horaire.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={async () => {
              await loadData();
              resetForm();
            }}
            className="btn btn-ghost bg-base-100/50 hover:bg-base-300 flex-1 sm:flex-none gap-2"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={handleValider}
            disabled={saving}
            className="btn btn-primary text-primary-content px-6 flex-1 sm:flex-none"
          >
            {saving ? "Enregistrement..." : "Valider"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-slide-up anim-d1">
        <div className="lg:col-span-2 bg-base-100 p-6 rounded-box shadow-sm space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="badge badge-primary font-bold w-6 h-6 rounded-full p-0 flex items-center justify-center text-sm">
                1
              </span>
              <h2 className="text-lg font-semibold">
                Identification de l'Enseignant
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label font-medium text-sm opacity-80">
                  Sélectionner l'Enseignant
                </label>
                {loading ? (
                  <div className="skeleton h-12 w-full rounded-lg"></div>
                ) : (
                  <select
                    value={selectedEnseignant}
                    onChange={(e) => setSelectedEnseignant(Number(e.target.value))}
                    className="select select-bordered w-full bg-white border-[#ead2e6] rounded-lg text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value={0} disabled>Choisir un enseignant</option>
                    {enseignants.map((e) => (
                      <option key={e.id_ens} value={e.id_ens}>{e.nom_ens} {e.pren_ens}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-control w-full">
                <label className="label font-medium text-sm opacity-80">
                  Cours
                </label>
                {loading ? (
                  <div className="skeleton h-12 w-full rounded-lg"></div>
                ) : (
                  <select
                    value={selectedCours}
                    onChange={(e) => handleCoursChange(Number(e.target.value))}
                    className="select select-bordered w-full bg-white border-[#ead2e6] rounded-lg text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value={0} disabled>Choisir un cours</option>
                    {cours.map((c) => (
                      <option key={c.id_cours} value={c.id_cours}>{c.int_cours}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="badge badge-primary font-bold w-6 h-6 rounded-full p-0 flex items-center justify-center text-sm">
                2
              </span>
              <h2 className="text-lg font-semibold">
                Détails de la Production
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label font-medium text-sm opacity-80">
                  Type d'action
                </label>
                <div className="flex gap-2 flex-wrap">
                  {typesActivite.map((t) => (
                    <button
                      key={t.id_typ_activite}
                      type="button"
                      onClick={() =>
                        setSelectedTypeActivite(Number(t.id_typ_activite))
                      }
                      className={`btn flex-1 transition-all ${Number(selectedTypeActivite) === Number(t.id_typ_activite) ? "btn-primary" : "btn-outline border-base-300 text-base-content/70 hover:bg-base-200"}`}
                    >
                      {t.lib_activite}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-control">
                <label className="label font-medium text-sm opacity-80 flex items-center gap-2">
                  Niveau de Complexité
                  {niveauAutoFilled && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={10} /> Auto — selon le cours
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {niveauxComplexite.map((n) => {
                    const isSelected = Number(selectedNiveauComplex) === Number(n.id_niv_complex);
                    return (
                      <button
                        key={n.id_niv_complex}
                        type="button"
                        onClick={() => {
                          setSelectedNiveauComplex(Number(n.id_niv_complex));
                          setNiveauAutoFilled(false);
                        }}
                        className={`btn transition-all relative ${isSelected ? "btn-primary" : "btn-outline border-base-300 text-base-content/70 hover:bg-base-200"}`}
                      >
                        {n.lib_niv_complex}
                        {isSelected && niveauAutoFilled && (
                          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {niveauAutoFilled && (
                  <p className="text-[10px] text-primary/60 italic mt-1">
                    Niveau déduit du type de ressource associé au cours. Vous pouvez modifier manuellement.
                  </p>
                )}
              </div>
            </div>
            <div className="form-control w-full">
              <label className="label font-medium text-sm opacity-80">
                Nombre de Séquences / Unités
              </label>
              <input
                type="number"
                value={nbSequences}
                onChange={(e) =>
                  setNbSequences(Math.max(0, Number(e.target.value)))
                }
                min={0}
                className="input input-bordered w-full bg-transparent border-[#ead2e6] rounded-lg font-semibold outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <label className="label">
                <span className="label-text-alt opacity-50 italic">
                  {coursSelectionne
                    ? `Cours "${coursSelectionne.int_cours}" — ${coursSelectionne.nb_heures}h × 4 = ${Number(coursSelectionne.nb_heures) * 4} séquences`
                    : "Sélectionnez un cours pour auto-remplir"}
                </span>
              </label>
            </div>
            <div className="form-control w-full">
              <label className="label font-medium text-sm opacity-80">
                Ressource pédagogique{" "}
                <span className="opacity-40 font-normal">(optionnel)</span>
              </label>
              {loading ? (
                <div className="skeleton h-12 w-full rounded-lg"></div>
              ) : coursRessources.length === 0 ? (
                <p className="text-sm italic opacity-40 py-2">
                  Aucune ressource disponible pour ce cours — créez-en depuis Gestion des Cours.
                </p>
              ) : (
                <select
                  value={selectedResource ?? 0}
                  onChange={(e) =>
                    setSelectedResource(Number(e.target.value) || null)
                  }
                  className="select select-bordered w-full bg-white border-[#ead2e6] rounded-lg text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value={0}>— Aucune ressource —</option>
                  {coursRessources.map((r) => (
                    <option key={r.id_res} value={r.id_res}>
                      {r.titre_res}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-primary text-primary-content shadow-xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <span className="badge bg-white/20 text-white border-none text-[10px] font-bold tracking-wider px-2 py-1 uppercase rounded">
                Temps Réel
              </span>
            </div>
            <p className="text-sm font-medium uppercase opacity-70 tracking-wide">
              Volume Horaire (VH)
            </p>
            <div className="flex items-baseline gap-1 my-2">
              <span className="text-5xl font-black tracking-tight">
                {volumeHoraire.toFixed(2)}
              </span>
              <span className="text-sm font-bold uppercase opacity-80">
                Heures
              </span>
            </div>
            <div className="border-t border-white/10 my-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between opacity-85">
                <span>
                  Coefficient ({niveauSelectionne?.lib_niv_complex ?? "—"})
                </span>
                <span className="font-semibold">× {coeff}</span>
              </div>
              <div className="flex justify-between opacity-85">
                <span>Action : {typeSelectionne?.lib_activite ?? "—"}</span>
                <span className="font-semibold">× {multiplicateur}</span>
              </div>
              <div className="flex justify-between opacity-85">
                <span>Séquences</span>
                <span className="font-semibold">{nbSequences}</span>
              </div>
            </div>
            <div className="border-t border-white/20 pt-4 flex justify-between items-center font-bold text-sm">
              <span className="uppercase tracking-wider text-sm opacity-90">
                Total Calculé
              </span>
              <span className="text-lg">{volumeHoraire.toFixed(2)} VH</span>
            </div>
          </div>

          <div className="bg-base-100 p-5 rounded-box shadow-sm border border-base-200 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Règles UVCI
            </h3>
            <ul className="space-y-3 text-sm leading-relaxed opacity-90">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Formule :</strong> VH = Séquences × Coeff ×
                  Multiplicateur
                </span>
              </li>
              {typesActivite.map((t) => (
                <li
                  key={t.id_typ_activite}
                  className="flex items-start gap-2.5"
                >
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>
                    <strong>{t.lib_activite} :</strong> ×{t.multiplicateur_base}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {derniereSaisie && dernierData ? (
            <div className="bg-base-100 p-5 rounded-box shadow-sm border border-base-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-60">
                  Dernière Saisie
                </h3>
                <span
                  className={`badge text-[10px] font-bold border-none ${derniereSaisie.statut === "approuve" ? "badge-success" : "badge-warning"}`}
                >
                  {derniereSaisie.statut === "approuve"
                    ? "Validé"
                    : "En attente"}
                </span>
              </div>
              <div className="bg-base-200 p-4 rounded-xl border-l-4 border-primary space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-black text-base-content">
                      {dernierData.ens
                        ? `${dernierData.ens.nom_ens} ${dernierData.ens.pren_ens}`
                        : `#${derniereSaisie.id_ens}`}
                    </p>
                    <p className="text-sm text-neutral mt-0.5">
                      {dernierData.crs?.int_cours ??
                        `Cours #${derniereSaisie.id_cours}`}
                    </p>
                  </div>
                  <span className="text-xl font-black text-primary">
                    {Number(derniereSaisie.vol_hor_cal).toFixed(2)} VH
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {dernierData.niv && (
                    <span className="badge badge-ghost badge-sm font-medium">
                      {dernierData.niv.lib_niv_complex}
                    </span>
                  )}
                  {dernierData.typ && (
                    <span className="badge badge-ghost badge-sm font-medium">
                      {dernierData.typ.lib_activite}
                    </span>
                  )}
                  <span className="badge badge-ghost badge-sm font-medium">
                    {new Date(derniereSaisie.date_saisie).toLocaleDateString(
                      "fr-FR",
                      { timeZone: "UTC" },
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-base-100 p-5 rounded-box shadow-sm border border-base-200 text-center">
              <p className="text-sm text-neutral">Aucune saisie récente</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-base-100 rounded-box shadow-sm overflow-hidden animate-slide-up anim-d2">
        <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-base-200">
          <h2 className="text-base font-bold">Historique des productions</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={exportExcel}
              disabled={loadingExport !== null}
              className="btn btn-sm btn-ghost gap-2 border border-base-300 rounded-xl"
            >
              {loadingExport === "excel" ? <Loader2 size={15} className="animate-spin text-green-600" /> : <FileSpreadsheet size={15} className="text-green-600" />}
              {loadingExport === "excel" ? "Génération..." : "Excel (.xlsx)"}
            </button>
            <button
              type="button"
              onClick={exportPDF}
              disabled={loadingExport !== null}
              className="btn btn-sm btn-ghost gap-2 border border-base-300 rounded-xl"
            >
              {loadingExport === "pdf" ? <Loader2 size={15} className="animate-spin text-red-500" /> : <FileText size={15} className="text-red-500" />}
              {loadingExport === "pdf" ? "Génération..." : "PDF"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full" ref={menuRef}>
          {loading ? (
            <table className="table table-zebra w-full text-sm md:text-sm">
              <thead>
                <tr className="bg-base-200/50 uppercase text-[11px] tracking-wider">
                  <th>Enseignant</th><th>Cours</th><th>Type d'action</th><th>Complexité</th><th className="text-right">VH Calculé</th><th className="text-center">Statut</th><th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-28"></div></td>
                    <td><div className="skeleton h-3 w-32"></div></td>
                    <td><div className="skeleton h-5 w-20 rounded-full"></div></td>
                    <td><div className="skeleton h-5 w-16 rounded-full"></div></td>
                    <td className="text-right"><div className="skeleton h-3 w-12 ml-auto"></div></td>
                    <td className="text-center"><div className="skeleton h-5 w-20 rounded-full mx-auto"></div></td>
                    <td className="text-center"><div className="skeleton h-6 w-6 rounded-full mx-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : historique.length === 0 ? (
            <p className="text-sm text-neutral text-center py-10">
              Aucune production enregistrée
            </p>
          ) : (
            <table className="table table-zebra w-full text-sm md:text-sm">
              <thead>
                <tr className="bg-base-200/50 uppercase text-[11px] tracking-wider">
                  <th>Enseignant</th>
                  <th>Cours</th>
                  <th
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("lib_activite")}
                  >
                    <span className="flex items-center gap-1">
                      Type d'action <SortIcon field="lib_activite" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </th>
                  <th
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("lib_niv_complex")}
                  >
                    <span className="flex items-center gap-1">
                      Complexité <SortIcon field="lib_niv_complex" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </th>
                  <th
                    className="text-center cursor-pointer select-none"
                    onClick={() => handleSort("vol_hor_cal")}
                  >
                    <span className="flex items-center justify-center gap-1">
                      VH Calculé <SortIcon field="vol_hor_cal" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </th>
                  <th
                    className="text-center cursor-pointer select-none"
                    onClick={() => handleSort("statut")}
                  >
                    <span className="flex items-center justify-center gap-1">
                      Statut <SortIcon field="statut" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistorique.map((activite) => {
                  const { ens, crs, niv, typ } = getRowData(activite);
                  const isValide = activite.statut === "approuve";
                  const isLoading = actionId === activite.id_activite;
                  return (
                    <tr
                      key={activite.id_activite}
                      className="hover:bg-base-200/40 transition-colors"
                    >
                      <td className="font-bold">
                        {ens
                          ? `${ens.nom_ens} ${ens.pren_ens}`
                          : `#${activite.id_ens}`}
                      </td>
                      <td className="max-w-35 truncate">
                        {crs?.int_cours ?? `#${activite.id_cours}`}
                      </td>
                      <td>
                        <span className="badge badge-ghost badge-sm font-medium">
                          {typ?.lib_activite ?? `#${activite.id_typ_activite}`}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-base-200 text-base-content border-none text-[11px]">
                          {niv?.lib_niv_complex ??
                            `#${activite.id_niv_complex}`}
                        </span>
                      </td>
                      <td className="font-black text-center text-primary">
                        {Number(activite.vol_hor_cal).toFixed(2)}
                      </td>
                      <td className="text-center">
                        {isValide ? (
                          <span className="badge badge-success font-bold text-[10px] uppercase px-2 border-none">
                            Validé
                          </span>
                        ) : (
                          <span className="badge badge-warning font-bold text-[10px] uppercase px-2 border-none">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="text-center relative">
                        {isLoading ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : (
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === activite.id_activite
                                    ? null
                                    : activite.id_activite,
                                )
                              }
                              className="btn btn-ghost btn-sm btn-circle"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openMenuId === activite.id_activite && (
                              <div className="absolute right-0 z-50 mt-1 w-44 bg-base-100 border border-base-300 rounded-xl shadow-xl overflow-hidden">
                                {!isValide && (
                                  <button
                                    type="button"
                                    onClick={() => handleApprouver(activite)}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-success/10 text-success font-bold transition-colors"
                                  >
                                    <CheckCircle2 size={15} />
                                    Valider
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteTarget(activite);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-error/10 text-error font-bold transition-colors"
                                >
                                  <Trash2 size={15} />
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
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
    </div>
  );
}
