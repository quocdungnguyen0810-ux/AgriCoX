/**
 * Quote DOCX Generator
 * ────────────────────
 * Generates an editable Word document for a Quote.
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
  formatDocumentPercent,
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
 * Generate an editable DOCX for a Quote.
 *
 * @param quoteId  The Quote record ID.
 * @returns  Buffer + fileName + mimeType.
 * @throws   If quote not found.
 */
export async function generateQuoteDocx(
  quoteId: string
): Promise<XlsxGeneratorResult> {
  // ── Fetch data ──
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
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
      rfq: { select: { rfqCode: true } },
      creator: { select: { name: true } },
    },
  });

  if (!quote) throw new Error(`Quote not found: ${quoteId}`);

  // ── Build document sections ──
  const sections = [
    // Company header
    createParagraph(companyConfig.fullName),
    createMetadataParagraph("Địa chỉ:", companyConfig.address),
    createMetadataParagraph("Điện thoại:", companyConfig.phone),
    createMetadataParagraph("Email:", companyConfig.salesEmail),
    createSpacer(),

    // Title
    createTitle("BÁO GIÁ"),
    createSubtitle("QUOTATION"),

    // Quote info
    createMetadataParagraph("Mã báo giá:", quote.quoteCode),
    createMetadataParagraph("Ngày tạo:", formatDocumentDate(quote.createdAt)),
    createMetadataParagraph("Hiệu lực đến:", formatDocumentDate(quote.validUntil)),
    createMetadataParagraph("Người lập:", safeDocxText(quote.creator?.name)),
    ...(quote.rfq
      ? [createMetadataParagraph("Mã RFQ liên quan:", quote.rfq.rfqCode)]
      : []),
    createSpacer(),

    // Customer info
    createHeading("THÔNG TIN KHÁCH HÀNG"),
    createMetadataParagraph("Khách hàng:", safeDocxText(quote.customer?.name)),
    createMetadataParagraph("Công ty:", safeDocxText(quote.customer?.companyName)),
    createMetadataParagraph("Điện thoại:", safeDocxText(quote.customer?.phone)),
    createMetadataParagraph("Email:", safeDocxText(quote.customer?.email)),
    createMetadataParagraph("Địa chỉ:", safeDocxText(quote.customer?.address)),
    createSpacer(),

    // Product table
    createHeading("DANH SÁCH SẢN PHẨM"),
    createTable(
      ["STT", "Mã SP", "Tên sản phẩm", "Quy cách", "ĐVT", "SL", "Đơn giá", "CK %", "Thành tiền"],
      quote.items.map((item, idx) => [
        String(idx + 1),
        safeDocxText(item.productSku),
        item.productNameSnapshot,
        safeDocxText(item.packagingSnapshot),
        safeDocxText(item.unit),
        formatQuantity(item.quantity),
        formatDocumentCurrency(item.unitPrice),
        formatDocumentPercent(item.discountRate),
        formatDocumentCurrency(item.totalPrice),
      ]),
      [5, 8, 18, 12, 6, 6, 12, 8, 12]
    ),
    createSpacer(),

    // Totals
    createTotalsTable([
      { label: "Tạm tính:", value: formatDocumentCurrency(quote.subtotal) },
      { label: "Chiết khấu:", value: formatDocumentCurrency(quote.discountAmount) },
      { label: `VAT (${formatDocumentPercent(quote.vatRate)}):`, value: formatDocumentCurrency(quote.vatAmount) },
      { label: "Phí vận chuyển:", value: formatDocumentCurrency(quote.shippingFee) },
      { label: "TỔNG CỘNG:", value: formatDocumentCurrency(quote.totalAmount), bold: true },
    ]),
    createParagraph(`Bằng chữ: ${amountToWordsVi(quote.totalAmount)}`),
    createSpacer(),

    // Terms
    createHeading("ĐIỀU KIỆN THƯƠNG MẠI"),
    createMetadataParagraph("Điều kiện thanh toán:", safeDocxText(quote.paymentTerms)),
    createMetadataParagraph("Điều kiện giao hàng:", safeDocxText(quote.deliveryTerms)),

    ...(quote.commercialNotes
      ? [createSpacer(), createHeading("GHI CHÚ THƯƠNG MẠI"), createParagraph(quote.commercialNotes)]
      : []),
    ...(quote.technicalNotes
      ? [createSpacer(), createHeading("GHI CHÚ KỸ THUẬT"), createParagraph(quote.technicalNotes)]
      : []),
    createSpacer(),
    createSpacer(),

    // Signature
    createSignatureBlock("ĐẠI DIỆN GREENPEAT", "KHÁCH HÀNG"),
  ];

  const doc = createDocxDocument(sections);
  const buffer = await docxToBuffer(doc);

  const fileName = buildDocumentFileName({
    entityCode: quote.quoteCode,
    documentType: DocumentType.QUOTE,
    format: DocumentFormat.DOCX,
  });

  return {
    buffer,
    fileName,
    mimeType: getMimeTypeForFormat(DocumentFormat.DOCX),
  };
}
