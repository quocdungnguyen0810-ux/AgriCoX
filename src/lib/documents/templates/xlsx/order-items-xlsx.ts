/**
 * Order Items XLSX Generator
 * ──────────────────────────
 * Generates an Excel spreadsheet with order items, metadata, and totals.
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
 * Generate an XLSX file containing Order items and metadata.
 *
 * @param orderId  The Order record ID.
 * @returns  Buffer + fileName + mimeType.
 * @throws   If order not found.
 */
export async function generateOrderItemsXlsx(
  orderId: string
): Promise<XlsxGeneratorResult> {
  // ── Fetch data ──
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { orderBy: { productNameSnapshot: "asc" } },
      customer: { select: { name: true, companyName: true } },
      quote: { select: { quoteCode: true } },
      assignee: { select: { name: true } },
    },
  });

  if (!order) throw new Error(`Order not found: ${orderId}`);

  // ── Build workbook ──
  const wb = createWorkbook();
  const ws = wb.addWorksheet("Order Items");

  const HEADERS = [
    "STT",
    "Mã sản phẩm",
    "Tên sản phẩm",
    "Quy cách",
    "ĐVT",
    "Số lượng",
    "Đơn giá",
    "Thành tiền",
    "Ghi chú",
  ];

  const COL_WIDTHS = [6, 16, 30, 20, 8, 12, 16, 18, 25];

  // Title
  addTitleRow(ws, `ĐƠN HÀNG — ${order.orderCode}`, HEADERS.length);

  // Metadata
  addMetadataRows(ws, [
    { label: "Mã đơn hàng:", value: formatDocumentCode(order.orderCode) },
    { label: "Mã báo giá:", value: order.quote ? formatDocumentCode(order.quote.quoteCode) : "—" },
    { label: "Khách hàng:", value: safeDocumentText(order.customer?.name) },
    { label: "Công ty:", value: safeDocumentText(order.customer?.companyName) },
    { label: "Trạng thái đơn hàng:", value: order.status },
    { label: "Trạng thái thanh toán:", value: order.paymentStatus },
    { label: "Trạng thái giao hàng:", value: order.fulfillmentStatus },
    { label: "Ngày đặt hàng:", value: formatDocumentDate(order.orderDate) },
    { label: "Ngày giao dự kiến:", value: formatDocumentDate(order.expectedDeliveryDate) },
    { label: "Phụ trách:", value: safeDocumentText(order.assignee?.name) },
  ]);

  addBlankRow(ws);

  // Header row
  const headerRowNum = addHeaderRow(ws, HEADERS);

  // Data rows
  order.items.forEach((item, idx) => {
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
    applyCurrencyFormat(row.getCell(7)); // Đơn giá
    applyCurrencyFormat(row.getCell(8)); // Thành tiền
  });

  // Totals
  addBlankRow(ws);
  const totalsData = [
    ["", "", "", "", "", "", "Tạm tính:", order.subtotal, ""],
    ["", "", "", "", "", "", "Chiết khấu:", order.discountAmount, ""],
    ["", "", "", "", "", "", "Thuế VAT:", order.vatAmount, ""],
    ["", "", "", "", "", "", "Phí vận chuyển:", order.shippingFee, ""],
    ["", "", "", "", "", "", "TỔNG CỘNG:", order.totalAmount, ""],
  ];

  for (const rowData of totalsData) {
    const row = ws.addRow(rowData);
    row.getCell(7).font = { bold: true, size: 10, name: "Calibri" };
    applyCurrencyFormat(row.getCell(8));
    if (rowData[6] === "TỔNG CỘNG:") {
      row.getCell(7).font = { bold: true, size: 11, name: "Calibri", color: { argb: "FF2D5F2D" } };
      row.getCell(8).font = { bold: true, size: 11, name: "Calibri", color: { argb: "FF2D5F2D" } };
    }
  }

  // Column widths, freeze, filter
  setColumnWidths(ws, COL_WIDTHS);
  freezeHeaderRow(ws, headerRowNum);
  const lastDataRow = headerRowNum + order.items.length;
  if (order.items.length > 0) {
    addAutoFilter(ws, `A${headerRowNum}`, `I${lastDataRow}`);
  }

  // ── Export ──
  const buffer = await workbookToBuffer(wb);
  const fileName = buildDocumentFileName({
    entityCode: order.orderCode,
    documentType: DocumentType.ORDER_CONFIRMATION,
    format: DocumentFormat.XLSX,
  });

  return {
    buffer,
    fileName,
    mimeType: getMimeTypeForFormat(DocumentFormat.XLSX),
  };
}
