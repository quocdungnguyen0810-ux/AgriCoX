/**
 * Contract Draft PDF Generator
 * ────────────────────────────
 * Generates an official PDF for a Contract Draft.
 * Bilingual (Vietnamese / English) with standard articles.
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
// DEFAULT CLAUSES (same as DOCX, kept local)
// ═══════════════════════════════════════════════════════

const CLAUSES = {
  qualityVi:
    "Hàng hóa phải đạt đúng chất lượng, quy cách và tiêu chuẩn kỹ thuật theo Phụ lục 2 đính kèm Hợp đồng này.",
  qualityEn:
    "Goods shall meet the quality, specifications, and technical standards as per Appendix 2 attached to this Contract.",

  packingVi:
    "Hàng hóa được đóng gói phù hợp cho vận chuyển đường bộ/biển, đảm bảo an toàn chất lượng sản phẩm trong suốt quá trình vận chuyển và lưu kho.",
  packingEn:
    "Goods shall be packed suitably for land/sea transportation, ensuring product quality safety during transit and storage.",

  inspectionVi:
    "Bên Mua có quyền kiểm tra hàng hóa tại thời điểm giao hàng. Mọi khiếu nại về chất lượng phải được thông báo bằng văn bản trong vòng 07 ngày kể từ ngày nhận hàng.",
  inspectionEn:
    "The Buyer has the right to inspect the goods at the time of delivery. Any quality complaints must be notified in writing within 07 days from the date of receipt.",

  warrantyVi:
    "Bên Bán bảo hành chất lượng hàng hóa trong thời hạn 12 tháng kể từ ngày giao hàng. Bảo hành không áp dụng cho các hư hỏng do sử dụng sai mục đích hoặc bảo quản không đúng cách.",
  warrantyEn:
    "The Seller warrants the quality of goods for a period of 12 months from the date of delivery. Warranty does not apply to damage caused by misuse or improper storage.",

  forceMajeureVi:
    "Hai bên không chịu trách nhiệm về việc không thực hiện nghĩa vụ hợp đồng do sự kiện bất khả kháng theo quy định của pháp luật Việt Nam. Bên bị ảnh hưởng phải thông báo cho bên kia trong vòng 07 ngày kể từ khi sự kiện xảy ra.",
  forceMajeureEn:
    "Neither party shall be liable for failure to perform contractual obligations due to force majeure events as defined by Vietnamese law. The affected party must notify the other within 07 days from the occurrence of such event.",

  liabilityVi:
    "Bên vi phạm phải chịu phạt 08% giá trị phần hợp đồng bị vi phạm. Ngoài khoản phạt, bên vi phạm còn phải bồi thường thiệt hại thực tế phát sinh (nếu có).",
  liabilityEn:
    "The breaching party shall pay a penalty of 08% of the value of the breached portion. In addition to the penalty, the breaching party shall compensate for actual damages incurred (if any).",

  disputeVi:
    "Mọi tranh chấp phát sinh từ hoặc liên quan đến Hợp đồng này được giải quyết thông qua thương lượng. Trường hợp không thương lượng được, tranh chấp sẽ được đưa ra Tòa án nhân dân có thẩm quyền tại Việt Nam.",
  disputeEn:
    "Any disputes arising from or relating to this Contract shall be resolved through negotiation. If negotiation fails, disputes shall be submitted to the competent People's Court in Vietnam.",

  languageVi:
    "Hợp đồng này được lập bằng tiếng Việt và tiếng Anh. Trong trường hợp có sự khác biệt giữa hai bản, bản tiếng Việt sẽ được ưu tiên áp dụng.",
  languageEn:
    "This Contract is made in Vietnamese and English. In case of discrepancy between the two versions, the Vietnamese version shall prevail.",

  appendicesVi:
    "Các phụ lục sau đây là bộ phận không thể tách rời của Hợp đồng:\n• Phụ lục 1: Danh sách sản phẩm\n• Phụ lục 2: Thông số kỹ thuật\n• Phụ lục 3: Lịch giao hàng\n• Phụ lục 4: Lịch thanh toán",
  appendicesEn:
    "The following appendices are integral parts of this Contract:\n• Appendix 1: Product List\n• Appendix 2: Technical Specifications\n• Appendix 3: Delivery Schedule\n• Appendix 4: Payment Schedule",
};

// Helper: render an article with bilingual text
function Article({
  title,
  viText,
  enText,
}: {
  title: string;
  viText: string;
  enText: string;
}) {
  return (
    <>
      <PdfSectionTitle text={title} />
      <PdfText>{viText}</PdfText>
      <PdfText italic>{enText}</PdfText>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════

/**
 * Generate a PDF for a Contract Draft.
 *
 * @param contractId  The Contract record ID.
 * @returns  Buffer + fileName + mimeType.
 * @throws   If contract not found.
 */
export async function generateContractPdf(
  contractId: string
): Promise<XlsxGeneratorResult> {
  // ── Fetch data ──
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      customer: {
        select: {
          name: true,
          companyName: true,
          phone: true,
          email: true,
          address: true,
        },
      },
      order: {
        include: {
          items: { orderBy: { productNameSnapshot: "asc" } },
        },
      },
      quote: { select: { quoteCode: true } },
      rfq: { select: { rfqCode: true } },
      creator: { select: { name: true } },
    },
  });

  if (!contract) throw new Error(`Contract not found: ${contractId}`);

  const items = contract.order?.items ?? [];
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
      <PdfPage company={company} code={contract.contractCode}>
        <PdfTitle main="HỢP ĐỒNG MUA BÁN HÀNG HÓA" sub="SALES CONTRACT" />

        <PdfMetadataRows
          rows={[
            { label: "Số hợp đồng:", value: contract.contractCode },
            { label: "Ngày ký:", value: formatDocumentDate(contract.contractDate) },
          ]}
        />

        <PdfSpacer />

        {/* Seller */}
        <PdfSectionTitle text="BÊN BÁN / SELLER" />
        <PdfMetadataRows
          rows={[
            { label: "Công ty:", value: companyConfig.fullName },
            { label: "Địa chỉ:", value: companyConfig.address },
            { label: "Điện thoại:", value: companyConfig.phone },
            { label: "Email:", value: companyConfig.salesEmail },
          ]}
        />

        <PdfSpacer />

        {/* Buyer */}
        <PdfSectionTitle text="BÊN MUA / BUYER" />
        <PdfMetadataRows
          rows={[
            { label: "Khách hàng:", value: safePdfText(contract.customer?.name) },
            { label: "Công ty:", value: safePdfText(contract.customer?.companyName) },
            { label: "Điện thoại:", value: safePdfText(contract.customer?.phone) },
            { label: "Email:", value: safePdfText(contract.customer?.email) },
            { label: "Địa chỉ:", value: safePdfText(contract.customer?.address) },
          ]}
        />

        <PdfSpacer />

        {/* Article 1: Goods */}
        <PdfSectionTitle text="ĐIỀU 1: HÀNG HÓA / ARTICLE 1: GOODS" />
        <PdfText>
          Bên Bán đồng ý bán và Bên Mua đồng ý mua các hàng hóa sau đây:
        </PdfText>

        {items.length > 0 ? (
          <PdfTable
            headers={["STT", "Mã SP", "Tên sản phẩm", "Quy cách", "ĐVT", "SL", "Đơn giá", "Thành tiền"]}
            rows={items.map((item, idx) => [
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
        ) : (
          <PdfText italic>
            (Xem Phụ lục 1 đính kèm / See Appendix 1 attached)
          </PdfText>
        )}

        <PdfSpacer />

        {/* Article 2: Contract Value */}
        <PdfSectionTitle text="ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG / ARTICLE 2: CONTRACT VALUE" />
        {contract.order ? (
          <PdfTotalsBlock
            rows={[
              { label: "Tạm tính:", value: formatDocumentCurrency(contract.order.subtotal) },
              { label: "Chiết khấu:", value: formatDocumentCurrency(contract.order.discountAmount) },
              { label: "Thuế VAT:", value: formatDocumentCurrency(contract.order.vatAmount) },
              { label: "Phí vận chuyển:", value: formatDocumentCurrency(contract.order.shippingFee) },
              { label: "TỔNG CỘNG:", value: formatDocumentCurrency(contract.totalAmount), bold: true },
            ]}
            amountInWords={amountToWordsVi(contract.totalAmount)}
          />
        ) : (
          <>
            <PdfText>
              {`Tổng giá trị hợp đồng: ${formatDocumentCurrency(contract.totalAmount)}`}
            </PdfText>
            <PdfText italic>
              {`Bằng chữ: ${amountToWordsVi(contract.totalAmount)}`}
            </PdfText>
          </>
        )}

        <PdfSpacer />

        {/* Article 3: Payment */}
        <PdfSectionTitle text="ĐIỀU 3: THANH TOÁN / ARTICLE 3: PAYMENT TERMS" />
        <PdfText>
          {safePdfText(contract.paymentTerms, "Theo thỏa thuận giữa hai bên.")}
        </PdfText>

        {/* Article 4: Delivery */}
        <PdfSectionTitle text="ĐIỀU 4: GIAO HÀNG / ARTICLE 4: DELIVERY TERMS" />
        <PdfText>
          {safePdfText(contract.deliveryTerms, "Theo thỏa thuận giữa hai bên.")}
        </PdfText>
        {contract.deliveryLocation && (
          <PdfText>{`Địa điểm giao hàng: ${contract.deliveryLocation}`}</PdfText>
        )}

        {/* Article 5: Incoterms */}
        <PdfSectionTitle text="ĐIỀU 5: INCOTERMS" />
        <PdfText>
          {safePdfText(contract.incoterm, "EXW — Giao tại xưởng.")}
        </PdfText>

        {/* Articles 6-14 */}
        <Article
          title="ĐIỀU 6: CHẤT LƯỢNG / ARTICLE 6: QUALITY & SPECIFICATIONS"
          viText={CLAUSES.qualityVi}
          enText={CLAUSES.qualityEn}
        />

        <Article
          title="ĐIỀU 7: BAO BÌ / ARTICLE 7: PACKING"
          viText={CLAUSES.packingVi}
          enText={CLAUSES.packingEn}
        />

        <Article
          title="ĐIỀU 8: KIỂM TRA / ARTICLE 8: INSPECTION & ACCEPTANCE"
          viText={CLAUSES.inspectionVi}
          enText={CLAUSES.inspectionEn}
        />

        <Article
          title="ĐIỀU 9: BẢO HÀNH / ARTICLE 9: WARRANTY & COMPLAINTS"
          viText={CLAUSES.warrantyVi}
          enText={CLAUSES.warrantyEn}
        />

        <Article
          title="ĐIỀU 10: BẤT KHẢ KHÁNG / ARTICLE 10: FORCE MAJEURE"
          viText={CLAUSES.forceMajeureVi}
          enText={CLAUSES.forceMajeureEn}
        />

        <Article
          title="ĐIỀU 11: PHẠT VI PHẠM / ARTICLE 11: LIABILITY & PENALTIES"
          viText={CLAUSES.liabilityVi}
          enText={CLAUSES.liabilityEn}
        />

        <Article
          title="ĐIỀU 12: TRANH CHẤP / ARTICLE 12: DISPUTE RESOLUTION"
          viText={CLAUSES.disputeVi}
          enText={CLAUSES.disputeEn}
        />

        <Article
          title="ĐIỀU 13: NGÔN NGỮ / ARTICLE 13: LANGUAGE PRIORITY"
          viText={CLAUSES.languageVi}
          enText={CLAUSES.languageEn}
        />

        <Article
          title="ĐIỀU 14: PHỤ LỤC / ARTICLE 14: APPENDICES"
          viText={CLAUSES.appendicesVi}
          enText={CLAUSES.appendicesEn}
        />

        {/* Custom content */}
        {contract.contentVi && (
          <>
            <PdfSectionTitle text="NỘI DUNG BỔ SUNG" />
            <PdfText>{contract.contentVi}</PdfText>
          </>
        )}
        {contract.contentEn && (
          <>
            <PdfSectionTitle text="ADDITIONAL TERMS" />
            <PdfText italic>{contract.contentEn}</PdfText>
          </>
        )}

        <PdfSignatureBlock
          leftTitle="BÊN BÁN / SELLER"
          rightTitle="BÊN MUA / BUYER"
        />
      </PdfPage>
    </Document>
  );

  const buffer = await createPdfBuffer(element);

  const fileName = buildDocumentFileName({
    entityCode: contract.contractCode,
    documentType: DocumentType.CONTRACT_DRAFT,
    format: DocumentFormat.PDF,
  });

  return {
    buffer,
    fileName,
    mimeType: getMimeTypeForFormat(DocumentFormat.PDF),
  };
}
