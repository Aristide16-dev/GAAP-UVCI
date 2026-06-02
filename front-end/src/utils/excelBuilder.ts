import ExcelJS from "exceljs";

/* ─── Palette GAAP-UVCI ─────────────────────────────────────────────────── */
const C = {
  primary:   "FF5A0661",
  primaryLt: "FFEDE9FE",
  white:     "FFFFFFFF",
  gray1:     "FF111827",
  gray2:     "FF374151",
  gray3:     "FF6B7280",
  altRow:    "FFFDFAFF",
  border:    "FFE5E7EB",
  green:     "FF166534",
  amber:     "FF92400E",
};

/* ─── Style presets ─────────────────────────────────────────────────────── */
type BorderStyle = ExcelJS.BorderStyle;

const thin = (argb: string): Partial<ExcelJS.Border> => ({ style: "thin" as BorderStyle, color: { argb } });
const allBorders = (argb: string) => ({ top: thin(argb), bottom: thin(argb), left: thin(argb), right: thin(argb) });

export const STYLE = {
  title(ws: ExcelJS.Worksheet, row: number, cols: number) {
    const r = ws.getRow(row);
    r.height = 26;
    const cell = r.getCell(1);
    cell.font = { bold: true, size: 13, color: { argb: C.primary }, name: "Calibri" };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    ws.mergeCells(row, 1, row, cols);
  },

  subtitle(ws: ExcelJS.Worksheet, row: number, cols: number) {
    const r = ws.getRow(row);
    r.height = 18;
    const cell = r.getCell(1);
    cell.font = { size: 9, color: { argb: C.gray2 }, name: "Calibri" };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    ws.mergeCells(row, 1, row, cols);
  },

  dateRow(ws: ExcelJS.Worksheet, row: number, cols: number) {
    const r = ws.getRow(row);
    r.height = 15;
    const cell = r.getCell(1);
    cell.font = { italic: true, size: 8, color: { argb: C.gray3 }, name: "Calibri" };
    ws.mergeCells(row, 1, row, cols);
  },

  headers(ws: ExcelJS.Worksheet, row: number) {
    const r = ws.getRow(row);
    r.height = 24;
    r.eachCell((cell) => {
      cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: C.primary } };
      cell.font  = { bold: true, size: 9, color: { argb: C.white }, name: "Calibri" };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = allBorders(C.primary);
    });
  },

  dataRow(ws: ExcelJS.Worksheet, row: number, alt: boolean) {
    const r = ws.getRow(row);
    r.height = 18;
    r.eachCell({ includeEmpty: true }, (cell) => {
      if (alt) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.altRow } };
      cell.border = allBorders(C.border);
      if (!cell.font) cell.font = {};
      cell.font = { ...cell.font, size: 9, name: "Calibri" };
      if (!cell.alignment) cell.alignment = { vertical: "middle" };
    });
  },

  totalRow(ws: ExcelJS.Worksheet, row: number) {
    const r = ws.getRow(row);
    r.height = 22;
    r.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: C.primary } };
      cell.font   = { bold: true, size: 9, color: { argb: C.white }, name: "Calibri" };
      cell.border = allBorders(C.primary);
      cell.alignment = { vertical: "middle" };
    });
  },
};

/* ─── Blob helper ───────────────────────────────────────────────────────── */
export async function wbToBlob(wb: ExcelJS.Workbook): Promise<Blob> {
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { ExcelJS };
