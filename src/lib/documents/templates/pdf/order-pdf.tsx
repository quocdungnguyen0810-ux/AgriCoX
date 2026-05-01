/**
 * Order Confirmation PDF Generator
 * ─────────────────────────────────
 * Generates an official PDF for an Order Confirmation.
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
 * Generate a PDF for an Order Confirmation.
 *
 * @param orderId  The Order record ID.
 * @returns  Buffer + fileName + mimeType.
 * @throws   If order not found.
 */
export async function generateOrderConfirmationPdf(
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
      <PdfPage company={company} code={order.orderCode}>
        <PdfTitle main="XÁC NHẬN ĐƠN HÀNG" sub="ORDER CONFIRMATION" />

        <PdfMetadataRows
          rows={[
            { label: "Mã đơn hàng:", value: order.orderCode },
            ...(order.quote
              ? [{ label: "Mã báo giá:", value: order.quote.quoteCode }]
              : []),
            { label: "Ngày đặt hàng:", value: formatDocumentDate(order.orderDate) },
            { label: "Phụ trách:", value: safePdfText(order.assignee?.name) },
          ]}
        />

        <PdfSpacer />

        <PdfSectionTitle text="THÔNG TIN KHÁCH HÀNG" />
        <PdfMetadataRows
          rows={[
            { label: "Khách hàng:", value: safePdfText(order.customer?.name) },
            { label: "Công ty:", value: safePdfText(order.customer?.companyName) },
            { label: "Điện thoại:", value: safePdfText(order.customer?.phone) },
            { label: "Email:", value: safePdfText(order.customer?.email) },
            { label: "Địa chỉ:", value: safePdfText(order.customer?.address) },
          ]}
        />

        <PdfSpacer />

        <PdfSectionTitle text="DANH SÁCH SẢN PHẨM" />
        <PdfTable
          headers={["STT", "Mã SP", "Tên sản phẩm", "Quy cách", "ĐVT", "SL", "Đơn giá", "Thành tiền"]}
          rows={order.items.map((item, idx) => [
            String(idx + 1),
            safePdfText(item.productSku),
            item.productNameSnapshot,
            safePdfText(item.packagingSnapshot),
            safePdfText(item.unit),
            formatQuantity(item.quantity),
            formatDocumentCurrency(item.unitPrice),
            formatDocumentCurrency(item.totalPrice),
          ])}
          colWidths={["5%", "9%", "21%", "13%", "7%", "7%", "14%", "14%"]}
        />

        <PdfTotalsBlock
          rows={[
            { label: "Tạm tính:", value: formatDocumentCurrency(order.subtotal) },
            { label: "Chiết khấu:", value: formatDocumentCurrency(order.discountAmount) },
            { label: "Thuế VAT:", value: formatDocumentCurrency(order.vatAmount) },
            { label: "Phí vận chuyển:", value: formatDocumentCurrency(order.shippingFee) },
            { label: "TỔNG CỘNG:", value: formatDocumentCurrency(order.totalAmount), bold: true },
          ]}
          amountInWords={amountToWordsVi(order.totalAmount)}
        />

        <PdfSpacer />

        <PdfSectionTitle text="TRẠNG THÁI" />
        <PdfMetadataRows
          rows={[
            { label: "Đơn hàng:", value: order.status },
            { label: "Thanh toán:", value: order.paymentStatus },
            { label: "Giao hàng:", value: order.fulfillmentStatus },
          ]}
        />

        <PdfSpacer />

        <PdfSectionTitle text="THÔNG TIN GIAO HÀNG" />
        <PdfMetadataRows
          rows={[
            { label: "Điều kiện thanh toán:", value: safePdfText(order.paymentTerms) },
            { label: "Điều kiện giao hàng:", value: safePdfText(order.deliveryTerms) },
            { label: "Địa chỉ giao:", value: safePdfText(order.deliveryAddress) },
            { label: "Ngày giao dự kiến:", value: formatDocumentDate(order.expectedDeliveryDate) },
          ]}
        />

        {order.notes && (
          <>
            <PdfSpacer />
            <PdfSectionTitle text="GHI CHÚ" />
            <PdfText>{order.notes}</PdfText>
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
    entityCode: order.orderCode,
    documentType: DocumentType.ORDER_CONFIRMATION,
    format: DocumentFormat.PDF,
  });

  return {
    buffer,
    fileName,
    mimeType: getMimeTypeForFormat(DocumentFormat.PDF),
  };
}
