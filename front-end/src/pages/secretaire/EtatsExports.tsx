import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Clock,
  CreditCard,
  BarChart3,
  Download,
  ChevronDown,
  FileSpreadsheet,
  History,
  Users,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  ExcelJS,
  STYLE,
  wbToBlob,
  downloadBlob as dlBlob,
} from "../../utils/excelBuilder";
import {
  enseignantService,
  type Enseignant,
} from "../../services/enseignant.service";
import api from "../../api/axios";

interface ExportRecord {
  nom: string;
  type: "PDF" | "XLSX" | "CSV";
  date: string;
  url: string;
}

interface StatsPeda {
  total_enseignants?: number;
  total_heures?: number;
  total_activites?: number;
  [key: string]: unknown;
}

export default function CentreDocuments() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [selectedEnseignant, setSelectedEnseignant] = useState<number>(0);
  const [stats, setStats] = useState<StatsPeda | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingExport, setLoadingExport] = useState<string | null>(null);
  const [exportsRecents, setExportsRecents] = useState<ExportRecord[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [enseignantsData, statsData] = await Promise.all([
        enseignantService.getAll(),
        api
          .get("/etats/statistiques-pedagogiques")
          .then((r) => r.data.data ?? null)
          .catch(() => null),
      ]);
      setEnseignants(enseignantsData);
      if (enseignantsData.length > 0)
        setSelectedEnseignant(Number(enseignantsData[0].id_ens));
      setStats(statsData);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addExport = (
    nom: string,
    type: "PDF" | "XLSX" | "CSV",
    url: string,
  ) => {
    setExportsRecents((prev) => [
      { nom, type, date: new Date().toLocaleDateString("fr-FR"), url },
      ...prev.slice(0, 4),
    ]);
  };

  const downloadBlob = async (
    url: string,
    filename: string,
    type: "PDF" | "XLSX" | "CSV",
  ) => {
    try {
      const response = await api.get(url, { responseType: "blob" });
      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      addExport(filename, type, url);
      toast.success(`${filename} téléchargé`);
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  /* ─── Données communes pour les exports enseignant ─── */
  const fetchEnseignantData = async (idEns: number) => {
    const ens = enseignants.find((e) => Number(e.id_ens) === idEns);
    if (!ens) throw new Error("Enseignant introuvable");

    const [activites, grades, statuts, departements, cours, niveaux, types] =
      await Promise.all([
        api.get("/activites-pedagogiques").then((r) =>
          (r.data.data ?? []).filter(
            (a: Record<string, unknown>) => Number(a.id_ens) === idEns,
          ),
        ),
        api.get("/grades").then((r) => r.data.data ?? []),
        api.get("/statuts").then((r) => r.data.data ?? []),
        api.get("/departements").then((r) => r.data.data ?? []),
        api.get("/cours").then((r) => r.data.data ?? []),
        api.get("/niveaux-complexite").then((r) => r.data.data ?? []),
        api.get("/types-activites").then((r) => r.data.data ?? []),
      ]);

    const grade = grades.find(
      (g: Record<string, unknown>) => Number(g.id_grade) === Number(ens.id_grade),
    );
    const statut = statuts.find(
      (s: Record<string, unknown>) => Number(s.id_statut) === Number(ens.id_statut),
    );
    const depart = departements.find(
      (d: Record<string, unknown>) => Number(d.id_depart) === Number(ens.id_depart),
    );

    const isVacataire = (statut as Record<string,unknown>)?.lib_statut
      ? String((statut as Record<string,unknown>).lib_statut).toLowerCase().includes("vacataire")
      : false;
    const tauxHoraire = isVacataire
      ? Number((grade as Record<string,unknown>)?.taux_hor_vacataire ?? 0)
      : Number((grade as Record<string,unknown>)?.taux_hor_permanent ?? 0);

    return { ens, activites, grade, statut, depart, cours, niveaux, types, tauxHoraire };
  };

  /* ─── PDF Fiche individuelle → backend DomPDF ─── */
  const handleFicheEnseignantPDF = async () => {
    if (!selectedEnseignant) { toast.warning("Sélectionnez un enseignant"); return; }
    const ens = enseignants.find((e) => Number(e.id_ens) === selectedEnseignant);
    const filename = ens ? `Fiche_${ens.nom_ens}_${ens.pren_ens}.pdf` : `fiche-enseignant-${selectedEnseignant}.pdf`;
    setLoadingExport("fiche-pdf");
    try {
      await downloadBlob(`/exports/enseignants/${selectedEnseignant}/pdf`, filename, "PDF");
    } finally {
      setLoadingExport(null);
    }
  };

  /* ─── Excel Fiche individuelle (ExcelJS) ─── */
  const handleFicheEnseignantExcel = async () => {
    if (!selectedEnseignant) { toast.warning("Sélectionnez un enseignant"); return; }
    setLoadingExport("fiche-xlsx");
    try {
      const { ens, activites, grade, statut, depart, cours, niveaux, types, tauxHoraire } =
        await fetchEnseignantData(selectedEnseignant);

      const totalVH = activites.reduce((s: number, a: Record<string, unknown>) => s + Number(a.vol_hor_cal ?? 0), 0);
      const validated = activites.filter((a: Record<string, unknown>) => a.statut === "approuve").length;
      const today = new Date().toLocaleDateString("fr-FR");
      const dateFile = new Date().toISOString().split("T")[0];

      const wb = new ExcelJS.Workbook();
      wb.creator = "GAAP-UVCI";

      // ── Feuille 1 : Informations ─────────────────────────
      const wsInfo = wb.addWorksheet("Informations");
      wsInfo.columns = [{ width: 30 }, { width: 42 }];

      wsInfo.addRow(["FICHE INDIVIDUELLE ENSEIGNANT — GAAP-UVCI"]);
      STYLE.title(wsInfo, 1, 2);
      wsInfo.addRow([`${ens.nom_ens} ${ens.pren_ens} — Exporté le ${today}`]);
      STYLE.subtitle(wsInfo, 2, 2);
      wsInfo.addRow([]);

      const infoRows: [string, string | number][] = [
        ["NOM", ens.nom_ens],
        ["PRÉNOM", ens.pren_ens],
        ["EMAIL", ens.email_ens],
        ["TÉLÉPHONE", ens.tel_ens || "—"],
        ["GRADE", (grade as Record<string, unknown>)?.lib_grade as string ?? "—"],
        ["STATUT", (statut as Record<string, unknown>)?.lib_statut as string ?? "—"],
        ["DÉPARTEMENT", (depart as Record<string, unknown>)?.lib_depart as string ?? "—"],
        ["TAUX HORAIRE (FCFA/h)", tauxHoraire],
        ["IDENTIFIANT", ens.user_log_ens || "—"],
      ];
      for (const [key, val] of infoRows) {
        const r = wsInfo.addRow([key, val]);
        r.height = 18;
        r.getCell(1).font = { bold: true, size: 9, name: "Calibri" };
        r.getCell(2).font = { size: 9, name: "Calibri" };
        r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDE9FE" } };
      }

      wsInfo.addRow([]);
      const recapRow = wsInfo.addRow(["RÉCAPITULATIF"]);
      recapRow.height = 20;
      recapRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF5A0661" }, name: "Calibri" };
      wsInfo.mergeCells(recapRow.number, 1, recapRow.number, 2);

      const recapData: [string, number][] = [
        ["Total productions", activites.length],
        ["Total VH calculé (h)", Number(totalVH.toFixed(2))],
        ["Productions validées", validated],
        ["En attente", activites.length - validated],
      ];
      for (const [key, val] of recapData) {
        const r = wsInfo.addRow([key, val]);
        r.height = 18;
        r.getCell(1).font = { size: 9, name: "Calibri" };
        r.getCell(2).font = { bold: true, size: 9, name: "Calibri" };
        r.getCell(2).alignment = { horizontal: "right" };
      }

      // ── Feuille 2 : Historique ───────────────────────────
      const wsHist = wb.addWorksheet("Historique");
      wsHist.columns = [
        { width: 5 }, { width: 36 }, { width: 22 }, { width: 22 },
        { width: 14 }, { width: 16 }, { width: 14 },
      ];

      wsHist.addRow([`HISTORIQUE DES PRODUCTIONS — ${ens.nom_ens} ${ens.pren_ens}`]);
      STYLE.title(wsHist, 1, 7);
      wsHist.addRow([`Exporté le ${today}`]);
      STYLE.subtitle(wsHist, 2, 7);
      wsHist.addRow([]);

      wsHist.addRow(["N°", "Cours", "Type d'activité", "Complexité", "VH (h)", "Date", "Statut"]);
      STYLE.headers(wsHist, 4);
      wsHist.views = [{ state: "frozen", xSplit: 0, ySplit: 4 }];

      activites.forEach((a: Record<string, unknown>, idx: number) => {
        const c = cours.find((x: Record<string, unknown>) => Number(x.id_cours) === Number(a.id_cours)) as Record<string, unknown> | undefined;
        const n = niveaux.find((x: Record<string, unknown>) => Number(x.id_niv_complex) === Number(a.id_niv_complex)) as Record<string, unknown> | undefined;
        const t = types.find((x: Record<string, unknown>) => Number(x.id_typ_activite) === Number(a.id_typ_activite)) as Record<string, unknown> | undefined;
        const date = a.date_saisie ? new Date(a.date_saisie as string).toLocaleDateString("fr-FR", { timeZone: "UTC" }) : "—";
        const row = wsHist.addRow([
          idx + 1,
          (c?.int_cours as string) ?? `#${a.id_cours}`,
          (t?.lib_activite as string) ?? "—",
          (n?.lib_niv_complex as string) ?? "—",
          Number(Number(a.vol_hor_cal).toFixed(2)),
          date,
          a.statut === "approuve" ? "Validé" : "En attente",
        ]);
        STYLE.dataRow(wsHist, row.number, idx % 2 === 1);
        row.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
      });

      wsHist.addRow([]);
      const totRow = wsHist.addRow(["", "", "", "TOTAL VH", Number(totalVH.toFixed(2)), "", ""]);
      STYLE.totalRow(wsHist, totRow.number);
      totRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };

      const blob = await wbToBlob(wb);
      dlBlob(blob, `Fiche_${ens.nom_ens}_${ens.pren_ens}_${dateFile}.xlsx`);
      addExport(`Fiche_${ens.nom_ens}_${ens.pren_ens}`, "XLSX", "");
      toast.success(`Export Excel de ${ens.nom_ens} ${ens.pren_ens} téléchargé`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération de l'export Excel");
    } finally {
      setLoadingExport(null);
    }
  };

  const handleEtatGlobalPDF = async () => {
    setLoadingExport("heures-pdf");
    try {
      await downloadBlob("/exports/heures/pdf", `Etat_Global_${new Date().toISOString().split("T")[0]}.pdf`, "PDF");
    } finally {
      setLoadingExport(null);
    }
  };

  const handleEtatGlobalExcel = async () => {
    setLoadingExport("heures-xlsx");
    try {
      const [allEnseignants, allActivites] = await Promise.all([
        enseignantService.getAll(),
        api.get("/activites-pedagogiques").then((r) => r.data.data ?? []),
      ]);
      const byEns: Record<number, { count: number; volume: number }> = {};
      for (const act of allActivites as Record<string, unknown>[]) {
        const id = Number(act.id_ens);
        if (!byEns[id]) byEns[id] = { count: 0, volume: 0 };
        byEns[id].count++;
        byEns[id].volume += Number(act.vol_hor_cal);
      }
      const dataRows = allEnseignants
        .filter((e: Enseignant) => byEns[Number(e.id_ens)])
        .map((e: Enseignant, i: number) => {
          const d = byEns[Number(e.id_ens)];
          return [i + 1, e.nom_ens, e.pren_ens, d.count, Number(d.volume.toFixed(2))];
        });
      const totalVH  = dataRows.reduce((s, r) => s + (r[4] as number), 0);
      const totalAct = dataRows.reduce((s, r) => s + (r[3] as number), 0);
      const today    = new Date().toLocaleDateString("fr-FR");
      const dateFile = new Date().toISOString().split("T")[0];

      const wb = new ExcelJS.Workbook();
      wb.creator = "GAAP-UVCI";
      const ws = wb.addWorksheet("État Heures");
      ws.columns = [{ width: 5 }, { width: 26 }, { width: 24 }, { width: 16 }, { width: 22 }];

      ws.addRow(["UNIVERSITÉ VIRTUELLE DE CÔTE D'IVOIRE"]);
      STYLE.title(ws, 1, 5);
      ws.addRow(["ÉTAT GLOBAL DES HEURES PÉDAGOGIQUES — GAAP-UVCI"]);
      STYLE.subtitle(ws, 2, 5);
      ws.addRow([`Exporté le ${today}   •   ${dataRows.length} enseignant(s)`]);
      STYLE.dateRow(ws, 3, 5);
      ws.addRow([]);

      ws.addRow(["N°", "NOM", "PRÉNOM", "NB. ACTIVITÉS", "VOLUME HORAIRE (H)"]);
      STYLE.headers(ws, 5);
      ws.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];

      dataRows.forEach((row, idx) => {
        const r = ws.addRow(row);
        STYLE.dataRow(ws, r.number, idx % 2 === 1);
        r.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
        r.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
      });

      ws.addRow([]);
      const totRow = ws.addRow(["", "", "", totalAct, Number(totalVH.toFixed(2))]);
      STYLE.totalRow(ws, totRow.number);
      totRow.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      totRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };

      const blob = await wbToBlob(wb);
      dlBlob(blob, `Etat_Global_${dateFile}.xlsx`);
      addExport(`Etat_Global_${dateFile}`, "XLSX", "");
      toast.success("Export Excel téléchargé");
    } catch {
      toast.error("Erreur lors de la génération de l'export Excel");
    } finally {
      setLoadingExport(null);
    }
  };

  const handlePaiementsPDF = async () => {
    setLoadingExport("paiements-pdf");
    try {
      await downloadBlob("/exports/paiements/pdf", `Paiements_${new Date().toISOString().split("T")[0]}.pdf`, "PDF");
    } finally {
      setLoadingExport(null);
    }
  };

  const handlePaiementsExcel = async () => {
    setLoadingExport("paiements-xlsx");
    try {
      const [allEnseignants, allActivites, gradesData, statutsData] = await Promise.all([
        enseignantService.getAll(),
        api.get("/activites-pedagogiques").then((r) => r.data.data ?? []),
        api.get("/grades").then((r) => r.data.data ?? []),
        api.get("/statuts").then((r) => r.data.data ?? []),
      ]);
      const byEns: Record<number, { count: number; volume: number }> = {};
      for (const act of allActivites as Record<string, unknown>[]) {
        const id = Number(act.id_ens);
        if (!byEns[id]) byEns[id] = { count: 0, volume: 0 };
        byEns[id].count++;
        byEns[id].volume += Number(act.vol_hor_cal);
      }
      const dataRows = allEnseignants
        .filter((e: Enseignant) => byEns[Number(e.id_ens)])
        .map((e: Enseignant, i: number) => {
          const d = byEns[Number(e.id_ens)];
          const grade = (gradesData as Record<string, unknown>[]).find(
            (g) => Number(g.id_grade) === Number(e.id_grade),
          );
          const statut = (statutsData as Record<string, unknown>[]).find(
            (s) => Number(s.id_statut) === Number(e.id_statut),
          );
          const isVacataire = statut?.lib_statut
            ? String(statut.lib_statut).toLowerCase().includes("vacataire")
            : false;
          const taux = isVacataire
            ? Number(grade?.taux_hor_vacataire ?? 0)
            : Number(grade?.taux_hor_permanent ?? 0);
          const montant = Math.round(d.volume * taux);
          return [i + 1, e.nom_ens, e.pren_ens, d.count, Number(d.volume.toFixed(2)), taux, montant];
        });
      const totalVH = dataRows.reduce((s, r) => s + (r[4] as number), 0);
      const totalMontant = dataRows.reduce((s, r) => s + (r[6] as number), 0);
      const today    = new Date().toLocaleDateString("fr-FR");
      const dateFile = new Date().toISOString().split("T")[0];

      const wb = new ExcelJS.Workbook();
      wb.creator = "GAAP-UVCI";
      const ws = wb.addWorksheet("Paiements");
      ws.columns = [
        { width: 5 }, { width: 26 }, { width: 24 }, { width: 14 },
        { width: 14 }, { width: 18 }, { width: 24 },
      ];

      ws.addRow(["UNIVERSITÉ VIRTUELLE DE CÔTE D'IVOIRE"]);
      STYLE.title(ws, 1, 7);
      ws.addRow(["ÉTAT DES PAIEMENTS ESTIMÉS — GAAP-UVCI"]);
      STYLE.subtitle(ws, 2, 7);
      ws.addRow([`Exporté le ${today}   •   ${dataRows.length} enseignant(s)`]);
      STYLE.dateRow(ws, 3, 7);
      ws.addRow([]);

      ws.addRow(["N°", "NOM", "PRÉNOM", "NB. ACT.", "VOLUME (H)", "TAUX (FCFA/H)", "MONTANT ESTIMÉ (FCFA)"]);
      STYLE.headers(ws, 5);
      ws.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];

      dataRows.forEach((row, idx) => {
        const r = ws.addRow(row);
        STYLE.dataRow(ws, r.number, idx % 2 === 1);
        [4, 5, 6, 7].forEach((c) => { r.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; });
      });

      ws.addRow([]);
      const totRow = ws.addRow(["", "", "", "", Number(totalVH.toFixed(2)), "", totalMontant]);
      STYLE.totalRow(ws, totRow.number);
      [5, 7].forEach((c) => { totRow.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; });

      const blob = await wbToBlob(wb);
      dlBlob(blob, `Paiements_${dateFile}.xlsx`);
      addExport(`Paiements_${dateFile}`, "XLSX", "");
      toast.success("Export Excel téléchargé");
    } catch {
      toast.error("Erreur lors de la génération de l'export Excel");
    } finally {
      setLoadingExport(null);
    }
  };

  /* ─── PDF Statistiques → backend DomPDF ─── */
  const handleStatsPDF = async () => {
    setLoadingExport("stats-pdf");
    try {
      await downloadBlob("/exports/statistiques/pdf", `Stats_Pedagogiques_${new Date().toISOString().split("T")[0]}.pdf`, "PDF");
    } finally {
      setLoadingExport(null);
    }
  };

  /* ─── Excel Statistiques + Production mensuelle (ExcelJS) ─── */
  const handleStatsExcel = async () => {
    setLoadingExport("stats-xlsx");
    try {
      const [allActivites, allEnseignants, typesData, departementsData] = await Promise.all([
        api.get("/activites-pedagogiques").then((r) => r.data.data ?? []),
        enseignantService.getAll(),
        api.get("/types-activites").then((r) => r.data.data ?? []),
        api.get("/departements").then((r) => r.data.data ?? []),
      ]);

      const acts = allActivites as Record<string, unknown>[];
      const today = new Date().toLocaleDateString("fr-FR");
      const dateFile = new Date().toISOString().split("T")[0];
      const moisFr: Record<string, string> = {
        "01":"Janvier","02":"Février","03":"Mars","04":"Avril",
        "05":"Mai","06":"Juin","07":"Juillet","08":"Août",
        "09":"Septembre","10":"Octobre","11":"Novembre","12":"Décembre",
      };

      const totalHeures = acts.reduce((s, a) => s + Number(a.vol_hor_cal ?? 0), 0);

      const wb = new ExcelJS.Workbook();
      wb.creator = "GAAP-UVCI";

      /* ── Feuille 1 : Récapitulatif ── */
      const wsRecap = wb.addWorksheet("Récapitulatif");
      wsRecap.columns = [{ width: 34 }, { width: 22 }];
      wsRecap.addRow(["UNIVERSITÉ VIRTUELLE DE CÔTE D'IVOIRE"]);
      STYLE.title(wsRecap, 1, 2);
      wsRecap.addRow(["RAPPORT DE STATISTIQUES PÉDAGOGIQUES — GAAP-UVCI"]);
      STYLE.subtitle(wsRecap, 2, 2);
      wsRecap.addRow([`Exporté le ${today}`]);
      STYLE.dateRow(wsRecap, 3, 2);
      wsRecap.addRow([]);
      const kpis: [string, number][] = [
        ["Enseignants actifs", allEnseignants.length],
        ["Total activités", acts.length],
        ["Volume horaire total (h)", Number(totalHeures.toFixed(2))],
      ];
      kpis.forEach(([k, v]) => {
        const r = wsRecap.addRow([k, v]);
        r.height = 20;
        r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
        r.getCell(2).font = { bold: true, size: 12, color: { argb: "FF5A0661" }, name: "Calibri" };
        r.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
      });

      /* ── Feuille 2 : Par type d'activité ── */
      const byType: Record<number, { label: string; count: number; volume: number }> = {};
      for (const a of acts) {
        const id = Number(a.id_typ_activite);
        const type = (typesData as Record<string, unknown>[]).find((t) => Number(t.id_typ_activite) === id);
        const label = (type?.lib_activite as string) ?? `Type #${id}`;
        if (!byType[id]) byType[id] = { label, count: 0, volume: 0 };
        byType[id].count++;
        byType[id].volume += Number(a.vol_hor_cal ?? 0);
      }
      const wsType = wb.addWorksheet("Par Type");
      wsType.columns = [{ width: 5 }, { width: 38 }, { width: 16 }, { width: 16 }, { width: 12 }];
      wsType.addRow([`RÉPARTITION PAR TYPE D'ACTIVITÉ — ${today}`]);
      STYLE.title(wsType, 1, 5);
      wsType.addRow([]);
      wsType.addRow(["N°", "TYPE D'ACTIVITÉ", "NB. ACTIVITÉS", "VOLUME (H)", "PART (%)"]);
      STYLE.headers(wsType, 3);
      wsType.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
      Object.values(byType).sort((a, b) => b.count - a.count).forEach((r, i) => {
        const row = wsType.addRow([i + 1, r.label, r.count, Number(r.volume.toFixed(2)), totalHeures > 0 ? Number(((r.volume / totalHeures) * 100).toFixed(1)) : 0]);
        STYLE.dataRow(wsType, row.number, i % 2 === 1);
        [3, 4, 5].forEach((c) => { row.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; });
      });
      wsType.addRow([]);
      const totType = wsType.addRow(["", "TOTAL", acts.length, Number(totalHeures.toFixed(2)), 100]);
      STYLE.totalRow(wsType, totType.number);
      [3, 4, 5].forEach((c) => { totType.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; });

      /* ── Feuille 3 : Par département ── */
      const byDept: Record<number, { label: string; count: number; volume: number }> = {};
      for (const a of acts) {
        const ens = allEnseignants.find((e) => Number(e.id_ens) === Number(a.id_ens));
        const idDept = Number(ens?.id_depart ?? 0);
        const dept = (departementsData as Record<string, unknown>[]).find((d) => Number(d.id_depart) === idDept);
        const label = (dept?.lib_depart as string) ?? `Département #${idDept}`;
        if (!byDept[idDept]) byDept[idDept] = { label, count: 0, volume: 0 };
        byDept[idDept].count++;
        byDept[idDept].volume += Number(a.vol_hor_cal ?? 0);
      }
      const wsDept = wb.addWorksheet("Par Département");
      wsDept.columns = [{ width: 5 }, { width: 42 }, { width: 16 }, { width: 18 }];
      wsDept.addRow([`RÉPARTITION PAR DÉPARTEMENT — ${today}`]);
      STYLE.title(wsDept, 1, 4);
      wsDept.addRow([]);
      wsDept.addRow(["N°", "DÉPARTEMENT", "NB. ACTIVITÉS", "VOLUME (H)"]);
      STYLE.headers(wsDept, 3);
      wsDept.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
      Object.values(byDept).sort((a, b) => b.volume - a.volume).forEach((r, i) => {
        const row = wsDept.addRow([i + 1, r.label, r.count, Number(r.volume.toFixed(2))]);
        STYLE.dataRow(wsDept, row.number, i % 2 === 1);
        [3, 4].forEach((c) => { row.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; });
      });

      /* ── Feuille 4 : Production mensuelle ── */
      const byMonth: Record<string, { count: number; volume: number }> = {};
      for (const a of acts) {
        if (!a.date_saisie) continue;
        const key = String(a.date_saisie).substring(0, 7);
        if (!byMonth[key]) byMonth[key] = { count: 0, volume: 0 };
        byMonth[key].count++;
        byMonth[key].volume += Number(a.vol_hor_cal ?? 0);
      }
      const wsMois = wb.addWorksheet("Production Mensuelle");
      wsMois.columns = [{ width: 5 }, { width: 24 }, { width: 16 }, { width: 18 }];
      wsMois.addRow([`PRODUCTION MENSUELLE — ${today}`]);
      STYLE.title(wsMois, 1, 4);
      wsMois.addRow([]);
      wsMois.addRow(["N°", "MOIS", "NB. ACTIVITÉS", "VOLUME (H)"]);
      STYLE.headers(wsMois, 3);
      wsMois.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
      let totalMonthVol = 0;
      let totalMonthAct = 0;
      Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).forEach(([key, d], i) => {
        const [year, m] = key.split("-");
        const label = `${moisFr[m] ?? key} ${year}`;
        const row = wsMois.addRow([i + 1, label, d.count, Number(d.volume.toFixed(2))]);
        STYLE.dataRow(wsMois, row.number, i % 2 === 1);
        [3, 4].forEach((c) => { row.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; });
        totalMonthVol += d.volume;
        totalMonthAct += d.count;
      });
      wsMois.addRow([]);
      const totMois = wsMois.addRow(["", "TOTAL", totalMonthAct, Number(totalMonthVol.toFixed(2))]);
      STYLE.totalRow(wsMois, totMois.number);
      [3, 4].forEach((c) => { totMois.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; });

      const blob = await wbToBlob(wb);
      dlBlob(blob, `Stats_Pedagogiques_${dateFile}.xlsx`);
      addExport(`Stats_Pedagogiques_${dateFile}`, "XLSX", "");
      toast.success("Export Excel statistiques téléchargé");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération de l'export Excel");
    } finally {
      setLoadingExport(null);
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-4 text-base-content">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-slide-up">
        <div>
          <p className="uppercase tracking-[0.25em] text-[10px] font-black text-primary">
            Portail Académique
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-base-content mt-1">
            Centre de Génération de Documents
          </h1>
          <p className="text-sm opacity-70 mt-1 max-w-2xl leading-relaxed">
            Générez et exportez vos états officiels en un clic. Tous les
            documents sont conformes aux standards académiques de l'UVCI.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="btn btn-ghost bg-base-100/50 hover:bg-base-300 gap-2 shrink-0"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 animate-slide-up anim-d1">
          {stats.total_enseignants != null && (
            <div className="bg-base-100 rounded-xl p-4 border border-base-300 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-neutral tracking-wider">
                  Enseignants
                </p>
                <p className="text-2xl font-black text-base-content">
                  {stats.total_enseignants}
                </p>
              </div>
            </div>
          )}
          {stats.total_heures != null && (
            <div className="bg-base-100 rounded-xl p-4 border border-base-300 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                <TrendingUp size={18} className="text-success" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-neutral tracking-wider">
                  Total Heures
                </p>
                <p className="text-2xl font-black text-base-content">
                  {Number(stats.total_heures).toFixed(0)}
                </p>
              </div>
            </div>
          )}
          {stats.total_activites != null && (
            <div className="bg-base-100 rounded-xl p-4 border border-base-300 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-warning" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-neutral tracking-wider">
                  Productions
                </p>
                <p className="text-2xl font-black text-base-content">
                  {stats.total_activites}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-stretch animate-slide-up anim-d2">
        <div className="card bg-base-100 shadow-sm rounded-xl p-6 flex flex-col justify-between border border-base-300">
          <div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-base-content mb-2">
              Fiche individuelle enseignant
            </h2>
            <p className="text-sm opacity-60 leading-relaxed mb-6">
              Historique complet des charges horaires, cours dispensés et
              validations par semestre pour un enseignant spécifique.
            </p>
          </div>
          <div className="space-y-4">
            <div className="form-control w-full">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-40 mb-1.5 block">
                Sélection Enseignant
              </span>
              <div className="relative w-full">
                <select
                  value={selectedEnseignant}
                  onChange={(e) =>
                    setSelectedEnseignant(Number(e.target.value))
                  }
                  className="select select-bordered w-full bg-primary/ text-white border-none text-sm font-semibold pr-10 focus:outline-none"
                >
                  <option value={0} disabled>
                    Choisir un enseignant
                  </option>
                  {enseignants.map((e) => (
                    <option key={e.id_ens} value={e.id_ens}>
                      {e.nom_ens} {e.pren_ens}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFicheEnseignantPDF}
                disabled={loadingExport !== null}
                className="btn bg-primary hover:bg-primary/90 text-white border-none flex-1 gap-2 text-sm rounded-xl"
              >
                {loadingExport === "fiche-pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {loadingExport === "fiche-pdf" ? "Génération..." : "PDF"}
              </button>
              <button
                type="button"
                onClick={handleFicheEnseignantExcel}
                disabled={loadingExport !== null}
                className="btn btn-outline border-base-300 text-base-content hover:bg-base-200 px-3 rounded-xl"
              >
                {loadingExport === "fiche-xlsx" ? <Loader2 className="w-4 h-4 animate-spin text-success" /> : <FileSpreadsheet className="w-4 h-4 text-success" />}
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm rounded-xl p-6 flex flex-col justify-between border-l-4 border-primary border-t border-r border-b border-base-300">
          <div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-base-content mb-2">
              État global des heures
            </h2>
            <p className="text-sm opacity-60 leading-relaxed mb-6">
              Synthèse de l'ensemble des heures effectuées par département et
              par cycle (Licence/Master).
            </p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-primary/5 p-2.5 rounded-xl">
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-40 block mb-0.5">
                  Période
                </span>
                <span className="text-sm font-bold block">Année en cours</span>
              </div>
              <div className="bg-primary/5 p-2.5 rounded-xl">
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-40 block mb-0.5">
                  Formats
                </span>
                <span className="text-sm font-bold block">PDF + XLSX</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEtatGlobalPDF}
                disabled={loadingExport !== null}
                className="btn bg-primary hover:bg-primary/90 text-white border-none flex-1 gap-2 text-sm rounded-xl"
              >
                {loadingExport === "heures-pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {loadingExport === "heures-pdf" ? "Génération..." : "PDF"}
              </button>
              <button
                type="button"
                onClick={handleEtatGlobalExcel}
                disabled={loadingExport !== null}
                className="btn btn-outline border-base-300 text-base-content hover:bg-base-200 px-3 rounded-xl"
              >
                {loadingExport === "heures-xlsx" ? <Loader2 className="w-4 h-4 animate-spin text-success" /> : <FileSpreadsheet className="w-4 h-4 text-success" />}
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-200/50 shadow-sm rounded-xl p-6 flex flex-col justify-between border border-base-300">
          <div>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm mb-5">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-base-content mb-2">
              État des paiements
            </h2>
            <p className="text-sm opacity-60 leading-relaxed mb-6">
              Rapport financier détaillé incluant les montants bruts, retenues
              et nets à payer pour la vacation.
            </p>
          </div>
          <div className="space-y-3">
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl flex items-center gap-2 border border-base-300/20">
              <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-success"></div>
              </div>
              <div className="text-[11px]">
                <span className="opacity-50 block">Dernière mise à jour</span>
                <span className="font-bold">
                  {new Date().toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePaiementsPDF}
                disabled={loadingExport !== null}
                className="btn bg-primary hover:bg-primary/90 text-white border-none flex-1 gap-2 text-sm rounded-xl"
              >
                {loadingExport === "paiements-pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {loadingExport === "paiements-pdf" ? "Génération..." : "PDF"}
              </button>
              <button
                type="button"
                onClick={handlePaiementsExcel}
                disabled={loadingExport !== null}
                className="btn btn-outline border-base-300 text-base-content hover:bg-base-200 px-3 rounded-xl"
              >
                {loadingExport === "paiements-xlsx" ? <Loader2 className="w-4 h-4 animate-spin text-success" /> : <FileSpreadsheet className="w-4 h-4 text-success" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-base-100 p-6 rounded-xl shadow-sm border border-base-300">
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">
                Statistiques pédagogiques
              </h2>
              <p className="text-sm opacity-60 leading-relaxed">
                Analyse visuelle de la répartition des heures par filière, taux
                de complétion des cours et assiduité des intervenants.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="badge bg-base-200 border-none font-semibold text-[10px] uppercase tracking-wider px-2.5 py-2">
                Dataviz
              </span>
              <span className="badge bg-base-200 border-none font-semibold text-[10px] uppercase tracking-wider px-2.5 py-2">
                Histogrammes
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleStatsPDF}
                disabled={loadingExport !== null}
                className="btn bg-primary hover:bg-primary/90 text-white border-none gap-2 text-sm px-6 rounded-xl"
              >
                {loadingExport === "stats-pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                {loadingExport === "stats-pdf" ? "Génération..." : "PDF"}
              </button>
              <button
                type="button"
                onClick={handleStatsExcel}
                disabled={loadingExport !== null}
                className="btn btn-outline border-base-300 text-base-content hover:bg-base-200 px-3 rounded-xl"
                title="Exporter en Excel"
              >
                {loadingExport === "stats-xlsx" ? <Loader2 className="w-4 h-4 animate-spin text-success" /> : <FileSpreadsheet className="w-4 h-4 text-success" />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-dashed border-base-300 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Exports Récents
          </h3>

          {exportsRecents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-neutral">Aucun export récent</p>
              <p className="text-[10px] text-neutral/60 mt-1">
                Les exports apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {exportsRecents.map((exp, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-base-200/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        exp.type === "PDF" ? "bg-error/10" : "bg-success/10"
                      }`}
                    >
                      <span
                        className={`text-[9px] font-bold ${exp.type === "PDF" ? "text-error" : "text-success"}`}
                      >
                        {exp.type}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold truncate max-w-[120px]">
                        {exp.nom}
                      </h4>
                      <span className="text-[10px] opacity-40 block">
                        {exp.date}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadBlob(exp.url, exp.nom, exp.type)}
                    className="btn btn-sm btn-ghost btn-square text-base-content/50 hover:text-primary"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="divider my-2"></div>
          <div className="text-[10px] text-neutral text-center leading-relaxed">
            Les exports sont générés à partir des données en temps réel de la
            base académique UVCI.
          </div>
        </div>
      </div>
    </div>
  );
}
