/**
 * Document Log XLSX Generator
 * ───────────────────────────
 * Exports all GeneratedDocument records as a tracking spreadsheet.
 *
 * Phase 6A.4.
 */

import prisma from "@/lib/prisma";
import {
  buildDocumentFileName,
  getMimeTypeForFormat,
  DocumentType,
  DocumentFormat,
  ENTITY_TYPE_LABEL,
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_STATUS_LABEL,
  FORMAT_LABEL,
} from "@/lib/documents/constants";
import {
  formatDocumentDate,
  safeDocumentText,
} from "@/lib/documents/formatters";
import {
  createWorkbook,
  addTitleRow,
  addBlankRow,
  addHeaderRow,
  applyDataRowStyle,
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
 * Generate a Document Log XLSX — all GeneratedDocument records.
 *
 * @returns  Buffer + fileName + mimeType.
 */
export async function generateDocumentLogXlsx(): Promise<XlsxGeneratorResult> {
  const documents = await prisma.generatedDocument.findMany({
    orderBy: { createdAt: "desc" },
  });

  const wb = createWorkbook();
  const ws = wb.addWorksheet("Document Log");

  const HEADERS = [
    "Loại thực thể",
    "ID thực thể",
    "Loại tài liệu",
    "Mã tài liệu",
    "Định dạng",
    "Tên file",
    "MIME type",
    "Dung lượng (bytes)",
    "Nhà lưu trữ",
    "Phiên bản",
    "Trạng thái",
    "Ngày tạo",
  ];
  const COL_WIDTHS = [16, 28, 24, 22, 12, 35, 40, 16, 16, 12, 14, 16];

  addTitleRow(ws, `SỔ TÀI LIỆU — Document Log`, HEADERS.length);
  addBlankRow(ws);

  const headerRowNum = addHeaderRow(ws, HEADERS);

  if (documents.length === 0) {
    const row = ws.addRow(["Chưa có tài liệu nào được tạo", ...Array(HEADERS.length - 1).fill("")]);
    applyDataRowStyle(row);
  } else {
    documents.forEach((doc) => {
      const entityLabel = ENTITY_TYPE_LABEL[doc.entityType as keyof typeof ENTITY_TYPE_LABEL] ?? doc.entityType;
      const docTypeLabel = DOCUMENT_TYPE_LABEL[doc.documentType as keyof typeof DOCUMENT_TYPE_LABEL] ?? doc.documentType;
      const statusLabel = DOCUMENT_STATUS_LABEL[doc.status as keyof typeof DOCUMENT_STATUS_LABEL] ?? doc.status;
      const formatLabel = FORMAT_LABEL[doc.format as keyof typeof FORMAT_LABEL] ?? doc.format;

      const row = ws.addRow([
        entityLabel,
        doc.entityId,
        docTypeLabel,
        safeDocumentText(doc.documentCode),
        formatLabel,
        doc.fileName,
        doc.mimeType,
        doc.fileSize ?? "—",
        doc.storageProvider,
        `v${doc.version}`,
        statusLabel,
        formatDocumentDate(doc.createdAt),
      ]);
      applyDataRowStyle(row);
    });
  }

  setColumnWidths(ws, COL_WIDTHS);
  freezeHeaderRow(ws, headerRowNum);
  if (documents.length > 0) {
    addAutoFilter(ws, `A${headerRowNum}`, `L${headerRowNum + documents.length}`);
  }

  const buffer = await workbookToBuffer(wb);

  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const fileName = buildDocumentFileName({
    entityCode: `LOG-${dateCode}`,
    documentType: DocumentType.DOCUMENT_LOG,
    format: DocumentFormat.XLSX,
  });

  return {
    buffer,
    fileName,
    mimeType: getMimeTypeForFormat(DocumentFormat.XLSX),
  };
}
