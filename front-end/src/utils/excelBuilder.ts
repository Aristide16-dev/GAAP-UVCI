/**
 * excelBuilder.ts — Utilitaire de génération de fichiers Excel
 *
 * Ce fichier centralise tous les styles visuels utilisés dans les fichiers
 * Excel exportés par l'application GAAP-UVCI. Il garantit que tous les
 * exports ont le même aspect professionnel et cohérent avec la charte
 * graphique de l'application.
 *
 * Il utilise la bibliothèque ExcelJS pour créer des fichiers .xlsx
 * directement dans le navigateur (sans passer par le serveur).
 *
 * COMMENT L'UTILISER dans une page :
 *   import { ExcelJS, STYLE, wbToBlob, downloadBlob } from "../../utils/excelBuilder";
 *
 *   const wb = new ExcelJS.Workbook();
 *   const ws = wb.addWorksheet("Feuille 1");
 *   STYLE.headers(ws, 1);  // Appliquer le style en-tête à la ligne 1
 *   const blob = await wbToBlob(wb);
 *   downloadBlob(blob, "export.xlsx");
 */
import ExcelJS from "exceljs";

/**
 * Palette de couleurs officielle GAAP-UVCI.
 * Format ARGB : "FF" + code hexadécimal (ex: FF5A0661 = violet UVCI opaque)
 */
const C = {
  primary:   "FF5A0661", // Violet UVCI — couleur principale
  primaryLt: "FFEDE9FE", // Violet clair — pour les fonds
  white:     "FFFFFFFF", // Blanc
  gray1:     "FF111827", // Gris très foncé (titres)
  gray2:     "FF374151", // Gris foncé (sous-titres)
  gray3:     "FF6B7280", // Gris moyen (texte secondaire)
  altRow:    "FFFDFAFF", // Fond légèrement violet pour les lignes alternées
  border:    "FFE5E7EB", // Gris clair pour les bordures de cellules
  green:     "FF166534", // Vert foncé (indicateurs positifs)
  amber:     "FF92400E", // Ambre foncé (indicateurs d'alerte)
};

/** Type des styles de bordure acceptés par ExcelJS */
type BorderStyle = ExcelJS.BorderStyle;

/**
 * Crée un objet bordure fine d'une couleur donnée.
 * Utilisé pour construire des bordures complètes sur les cellules.
 */
const thin = (argb: string): Partial<ExcelJS.Border> => ({
  style: "thin" as BorderStyle,
  color: { argb },
});

/**
 * Applique une bordure fine sur les 4 côtés d'une cellule.
 * @param argb - Couleur en format ARGB
 */
const allBorders = (argb: string) => ({
  top:    thin(argb),
  bottom: thin(argb),
  left:   thin(argb),
  right:  thin(argb),
});

/**
 * STYLE — Collection de fonctions pour styliser les lignes d'un fichier Excel.
 * Chaque fonction s'applique à une ligne entière d'une feuille de calcul.
 */
export const STYLE = {
  /**
   * Style de titre principal — grand texte violet gras centré à gauche.
   * Ex: "État Global des Heures Complémentaires — UVCI"
   * @param ws   - Feuille de calcul Excel
   * @param row  - Numéro de la ligne
   * @param cols - Nombre de colonnes à fusionner
   */
  title(ws: ExcelJS.Worksheet, row: number, cols: number) {
    const r = ws.getRow(row);
    r.height = 26;
    const cell = r.getCell(1);
    cell.font      = { bold: true, size: 13, color: { argb: C.primary }, name: "Calibri" };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    ws.mergeCells(row, 1, row, cols); // Fusionner toutes les colonnes du titre
  },

  /**
   * Style de sous-titre — texte gris plus petit.
   * Ex: "Année académique 2025-2026"
   */
  subtitle(ws: ExcelJS.Worksheet, row: number, cols: number) {
    const r = ws.getRow(row);
    r.height = 18;
    const cell = r.getCell(1);
    cell.font      = { size: 9, color: { argb: C.gray2 }, name: "Calibri" };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    ws.mergeCells(row, 1, row, cols);
  },

  /**
   * Style de date — texte gris clair et italique.
   * Ex: "Exporté le 03/06/2026"
   */
  dateRow(ws: ExcelJS.Worksheet, row: number, cols: number) {
    const r = ws.getRow(row);
    r.height = 15;
    const cell = r.getCell(1);
    cell.font = { italic: true, size: 8, color: { argb: C.gray3 }, name: "Calibri" };
    ws.mergeCells(row, 1, row, cols);
  },

  /**
   * Style d'en-tête de tableau — fond violet, texte blanc gras centré.
   * Appliqué à la ligne qui contient les noms des colonnes.
   */
  headers(ws: ExcelJS.Worksheet, row: number) {
    const r = ws.getRow(row);
    r.height = 24;
    r.eachCell((cell) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: C.primary } };
      cell.font      = { bold: true, size: 9, color: { argb: C.white }, name: "Calibri" };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border    = allBorders(C.primary);
    });
  },

  /**
   * Style de ligne de données — fond blanc ou légèrement violet (alternance).
   * @param alt - true pour la couleur alternée (lignes paires/impaires)
   */
  dataRow(ws: ExcelJS.Worksheet, row: number, alt: boolean) {
    const r = ws.getRow(row);
    r.height = 18;
    r.eachCell({ includeEmpty: true }, (cell) => {
      if (alt) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.altRow } };
      cell.border    = allBorders(C.border);
      if (!cell.font) cell.font = {};
      cell.font      = { ...cell.font, size: 9, name: "Calibri" };
      if (!cell.alignment) cell.alignment = { vertical: "middle" };
    });
  },

  /**
   * Style de ligne de total — fond violet, texte blanc gras (comme les en-têtes).
   * Utilisé pour la dernière ligne d'un tableau avec les sommes.
   */
  totalRow(ws: ExcelJS.Worksheet, row: number) {
    const r = ws.getRow(row);
    r.height = 22;
    r.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: C.primary } };
      cell.font      = { bold: true, size: 9, color: { argb: C.white }, name: "Calibri" };
      cell.border    = allBorders(C.primary);
      cell.alignment = { vertical: "middle" };
    });
  },
};

/**
 * Convertit un fichier Excel (Workbook) en Blob téléchargeable.
 * Un Blob est un objet binaire que le navigateur peut télécharger.
 * @param wb - Le classeur Excel créé avec ExcelJS
 * @returns Un Blob au format .xlsx
 */
export async function wbToBlob(wb: ExcelJS.Workbook): Promise<Blob> {
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Déclenche le téléchargement d'un Blob dans le navigateur.
 * Crée un lien invisible, clique dessus programmatiquement, puis le supprime.
 * @param blob     - Le fichier binaire à télécharger
 * @param filename - Le nom du fichier proposé au téléchargement
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob); // Créer une URL temporaire
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();                             // Déclencher le téléchargement
  URL.revokeObjectURL(url);              // Libérer la mémoire
}

// Ré-exporter ExcelJS pour que les pages n'aient qu'un seul import
export { ExcelJS };
