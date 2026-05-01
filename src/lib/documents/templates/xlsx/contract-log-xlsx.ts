/**
 * Contract Log XLSX Generator
 * ───────────────────────────
 * Exports all contracts as a management-level Excel spreadsheet.
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
  safeDocumentText,
  formatDocumentCode,
} from "@/lib/documents/formatters";
import {
  createWorkbook,
  addTitleRow,
  addBlankRow,
  addHeaderRow,
  applyDataRowStyle,
  applyCurrencyFormat,
  setColumnWidths,
  freezeHeaderRow,
  addAutoFilter,
  workbookToBuffer,
} from "./workbook-utils";
import type { XlsxGeneratorResult } from "./quote-items-xlsx";

// ═══════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════

/**
 * Generate a Contract Log XLSX — all contracts in one spreadsheet.
 *
 * @returns  Buffer + fileName + mimeType.
 */
export async function generateContractLogXlsx(): Promise<XlsxGeneratorResult> {
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, companyName: true } },
      order: { select: { orderCode: true } },
      quote: { select: { quoteCode: true } },
      rfq: { select: { rfqCode: true } },
      creator: { select: { name: true } },
    },
  });

  const wb = createWorkbook();
  const ws = wb.addWorksheet("Contract Log");

  const HEADERS = [
    "Mã hợp đồng",
    "Khách hàng",
    "Công ty",
    "Mã RFQ",
    "Mã báo giá",
    "Mã đơn hàng",
    "Tổng tiền",
    "Tiền tệ",
    "Trạng thái",
    "Ngày hợp đồng",
    "Ngày hiệu lực",
    "Ngày hết hạn",
    "Người tạo",
    "Cập nhật lần cuối",
  ];
  const COL_WIDTHS = [18, 22, 25, 18, 18, 18, 18, 10, 16, 14, 14, 14, 16, 18];

  addTitleRow(ws, `SỔ HỢP ĐỒNG — Contract Log`, HEADERS.length);
  addBlankRow(ws);

  const headerRowNum = addHeaderRow(ws, HEADERS);

  if (contracts.length === 0) {
    const row = ws.addRow(["Chưa có hợp đồng nào", ...Array(HEADERS.length - 1).fill("")]);
    applyDataRowStyle(row);
  } else {
    contracts.forEach((c) => {
      const row = ws.addRow([
        formatDocumentCode(c.contractCode),
        safeDocumentText(c.customer?.name),
        safeDocumentText(c.customer?.companyName),
        c.rfq ? formatDocumentCode(c.rfq.rfqCode) : "—",
        c.quote ? formatDocumentCode(c.quote.quoteCode) : "—",
        c.order ? formatDocumentCode(c.order.orderCode) : "—",
        c.totalAmount,
        c.currency,
        c.status,
        formatDocumentDate(c.contractDate),
        formatDocumentDate(c.effectiveDate),
        formatDocumentDate(c.expiryDate),
        safeDocumentText(c.creator?.name),
        formatDocumentDate(c.updatedAt),
      ]);
      applyDataRowStyle(row);
      applyCurrencyFormat(row.getCell(7));
    });
  }

  setColumnWidths(ws, COL_WIDTHS);
  freezeHeaderRow(ws, headerRowNum);
  if (contracts.length > 0) {
    addAutoFilter(ws, `A${headerRowNum}`, `N${headerRowNum + contracts.length}`);
  }

  const buffer = await workbookToBuffer(wb);

  // Use date-based code for log exports
  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const fileName = buildDocumentFileName({
    entityCode: `LOG-${dateCode}`,
    documentType: DocumentType.CONTRACT_LOG,
    format: DocumentFormat.XLSX,
  });

  return {
    buffer,
    fileName,
    mimeType: getMimeTypeForFormat(DocumentFormat.XLSX),
  };
}
