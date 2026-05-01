/**
 * Contract Draft DOCX Generator
 * ─────────────────────────────
 * Generates an editable Word document for a Contract Draft.
 * Bilingual (Vietnamese / English) with standard articles.
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
// DEFAULT CONTRACT CLAUSES
// ═══════════════════════════════════════════════════════

const DEFAULT_CLAUSES = {
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

// ═══════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════

/**
 * Generate an editable DOCX for a Contract Draft.
 *
 * @param contractId  The Contract record ID.
 * @returns  Buffer + fileName + mimeType.
 * @throws   If contract not found.
 */
export async function generateContractDocx(
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

  // ── Build document ──
  const sections = [
    // Title
    createTitle("HỢP ĐỒNG MUA BÁN HÀNG HÓA"),
    createSubtitle("SALES CONTRACT"),
    createSpacer(),

    // Contract info
    createMetadataParagraph("Số hợp đồng / Contract No.:", contract.contractCode),
    createMetadataParagraph("Ngày ký / Date:", formatDocumentDate(contract.contractDate)),
    createSpacer(),

    // Seller
    createHeading("BÊN BÁN / SELLER"),
    createMetadataParagraph("Công ty:", companyConfig.fullName),
    createMetadataParagraph("Địa chỉ:", companyConfig.address),
    createMetadataParagraph("Điện thoại:", companyConfig.phone),
    createMetadataParagraph("Email:", companyConfig.salesEmail),
    createMetadataParagraph("Website:", companyConfig.website),
    createSpacer(),

    // Buyer
    createHeading("BÊN MUA / BUYER"),
    createMetadataParagraph("Khách hàng:", safeDocxText(contract.customer?.name)),
    createMetadataParagraph("Công ty:", safeDocxText(contract.customer?.companyName)),
    createMetadataParagraph("Điện thoại:", safeDocxText(contract.customer?.phone)),
    createMetadataParagraph("Email:", safeDocxText(contract.customer?.email)),
    createMetadataParagraph("Địa chỉ:", safeDocxText(contract.customer?.address)),
    createSpacer(),

    // Article 1: Goods
    createHeading("ĐIỀU 1: HÀNG HÓA / ARTICLE 1: GOODS"),
    createParagraph(
      "Bên Bán đồng ý bán và Bên Mua đồng ý mua các hàng hóa sau đây theo các điều kiện ghi trong Hợp đồng này:"
    ),
    createParagraph(
      "The Seller agrees to sell and the Buyer agrees to purchase the following goods under the terms of this Contract:"
    ),
    createSpacer(),
    ...(items.length > 0
      ? [
          createTable(
            ["STT", "Mã SP", "Tên sản phẩm", "Quy cách", "ĐVT", "SL", "Đơn giá", "Thành tiền"],
            items.map((item, idx) => [
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
        ]
      : [createParagraph("(Xem Phụ lục 1 đính kèm / See Appendix 1 attached)")]),
    createSpacer(),

    // Article 2: Contract Value
    createHeading("ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG / ARTICLE 2: CONTRACT VALUE"),
    ...(contract.order
      ? [
          createTotalsTable([
            { label: "Tạm tính:", value: formatDocumentCurrency(contract.order.subtotal) },
            { label: "Chiết khấu:", value: formatDocumentCurrency(contract.order.discountAmount) },
            { label: "Thuế VAT:", value: formatDocumentCurrency(contract.order.vatAmount) },
            { label: "Phí vận chuyển:", value: formatDocumentCurrency(contract.order.shippingFee) },
            { label: "TỔNG CỘNG:", value: formatDocumentCurrency(contract.totalAmount), bold: true },
          ]),
          createParagraph(`Bằng chữ: ${amountToWordsVi(contract.totalAmount)}`),
        ]
      : [
          createParagraph(`Tổng giá trị hợp đồng: ${formatDocumentCurrency(contract.totalAmount)}`),
          createParagraph(`Bằng chữ: ${amountToWordsVi(contract.totalAmount)}`),
        ]),
    createSpacer(),

    // Article 3: Payment Terms
    createHeading("ĐIỀU 3: ĐIỀU KHOẢN THANH TOÁN / ARTICLE 3: PAYMENT TERMS"),
    createParagraph(safeDocxText(contract.paymentTerms, "Theo thỏa thuận giữa hai bên.")),
    createSpacer(),

    // Article 4: Delivery Terms
    createHeading("ĐIỀU 4: ĐIỀU KHOẢN GIAO HÀNG / ARTICLE 4: DELIVERY TERMS"),
    createParagraph(safeDocxText(contract.deliveryTerms, "Theo thỏa thuận giữa hai bên.")),
    ...(contract.deliveryLocation
      ? [createMetadataParagraph("Địa điểm giao hàng / Delivery Location:", contract.deliveryLocation)]
      : []),
    createSpacer(),

    // Article 5: Incoterms
    createHeading("ĐIỀU 5: ĐIỀU KIỆN THƯƠNG MẠI QUỐC TẾ / ARTICLE 5: INCOTERMS"),
    createParagraph(safeDocxText(contract.incoterm, "EXW — Giao tại xưởng.")),
    createSpacer(),

    // Article 6: Quality
    createHeading("ĐIỀU 6: CHẤT LƯỢNG VÀ QUY CÁCH / ARTICLE 6: QUALITY & SPECIFICATIONS"),
    createParagraph(DEFAULT_CLAUSES.qualityVi),
    createParagraph(DEFAULT_CLAUSES.qualityEn),
    createSpacer(),

    // Article 7: Packing
    createHeading("ĐIỀU 7: BAO BÌ / ARTICLE 7: PACKING"),
    createParagraph(DEFAULT_CLAUSES.packingVi),
    createParagraph(DEFAULT_CLAUSES.packingEn),
    createSpacer(),

    // Article 8: Inspection
    createHeading("ĐIỀU 8: KIỂM TRA VÀ NGHIỆM THU / ARTICLE 8: INSPECTION & ACCEPTANCE"),
    createParagraph(DEFAULT_CLAUSES.inspectionVi),
    createParagraph(DEFAULT_CLAUSES.inspectionEn),
    createSpacer(),

    // Article 9: Warranty
    createHeading("ĐIỀU 9: BẢO HÀNH VÀ KHIẾU NẠI / ARTICLE 9: WARRANTY & COMPLAINTS"),
    createParagraph(DEFAULT_CLAUSES.warrantyVi),
    createParagraph(DEFAULT_CLAUSES.warrantyEn),
    createSpacer(),

    // Article 10: Force Majeure
    createHeading("ĐIỀU 10: BẤT KHẢ KHÁNG / ARTICLE 10: FORCE MAJEURE"),
    createParagraph(DEFAULT_CLAUSES.forceMajeureVi),
    createParagraph(DEFAULT_CLAUSES.forceMajeureEn),
    createSpacer(),

    // Article 11: Liability
    createHeading("ĐIỀU 11: TRÁCH NHIỆM VÀ PHẠT VI PHẠM / ARTICLE 11: LIABILITY & PENALTIES"),
    createParagraph(DEFAULT_CLAUSES.liabilityVi),
    createParagraph(DEFAULT_CLAUSES.liabilityEn),
    createSpacer(),

    // Article 12: Dispute Resolution
    createHeading("ĐIỀU 12: GIẢI QUYẾT TRANH CHẤP / ARTICLE 12: DISPUTE RESOLUTION"),
    createParagraph(DEFAULT_CLAUSES.disputeVi),
    createParagraph(DEFAULT_CLAUSES.disputeEn),
    createSpacer(),

    // Article 13: Language
    createHeading("ĐIỀU 13: NGÔN NGỮ ƯU TIÊN / ARTICLE 13: LANGUAGE PRIORITY"),
    createParagraph(DEFAULT_CLAUSES.languageVi),
    createParagraph(DEFAULT_CLAUSES.languageEn),
    createSpacer(),

    // Article 14: Appendices
    createHeading("ĐIỀU 14: PHỤ LỤC / ARTICLE 14: APPENDICES"),
    createParagraph(DEFAULT_CLAUSES.appendicesVi),
    createParagraph(DEFAULT_CLAUSES.appendicesEn),
    createSpacer(),

    // Custom content
    ...(contract.contentVi
      ? [createHeading("NỘI DUNG BỔ SUNG"), createParagraph(contract.contentVi)]
      : []),
    ...(contract.contentEn
      ? [createHeading("ADDITIONAL TERMS"), createParagraph(contract.contentEn)]
      : []),
    createSpacer(),
    createSpacer(),

    // Signature block
    createSignatureBlock("BÊN BÁN / SELLER", "BÊN MUA / BUYER"),
  ];

  const doc = createDocxDocument(sections);
  const buffer = await docxToBuffer(doc);

  const fileName = buildDocumentFileName({
    entityCode: contract.contractCode,
    documentType: DocumentType.CONTRACT_DRAFT,
    format: DocumentFormat.DOCX,
  });

  return {
    buffer,
    fileName,
    mimeType: getMimeTypeForFormat(DocumentFormat.DOCX),
  };
}
