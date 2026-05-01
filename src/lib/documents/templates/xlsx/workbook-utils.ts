/**
 * ExcelJS Workbook Utilities
 * ──────────────────────────
 * Reusable functions for creating styled, professional Excel workbooks.
 * All generators share these utilities for consistent look and feel.
 *
 * Phase 6A.4 — XLSX generation foundation.
 */

import ExcelJS from "exceljs";

// ═══════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF2D5F2D" }, // Dark green (matches GreenPeat brand)
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11,
  name: "Calibri",
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 14,
  name: "Calibri",
  color: { argb: "FF1A3A1A" },
};

const METADATA_LABEL_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 10,
  name: "Calibri",
};

const METADATA_VALUE_FONT: Partial<ExcelJS.Font> = {
  size: 10,
  name: "Calibri",
};

const DATA_FONT: Partial<ExcelJS.Font> = {
  size: 10,
  name: "Calibri",
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD0D0D0" } },
  left: { style: "thin", color: { argb: "FFD0D0D0" } },
  bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
  right: { style: "thin", color: { argb: "FFD0D0D0" } },
};

// ═══════════════════════════════════════════════════════
// WORKBOOK CREATION
// ═══════════════════════════════════════════════════════

/**
 * Create a new ExcelJS Workbook with default properties.
 */
export function createWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgriCoX / GreenPeat";
  wb.created = new Date();
  wb.modified = new Date();
  return wb;
}

// ═══════════════════════════════════════════════════════
// WORKSHEET HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Add a title row spanning the first N columns.
 * Returns the row number used (so the caller knows where to continue).
 */
export function addTitleRow(
  ws: ExcelJS.Worksheet,
  title: string,
  columnCount: number
): number {
  const row = ws.addRow([title]);
  row.font = TITLE_FONT;
  row.height = 28;
  // Merge across columns for visual emphasis
  if (columnCount > 1) {
    ws.mergeCells(row.number, 1, row.number, columnCount);
  }
  return row.number;
}

/**
 * Add metadata rows (label-value pairs) below the title.
 * Each entry is rendered as [label, value] in columns A-B.
 *
 * @returns  The last row number used.
 */
export function addMetadataRows(
  ws: ExcelJS.Worksheet,
  metadata: Array<{ label: string; value: string }>
): number {
  let lastRow = 0;
  for (const { label, value } of metadata) {
    const row = ws.addRow([label, value]);
    row.getCell(1).font = METADATA_LABEL_FONT;
    row.getCell(2).font = METADATA_VALUE_FONT;
    lastRow = row.number;
  }
  return lastRow;
}

/**
 * Add a blank separator row.
 */
export function addBlankRow(ws: ExcelJS.Worksheet): number {
  const row = ws.addRow([]);
  return row.number;
}

/**
 * Add a styled header row for the data table.
 *
 * @returns  The row number of the header.
 */
export function addHeaderRow(
  ws: ExcelJS.Worksheet,
  headers: string[]
): number {
  const row = ws.addRow(headers);
  applyHeaderStyle(row);
  return row.number;
}

/**
 * Apply header styling to a row (green background, white bold text, borders).
 */
export function applyHeaderStyle(row: ExcelJS.Row): void {
  row.font = HEADER_FONT;
  row.fill = HEADER_FILL;
  row.height = 22;
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = THIN_BORDER;
  });
}

/**
 * Apply standard data row styling.
 */
export function applyDataRowStyle(row: ExcelJS.Row): void {
  row.font = DATA_FONT;
  row.alignment = { vertical: "middle", wrapText: true };
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = THIN_BORDER;
  });
}

// ═══════════════════════════════════════════════════════
// CELL FORMATTING
// ═══════════════════════════════════════════════════════

/**
 * Apply VND currency number format to a cell.
 * Displays as: 1,500,000 (Excel uses comma for thousands in numFmt).
 */
export function applyCurrencyFormat(cell: ExcelJS.Cell): void {
  cell.numFmt = "#,##0";
  cell.alignment = { horizontal: "right", vertical: "middle" };
}

/**
 * Apply date format to a cell.
 */
export function applyDateFormat(cell: ExcelJS.Cell): void {
  cell.numFmt = "DD/MM/YYYY";
}

/**
 * Apply percentage format to a cell.
 */
export function applyPercentFormat(cell: ExcelJS.Cell): void {
  cell.numFmt = "0%";
}

// ═══════════════════════════════════════════════════════
// COLUMN & ROW UTILITIES
// ═══════════════════════════════════════════════════════

/**
 * Set column widths based on an array of widths.
 * More reliable than auto-fit since ExcelJS doesn't have true auto-fit.
 */
export function setColumnWidths(
  ws: ExcelJS.Worksheet,
  widths: number[]
): void {
  widths.forEach((w, i) => {
    const col = ws.getColumn(i + 1);
    col.width = w;
  });
}

/**
 * Freeze rows above a given row number (1-indexed).
 * Typically freeze after the header row so data scrolls while headers stay.
 */
export function freezeHeaderRow(
  ws: ExcelJS.Worksheet,
  rowNumber: number
): void {
  ws.views = [
    { state: "frozen", ySplit: rowNumber, xSplit: 0 },
  ];
}

/**
 * Add auto-filter to a range.
 * Typically from the header row first cell to the last data cell.
 *
 * @param fromCell  e.g. "A5"
 * @param toCell    e.g. "J50"
 */
export function addAutoFilter(
  ws: ExcelJS.Worksheet,
  fromCell: string,
  toCell: string
): void {
  ws.autoFilter = `${fromCell}:${toCell}`;
}

// ═══════════════════════════════════════════════════════
// WORKBOOK EXPORT
// ═══════════════════════════════════════════════════════

/**
 * Convert a workbook to a Buffer for download or storage.
 */
export async function workbookToBuffer(
  workbook: ExcelJS.Workbook
): Promise<Buffer> {
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
