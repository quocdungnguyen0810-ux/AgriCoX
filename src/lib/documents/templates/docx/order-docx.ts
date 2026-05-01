/**
 * Order Confirmation DOCX Generator
 * ──────────────────────────────────
 * Generates an editable Word document for an Order Confirmation.
 *
 * Phase 6A.5.
 */

import prisma from "@/lib/prisma";
import { companyConfig } from "@/lib/company-config";
import {
  buildDocumentFileName,
  getMimeTypeForFormat,
  DocumentType,
  DocumentFormat,
} from "@/lib/documents/constants";
import {
  formatDocumentDate,
  formatDocumentCurrency,
  formatQuantity,
} from "@/lib/documents/formatters";
import { amountToWordsVi } from "@/lib/documents/number-to-words-vi";
import {
  createDocxDocument,
  createTitle,
  createSubtitle,
  createHeading,
  createParagraph,
  createMetadataParagraph,
  createTable,
  createTotalsTable,
  createSignatureBlock,
  createSpacer,
  safeDocxText,
  docxToBuffer,
} from "./docx-utils";
import type { XlsxGeneratorResult } from "../xlsx/quote-items-xlsx";

// ═══════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════

/**
 * Generate an editable DOCX for an Order Confirmation.
 *
 * @param orderId  The Order record ID.
 * @returns  Buffer + fileName + mimeType.
 * @throws   If order not found.
 */
export async function generateOrderConfirmationDocx(
  orderId: string
): Promise<XlsxGeneratorResult> {
  // ── Fetch data ──
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { orderBy: { productNameSnapshot: "asc" } },
      customer: {
        select: {
          name: true,
          companyName: true,
          phone: true,
          email: true,
          address: true,
        },
      },
      quote: { select: { quoteCode: true } },
      assignee: { select: { name: true } },
    },
  });

  if (!order) throw new Error(`Order not found: ${orderId}`);

  // ── Build document sections ──
  const sections = [
    // Company header
    createParagraph(companyConfig.fullName),
    createMetadataParagraph("Địa chỉ:", companyConfig.address),
    createMetadataParagraph("Điện thoại:", companyConfig.phone),
    createMetadataParagraph("Email:", companyConfig.salesEmail),
    createSpacer(),

    // Title
    createTitle("XÁC NHẬN ĐƠN HÀNG"),
    createSubtitle("ORDER CONFIRMATION"),

    // Order info
    createMetadataParagraph("Mã đơn hàng:", order.orderCode),
    ...(order.quote
      ? [createMetadataParagraph("Mã báo giá:", order.quote.quoteCode)]
      : []),
    createMetadataParagraph("Ngày đặt hàng:", formatDocumentDate(order.orderDate)),
    createMetadataParagraph("Phụ trách:", safeDocxText(order.assignee?.name)),
    createSpacer(),

    // Customer info
    createHeading("THÔNG TIN KHÁCH HÀNG"),
    createMetadataParagraph("Khách hàng:", safeDocxText(order.customer?.name)),
    createMetadataParagraph("Công ty:", safeDocxText(order.customer?.companyName)),
    createMetadataParagraph("Điện thoại:", safeDocxText(order.customer?.phone)),
    createMetadataParagraph("Email:", safeDocxText(order.customer?.email)),
    createMetadataParagraph("Địa chỉ:", safeDocxText(order.customer?.address)),
    createSpacer(),

    // Product table
    createHeading("DANH SÁCH SẢN PHẨM"),
    createTable(
      ["STT", "Mã SP", "Tên sản phẩm", "Quy cách", "ĐVT", "SL", "Đơn giá", "Thành tiền"],
      order.items.map((item, idx) => [
        String(idx + 1),
        safeDocxText(item.productSku),
        item.productNameSnapshot,
        safeDocxText(item.packagingSnapshot),
        safeDocxText(item.unit),
        formatQuantity(item.quantity),
        formatDocumentCurrency(item.unitPrice),
        formatDocumentCurrency(item.totalPrice),
      ]),
      [5, 8, 20, 12, 6, 7, 14, 14]
    ),
    createSpacer(),

    // Totals
    createTotalsTable([
      { label: "Tạm tính:", value: formatDocumentCurrency(order.subtotal) },
      { label: "Chiết khấu:", value: formatDocumentCurrency(order.discountAmount) },
      { label: "Thuế VAT:", value: formatDocumentCurrency(order.vatAmount) },
      { label: "Phí vận chuyển:", value: formatDocumentCurrency(order.shippingFee) },
      { label: "TỔNG CỘNG:", value: formatDocumentCurrency(order.totalAmount), bold: true },
    ]),
    createParagraph(`Bằng chữ: ${amountToWordsVi(order.totalAmount)}`),
    createSpacer(),

    // Status
    createHeading("TRẠNG THÁI"),
    createMetadataParagraph("Trạng thái đơn hàng:", order.status),
    createMetadataParagraph("Trạng thái thanh toán:", order.paymentStatus),
    createMetadataParagraph("Trạng thái giao hàng:", order.fulfillmentStatus),
    createSpacer(),

    // Delivery
    createHeading("THÔNG TIN GIAO HÀNG"),
    createMetadataParagraph("Điều kiện thanh toán:", safeDocxText(order.paymentTerms)),
    createMetadataParagraph("Điều kiện giao hàng:", safeDocxText(order.deliveryTerms)),
    createMetadataParagraph("Địa chỉ giao:", safeDocxText(order.deliveryAddress)),
    createMetadataParagraph("Ngày giao dự kiến:", formatDocumentDate(order.expectedDeliveryDate)),
    ...(order.notes
      ? [createSpacer(), createHeading("GHI CHÚ"), createParagraph(order.notes)]
      : []),
    createSpacer(),
    createSpacer(),

    // Signature
    createSignatureBlock("ĐẠI DIỆN GREENPEAT", "KHÁCH HÀNG"),
  ];

  const doc = createDocxDocument(sections);
  const buffer = await docxToBuffer(doc);

  const fileName = buildDocumentFileName({
    entityCode: order.orderCode,
    documentType: DocumentType.ORDER_CONFIRMATION,
    format: DocumentFormat.DOCX,
  });

  return {
    buffer,
    fileName,
    mimeType: getMimeTypeForFormat(DocumentFormat.DOCX),
  };
}
