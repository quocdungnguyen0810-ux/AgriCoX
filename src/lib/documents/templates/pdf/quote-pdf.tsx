/**
 * Quote PDF Generator
 * ───────────────────
 * Generates an official PDF for a Quote using @react-pdf/renderer.
 *
 * Phase 6A.6.
 */

import React from "react";
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
  Document,
  PdfPage,
  PdfTitle,
  PdfSectionTitle,
  PdfText,
  PdfMetadataRows,
  PdfTable,
  PdfTotalsBlock,
  PdfSignatureBlock,
  PdfSpacer,
  safePdfText,
  createPdfBuffer,
} from "./pdf-utils";
import type { XlsxGeneratorResult } from "../xlsx/quote-items-xlsx";

// ═══════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════

/**
 * Generate a PDF for a Quote.
 *
 * @param quoteId  The Quote record ID.
 * @returns  Buffer + fileName + mimeType.
 * @throws   If quote not found.
 */
export async function generateQuotePdf(
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

  const company = {
    fullName: companyConfig.fullName,
    address: companyConfig.address,
    phone: companyConfig.phone,
    email: companyConfig.salesEmail,
    website: companyConfig.website,
  };

  // ── Build PDF ──
  const element = (
    <Document>
      <PdfPage company={company} code={quote.quoteCode}>
        <PdfTitle main="BÁO GIÁ" sub="QUOTATION" />

        <PdfMetadataRows
          rows={[
            { label: "Mã báo giá:", value: quote.quoteCode },
            { label: "Ngày tạo:", value: formatDocumentDate(quote.createdAt) },
            { label: "Hiệu lực đến:", value: formatDocumentDate(quote.validUntil) },
            { label: "Người lập:", value: safePdfText(quote.creator?.name) },
            ...(quote.rfq
              ? [{ label: "Mã RFQ:", value: quote.rfq.rfqCode }]
              : []),
          ]}
        />

        <PdfSpacer />

        <PdfSectionTitle text="THÔNG TIN KHÁCH HÀNG" />
        <PdfMetadataRows
          rows={[
            { label: "Khách hàng:", value: safePdfText(quote.customer?.name) },
            { label: "Công ty:", value: safePdfText(quote.customer?.companyName) },
            { label: "Điện thoại:", value: safePdfText(quote.customer?.phone) },
            { label: "Email:", value: safePdfText(quote.customer?.email) },
            { label: "Địa chỉ:", value: safePdfText(quote.customer?.address) },
          ]}
        />

        <PdfSpacer />

        <PdfSectionTitle text="DANH SÁCH SẢN PHẨM" />
        <PdfTable
          headers={["STT", "Mã SP", "Tên sản phẩm", "Quy cách", "ĐVT", "SL", "Đơn giá", "CK %", "Thành tiền"]}
          rows={quote.items.map((item, idx) => [
            String(idx + 1),
            safePdfText(item.productSku),
            item.productNameSnapshot,
            safePdfText(item.packagingSnapshot),
            safePdfText(item.unit),
            formatQuantity(item.quantity),
            formatDocumentCurrency(item.unitPrice),
            formatDocumentPercent(item.discountRate),
            formatDocumentCurrency(item.totalPrice),
          ])}
          colWidths={["5%", "8%", "18%", "12%", "6%", "6%", "13%", "8%", "13%"]}
        />

        <PdfTotalsBlock
          rows={[
            { label: "Tạm tính:", value: formatDocumentCurrency(quote.subtotal) },
            { label: "Chiết khấu:", value: formatDocumentCurrency(quote.discountAmount) },
            { label: `VAT (${formatDocumentPercent(quote.vatRate)}):`, value: formatDocumentCurrency(quote.vatAmount) },
            { label: "Phí vận chuyển:", value: formatDocumentCurrency(quote.shippingFee) },
            { label: "TỔNG CỘNG:", value: formatDocumentCurrency(quote.totalAmount), bold: true },
          ]}
          amountInWords={amountToWordsVi(quote.totalAmount)}
        />

        <PdfSpacer />

        <PdfSectionTitle text="ĐIỀU KIỆN THƯƠNG MẠI" />
        <PdfMetadataRows
          rows={[
            { label: "Thanh toán:", value: safePdfText(quote.paymentTerms) },
            { label: "Giao hàng:", value: safePdfText(quote.deliveryTerms) },
          ]}
        />

        {quote.commercialNotes && (
          <>
            <PdfSpacer />
            <PdfSectionTitle text="GHI CHÚ THƯƠNG MẠI" />
            <PdfText>{quote.commercialNotes}</PdfText>
          </>
        )}

        {quote.technicalNotes && (
          <>
            <PdfSpacer />
            <PdfSectionTitle text="GHI CHÚ KỸ THUẬT" />
            <PdfText>{quote.technicalNotes}</PdfText>
          </>
        )}

        <PdfSignatureBlock
          leftTitle="ĐẠI DIỆN GREENPEAT"
          rightTitle="KHÁCH HÀNG"
        />
      </PdfPage>
    </Document>
  );

  const buffer = await createPdfBuffer(element);

  const fileName = buildDocumentFileName({
    entityCode: quote.quoteCode,
    documentType: DocumentType.QUOTE,
    format: DocumentFormat.PDF,
  });

  return {
    buffer,
    fileName,
    mimeType: getMimeTypeForFormat(DocumentFormat.PDF),
  };
}
