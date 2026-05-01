/**
 * Quote Items XLSX Generator
 * ──────────────────────────
 * Generates an Excel spreadsheet with quote items, metadata, and totals.
 *
 * Phase 6A.4.
 */

import prisma from "@/lib/prisma";
import {
  buildDocumentFileName,
  getMimeTypeForFormat,
  DocumentType,
  DocumentFormat,
} from "@/lib/documents/constants";
import {
  formatDocumentDate,
  formatDocumentCurrency,
  formatDocumentPercent,
  safeDocumentText,
  formatDocumentCode,
} from "@/lib/documents/formatters";
import {
  createWorkbook,
  addTitleRow,
  addMetadataRows,
  addBlankRow,
  addHeaderRow,
  applyDataRowStyle,
  applyCurrencyFormat,
  setColumnWidths,
  freezeHeaderRow,
  addAutoFilter,
  workbookToBuffer,
} from "./workbook-utils";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface XlsxGeneratorResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

// ═══════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════

/**
 * Generate an XLSX file containing Quote items and metadata.
 *
 * @param quoteId  The Quote record ID.
 * @returns  Buffer + fileName + mimeType for downstream use.
 * @throws   If quote not found.
 */
export async function generateQuoteItemsXlsx(
  quoteId: string
): Promise<XlsxGeneratorResult> {
  // ── Fetch data ──
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      items: { orderBy: { productNameSnapshot: "asc" } },
      customer: { select: { name: true, companyName: true } },
      rfq: { select: { rfqCode: true } },
      creator: { select: { name: true } },
    },
  });

  if (!quote) throw new Error(`Quote not found: ${quoteId}`);

  // ── Build workbook ──
  const wb = createWorkbook();
  const ws = wb.addWorksheet("Quote Items");

  const HEADERS = [
    "STT",
    "Mã sản phẩm",
    "Tên sản phẩm",
    "Quy cách",
    "ĐVT",
    "Số lượng",
    "Đơn giá",
    "Chiết khấu %",
    "Thành tiền",
    "Ghi chú",
  ];

  const COL_WIDTHS = [6, 16, 30, 20, 8, 12, 16, 14, 18, 25];

  // Title
  addTitleRow(ws, `BÁO GIÁ — ${quote.quoteCode}`, HEADERS.length);

  // Metadata
  addMetadataRows(ws, [
    { label: "Mã báo giá:", value: formatDocumentCode(quote.quoteCode) },
    { label: "Khách hàng:", value: safeDocumentText(quote.customer?.name) },
    { label: "Công ty:", value: safeDocumentText(quote.customer?.companyName) },
    { label: "Mã RFQ:", value: quote.rfq ? formatDocumentCode(quote.rfq.rfqCode) : "—" },
    { label: "Ngày tạo:", value: formatDocumentDate(quote.createdAt) },
    { label: "Trạng thái:", value: quote.status },
    { label: "Người tạo:", value: safeDocumentText(quote.creator?.name) },
  ]);

  addBlankRow(ws);

  // Header row
  const headerRowNum = addHeaderRow(ws, HEADERS);

  // Data rows
  quote.items.forEach((item, idx) => {
    const row = ws.addRow([
      idx + 1,
      safeDocumentText(item.productSku),
      item.productNameSnapshot,
      safeDocumentText(item.packagingSnapshot),
      safeDocumentText(item.unit),
      item.quantity,
      item.unitPrice,
      item.discountRate,
      item.totalPrice,
      safeDocumentText(item.note),
    ]);

    applyDataRowStyle(row);
    applyCurrencyFormat(row.getCell(7)); // Đơn giá
    row.getCell(8).numFmt = "0%";       // Chiết khấu
    applyCurrencyFormat(row.getCell(9)); // Thành tiền
  });

  // Totals section
  addBlankRow(ws);
  const totalsData = [
    ["", "", "", "", "", "", "", "Tạm tính:", quote.subtotal, ""],
    ["", "", "", "", "", "", "", "Chiết khấu:", quote.discountAmount, ""],
    ["", "", "", "", "", "", "", `VAT (${formatDocumentPercent(quote.vatRate)}):`, quote.vatAmount, ""],
    ["", "", "", "", "", "", "", "Phí vận chuyển:", quote.shippingFee, ""],
    ["", "", "", "", "", "", "", "TỔNG CỘNG:", quote.totalAmount, ""],
  ];

  for (const rowData of totalsData) {
    const row = ws.addRow(rowData);
    row.getCell(8).font = { bold: true, size: 10, name: "Calibri" };
    applyCurrencyFormat(row.getCell(9));
    if (rowData[7] === "TỔNG CỘNG:") {
      row.getCell(8).font = { bold: true, size: 11, name: "Calibri", color: { argb: "FF2D5F2D" } };
      row.getCell(9).font = { bold: true, size: 11, name: "Calibri", color: { argb: "FF2D5F2D" } };
    }
  }

  // Column widths, freeze, filter
  setColumnWidths(ws, COL_WIDTHS);
  freezeHeaderRow(ws, headerRowNum);
  const lastDataRow = headerRowNum + quote.items.length;
  if (quote.items.length > 0) {
    addAutoFilter(ws, `A${headerRowNum}`, `J${lastDataRow}`);
  }

  // ── Export ──
  const buffer = await workbookToBuffer(wb);
  const fileName = buildDocumentFileName({
    entityCode: quote.quoteCode,
    documentType: DocumentType.QUOTE,
    format: DocumentFormat.XLSX,
  });

  return {
    buffer,
    fileName,
    mimeType: getMimeTypeForFormat(DocumentFormat.XLSX),
  };
}
