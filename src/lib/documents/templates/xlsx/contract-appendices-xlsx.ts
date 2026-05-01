/**
 * Contract Appendices XLSX Generator
 * ───────────────────────────────────
 * Generates a multi-sheet Excel workbook with:
 *   Sheet 1: Appendix 1 — Product List
 *   Sheet 2: Appendix 2 — Technical Specifications
 *   Sheet 3: Appendix 3 — Delivery Schedule
 *   Sheet 4: Appendix 4 — Payment Schedule
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
import type { XlsxGeneratorResult } from "./quote-items-xlsx";

// ═══════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════

/**
 * Generate a multi-sheet XLSX with contract appendices.
 *
 * @param contractId  The Contract record ID.
 * @returns  Buffer + fileName + mimeType.
 * @throws   If contract not found.
 */
export async function generateContractAppendicesXlsx(
  contractId: string
): Promise<XlsxGeneratorResult> {
  // ── Fetch data ──
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      customer: { select: { name: true, companyName: true } },
      order: {
        include: {
          items: {
            orderBy: { productNameSnapshot: "asc" },
            include: {
              product: {
                include: {
                  translations: { where: { locale: "vi" } },
                },
              },
            },
          },
        },
      },
      quote: { select: { quoteCode: true } },
      rfq: { select: { rfqCode: true } },
    },
  });

  if (!contract) throw new Error(`Contract not found: ${contractId}`);

  const items = contract.order?.items ?? [];

  const wb = createWorkbook();

  // ── Sheet 1: Product List ──
  buildProductListSheet(wb, contract, items);

  // ── Sheet 2: Technical Specifications ──
  buildTechnicalSpecsSheet(wb, contract, items);

  // ── Sheet 3: Delivery Schedule ──
  buildDeliveryScheduleSheet(wb, contract, items);

  // ── Sheet 4: Payment Schedule ──
  buildPaymentScheduleSheet(wb, contract);

  // ── Export ──
  const buffer = await workbookToBuffer(wb);
  const fileName = buildDocumentFileName({
    entityCode: contract.contractCode,
    documentType: DocumentType.APPENDIX_PRODUCT_LIST,
    format: DocumentFormat.XLSX,
  });

  return {
    buffer,
    fileName,
    mimeType: getMimeTypeForFormat(DocumentFormat.XLSX),
  };
}

// ═══════════════════════════════════════════════════════
// SHEET BUILDERS
// ═══════════════════════════════════════════════════════

interface ContractData {
  contractCode: string;
  customer: { name: string; companyName: string | null } | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  deliveryLocation: string | null;
  totalAmount: number;
  order: { expectedDeliveryDate: Date | null } | null;
}

interface OrderItemWithProduct {
  productSku: string | null;
  productNameSnapshot: string;
  packagingSnapshot: string | null;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note: string | null;
  product: {
    translations: Array<{
      specifications: string | null;
      packaging: string | null;
      applications: string | null;
    }>;
  } | null;
}

function buildProductListSheet(
  wb: import("exceljs").Workbook,
  contract: ContractData,
  items: OrderItemWithProduct[]
): void {
  const ws = wb.addWorksheet("Phụ lục 1 - Sản phẩm");

  const HEADERS = [
    "STT", "Mã SP", "Tên sản phẩm", "Quy cách", "ĐVT",
    "Số lượng", "Đơn giá", "Thành tiền", "Ghi chú",
  ];
  const COL_WIDTHS = [6, 14, 30, 20, 8, 12, 16, 18, 25];

  addTitleRow(ws, `PHỤ LỤC 1 — DANH SÁCH SẢN PHẨM`, HEADERS.length);
  addMetadataRows(ws, [
    { label: "Hợp đồng:", value: formatDocumentCode(contract.contractCode) },
    { label: "Khách hàng:", value: safeDocumentText(contract.customer?.name) },
    { label: "Công ty:", value: safeDocumentText(contract.customer?.companyName) },
  ]);
  addBlankRow(ws);

  const headerRowNum = addHeaderRow(ws, HEADERS);

  if (items.length === 0) {
    const row = ws.addRow(["", "", "Không có dữ liệu sản phẩm", "", "", "", "", "", ""]);
    applyDataRowStyle(row);
  } else {
    let totalValue = 0;
    items.forEach((item, idx) => {
      const row = ws.addRow([
        idx + 1,
        safeDocumentText(item.productSku),
        item.productNameSnapshot,
        safeDocumentText(item.packagingSnapshot),
        safeDocumentText(item.unit),
        item.quantity,
        item.unitPrice,
        item.totalPrice,
        safeDocumentText(item.note),
      ]);
      applyDataRowStyle(row);
      applyCurrencyFormat(row.getCell(7));
      applyCurrencyFormat(row.getCell(8));
      totalValue += item.totalPrice;
    });

    // Total row
    addBlankRow(ws);
    const totalRow = ws.addRow(["", "", "", "", "", "", "TỔNG:", totalValue, ""]);
    totalRow.getCell(7).font = { bold: true, size: 11, name: "Calibri" };
    totalRow.getCell(8).font = { bold: true, size: 11, name: "Calibri", color: { argb: "FF2D5F2D" } };
    applyCurrencyFormat(totalRow.getCell(8));
  }

  setColumnWidths(ws, COL_WIDTHS);
  freezeHeaderRow(ws, headerRowNum);
  if (items.length > 0) {
    addAutoFilter(ws, `A${headerRowNum}`, `I${headerRowNum + items.length}`);
  }
}

function buildTechnicalSpecsSheet(
  wb: import("exceljs").Workbook,
  contract: ContractData,
  items: OrderItemWithProduct[]
): void {
  const ws = wb.addWorksheet("Phụ lục 2 - Kỹ thuật");

  const HEADERS = ["STT", "Tên sản phẩm", "Thông số kỹ thuật", "Quy cách đóng gói", "Ứng dụng"];
  const COL_WIDTHS = [6, 30, 40, 25, 35];

  addTitleRow(ws, `PHỤ LỤC 2 — THÔNG SỐ KỸ THUẬT`, HEADERS.length);
  addMetadataRows(ws, [
    { label: "Hợp đồng:", value: formatDocumentCode(contract.contractCode) },
  ]);
  addBlankRow(ws);

  const headerRowNum = addHeaderRow(ws, HEADERS);

  if (items.length === 0) {
    const row = ws.addRow(["", "Không có dữ liệu", "—", "—", "—"]);
    applyDataRowStyle(row);
  } else {
    items.forEach((item, idx) => {
      const viTranslation = item.product?.translations?.[0];
      const row = ws.addRow([
        idx + 1,
        item.productNameSnapshot,
        safeDocumentText(viTranslation?.specifications),
        safeDocumentText(viTranslation?.packaging ?? item.packagingSnapshot),
        safeDocumentText(viTranslation?.applications),
      ]);
      applyDataRowStyle(row);
    });
  }

  setColumnWidths(ws, COL_WIDTHS);
  freezeHeaderRow(ws, headerRowNum);
}

function buildDeliveryScheduleSheet(
  wb: import("exceljs").Workbook,
  contract: ContractData,
  items: OrderItemWithProduct[]
): void {
  const ws = wb.addWorksheet("Phụ lục 3 - Giao hàng");

  const HEADERS = ["Đợt", "Sản phẩm", "Số lượng", "Ngày giao dự kiến", "Địa điểm giao", "Ghi chú"];
  const COL_WIDTHS = [8, 30, 12, 18, 30, 25];

  addTitleRow(ws, `PHỤ LỤC 3 — LỊCH GIAO HÀNG`, HEADERS.length);
  addMetadataRows(ws, [
    { label: "Hợp đồng:", value: formatDocumentCode(contract.contractCode) },
    { label: "Điều kiện giao hàng:", value: safeDocumentText(contract.deliveryTerms) },
    { label: "Địa điểm giao:", value: safeDocumentText(contract.deliveryLocation) },
  ]);
  addBlankRow(ws);

  const headerRowNum = addHeaderRow(ws, HEADERS);

  // No detailed delivery schedule exists yet — create default from available data
  if (items.length === 0) {
    const row = ws.addRow([
      1,
      "Theo hợp đồng",
      "—",
      formatDocumentDate(contract.order?.expectedDeliveryDate),
      safeDocumentText(contract.deliveryLocation),
      safeDocumentText(contract.deliveryTerms),
    ]);
    applyDataRowStyle(row);
  } else {
    items.forEach((item, idx) => {
      const row = ws.addRow([
        idx + 1,
        item.productNameSnapshot,
        item.quantity,
        formatDocumentDate(contract.order?.expectedDeliveryDate),
        safeDocumentText(contract.deliveryLocation),
        "",
      ]);
      applyDataRowStyle(row);
    });
  }

  setColumnWidths(ws, COL_WIDTHS);
  freezeHeaderRow(ws, headerRowNum);
}

function buildPaymentScheduleSheet(
  wb: import("exceljs").Workbook,
  contract: ContractData
): void {
  const ws = wb.addWorksheet("Phụ lục 4 - Thanh toán");

  const HEADERS = ["Đợt", "Nội dung", "Tỷ lệ %", "Số tiền", "Thời hạn", "Ghi chú"];
  const COL_WIDTHS = [8, 35, 12, 18, 18, 25];

  addTitleRow(ws, `PHỤ LỤC 4 — LỊCH THANH TOÁN`, HEADERS.length);
  addMetadataRows(ws, [
    { label: "Hợp đồng:", value: formatDocumentCode(contract.contractCode) },
    { label: "Giá trị hợp đồng:", value: formatDocumentCurrency(contract.totalAmount) },
    { label: "Điều khoản thanh toán:", value: safeDocumentText(contract.paymentTerms) },
  ]);
  addBlankRow(ws);

  const headerRowNum = addHeaderRow(ws, HEADERS);

  // No detailed payment schedule exists yet — create default from paymentTerms
  if (contract.paymentTerms) {
    // Try to create a reasonable default: 100% single payment
    const row = ws.addRow([
      1,
      safeDocumentText(contract.paymentTerms),
      "100%",
      contract.totalAmount,
      "—",
      "Theo điều khoản thanh toán trong hợp đồng",
    ]);
    applyDataRowStyle(row);
    applyCurrencyFormat(row.getCell(4));
  } else {
    const row = ws.addRow([
      1,
      "Theo điều khoản thanh toán trong hợp đồng",
      "100%",
      contract.totalAmount,
      "—",
      "",
    ]);
    applyDataRowStyle(row);
    applyCurrencyFormat(row.getCell(4));
  }

  setColumnWidths(ws, COL_WIDTHS);
  freezeHeaderRow(ws, headerRowNum);
}
