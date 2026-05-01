/**
 * Document Generation Constants
 * ──────────────────────────────
 * Central definitions for all document types, entity types, formats,
 * and related mappings used throughout the document generation system.
 *
 * Phase 6A — no Google Drive, no Google Sheet, no email.
 */

// ═══════════════════════════════════════════════════════
// ENTITY TYPES — which business record the document belongs to
// ═══════════════════════════════════════════════════════

export const EntityType = {
  QUOTE: "QUOTE",
  ORDER: "ORDER",
  CONTRACT: "CONTRACT",
  RFQ: "RFQ",
  PAYMENT: "PAYMENT",
  DELIVERY: "DELIVERY",
} as const;

export type EntityType = (typeof EntityType)[keyof typeof EntityType];

// ═══════════════════════════════════════════════════════
// DOCUMENT TYPES — what kind of document is generated
// ═══════════════════════════════════════════════════════

export const DocumentType = {
  // Single-entity documents
  QUOTE: "QUOTE",
  ORDER_CONFIRMATION: "ORDER_CONFIRMATION",
  CONTRACT_DRAFT: "CONTRACT_DRAFT",
  CONTRACT_SIGNED: "CONTRACT_SIGNED",

  // Appendices (typically XLSX worksheets)
  APPENDIX_PRODUCT_LIST: "APPENDIX_PRODUCT_LIST",
  APPENDIX_TECHNICAL_SPECS: "APPENDIX_TECHNICAL_SPECS",
  APPENDIX_DELIVERY_SCHEDULE: "APPENDIX_DELIVERY_SCHEDULE",
  APPENDIX_PAYMENT_SCHEDULE: "APPENDIX_PAYMENT_SCHEDULE",

  // Management exports (bulk list XLSX)
  RFQ_LOG: "RFQ_LOG",
  QUOTE_LOG: "QUOTE_LOG",
  ORDER_LOG: "ORDER_LOG",
  CONTRACT_LOG: "CONTRACT_LOG",
  DOCUMENT_LOG: "DOCUMENT_LOG",
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

// ═══════════════════════════════════════════════════════
// FILE FORMATS
// ═══════════════════════════════════════════════════════

export const DocumentFormat = {
  PDF: "PDF",
  DOCX: "DOCX",
  XLSX: "XLSX",
} as const;

export type DocumentFormat =
  (typeof DocumentFormat)[keyof typeof DocumentFormat];

// ═══════════════════════════════════════════════════════
// DOCUMENT STATUS
// ═══════════════════════════════════════════════════════

export const DocumentStatus = {
  GENERATED: "GENERATED",
  ARCHIVED: "ARCHIVED",
  DELETED: "DELETED",
} as const;

export type DocumentStatus =
  (typeof DocumentStatus)[keyof typeof DocumentStatus];

// ═══════════════════════════════════════════════════════
// STORAGE PROVIDER
// ═══════════════════════════════════════════════════════

export const StorageProvider = {
  LOCAL: "LOCAL",
  GOOGLE_DRIVE: "GOOGLE_DRIVE",
} as const;

export type StorageProvider =
  (typeof StorageProvider)[keyof typeof StorageProvider];

// ═══════════════════════════════════════════════════════
// TYPE GUARDS — runtime validation for untrusted input
// ═══════════════════════════════════════════════════════

const ENTITY_TYPE_VALUES = new Set<string>(Object.values(EntityType));
const DOCUMENT_TYPE_VALUES = new Set<string>(Object.values(DocumentType));
const DOCUMENT_FORMAT_VALUES = new Set<string>(Object.values(DocumentFormat));

/** Check if a string is a valid EntityType. */
export function isEntityType(value: string): value is EntityType {
  return ENTITY_TYPE_VALUES.has(value);
}

/** Check if a string is a valid DocumentType. */
export function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPE_VALUES.has(value);
}

/** Check if a string is a valid DocumentFormat. */
export function isDocumentFormat(value: string): value is DocumentFormat {
  return DOCUMENT_FORMAT_VALUES.has(value);
}

// ═══════════════════════════════════════════════════════
// MIME TYPE MAPPING
// ═══════════════════════════════════════════════════════

export const FORMAT_MIME_TYPE: Record<DocumentFormat, string> = {
  PDF: "application/pdf",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// ═══════════════════════════════════════════════════════
// FILE EXTENSION MAPPING
// ═══════════════════════════════════════════════════════

export const FORMAT_EXTENSION: Record<DocumentFormat, string> = {
  PDF: "pdf",
  DOCX: "docx",
  XLSX: "xlsx",
};

// ═══════════════════════════════════════════════════════
// LOOKUP FUNCTIONS — for use when input is already validated
// ═══════════════════════════════════════════════════════

/** Get MIME type for a given document format. */
export function getMimeTypeForFormat(format: DocumentFormat): string {
  return FORMAT_MIME_TYPE[format];
}

/** Get file extension (without dot) for a given document format. */
export function getFileExtensionForFormat(format: DocumentFormat): string {
  return FORMAT_EXTENSION[format];
}

// ═══════════════════════════════════════════════════════
// VIETNAMESE LABELS — for UI display
// ═══════════════════════════════════════════════════════

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  QUOTE: "Báo giá",
  ORDER_CONFIRMATION: "Xác nhận đơn hàng",
  CONTRACT_DRAFT: "Hợp đồng nháp",
  CONTRACT_SIGNED: "Hợp đồng đã ký",
  APPENDIX_PRODUCT_LIST: "Phụ lục — Danh sách sản phẩm",
  APPENDIX_TECHNICAL_SPECS: "Phụ lục — Thông số kỹ thuật",
  APPENDIX_DELIVERY_SCHEDULE: "Phụ lục — Lịch giao hàng",
  APPENDIX_PAYMENT_SCHEDULE: "Phụ lục — Lịch thanh toán",
  RFQ_LOG: "Sổ yêu cầu báo giá",
  QUOTE_LOG: "Sổ báo giá",
  ORDER_LOG: "Sổ đơn hàng",
  CONTRACT_LOG: "Sổ hợp đồng",
  DOCUMENT_LOG: "Sổ tài liệu",
};

export const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  QUOTE: "Báo giá",
  ORDER: "Đơn hàng",
  CONTRACT: "Hợp đồng",
  RFQ: "Yêu cầu báo giá",
  PAYMENT: "Thanh toán",
  DELIVERY: "Giao hàng",
};

export const FORMAT_LABEL: Record<DocumentFormat, string> = {
  PDF: "PDF",
  DOCX: "Word (DOCX)",
  XLSX: "Excel (XLSX)",
};

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  GENERATED: "Đã tạo",
  ARCHIVED: "Lưu trữ",
  DELETED: "Đã xóa",
};

// ═══════════════════════════════════════════════════════
// VALID COMBINATIONS — which formats are available per document type
// ═══════════════════════════════════════════════════════

export const ALLOWED_FORMATS: Record<DocumentType, DocumentFormat[]> = {
  QUOTE: ["PDF", "DOCX", "XLSX"],
  ORDER_CONFIRMATION: ["PDF", "DOCX", "XLSX"],
  CONTRACT_DRAFT: ["PDF", "DOCX"],
  CONTRACT_SIGNED: ["PDF"],
  APPENDIX_PRODUCT_LIST: ["XLSX"],
  APPENDIX_TECHNICAL_SPECS: ["XLSX"],
  APPENDIX_DELIVERY_SCHEDULE: ["XLSX"],
  APPENDIX_PAYMENT_SCHEDULE: ["XLSX"],
  RFQ_LOG: ["XLSX"],
  QUOTE_LOG: ["XLSX"],
  ORDER_LOG: ["XLSX"],
  CONTRACT_LOG: ["XLSX"],
  DOCUMENT_LOG: ["XLSX"],
};

/**
 * Check if a given format is allowed for a document type.
 */
export function isFormatAllowed(
  documentType: DocumentType,
  format: DocumentFormat
): boolean {
  return ALLOWED_FORMATS[documentType]?.includes(format) ?? false;
}

/**
 * Build a safe, human-readable filename for document download.
 *
 * Convention: lowercase, hyphen-separated, with version and extension.
 *
 * Examples:
 *   buildDocumentFileName({ entityCode: "GP-QT-2026-0001", documentType: "QUOTE", format: "PDF", version: 1 })
 *     → "gp-qt-2026-0001-quote-v1.pdf"
 *   buildDocumentFileName({ entityCode: "GP-ORD-2026-0001", documentType: "ORDER_CONFIRMATION", format: "DOCX", version: 2 })
 *     → "gp-ord-2026-0001-order-confirmation-v2.docx"
 *   buildDocumentFileName({ entityCode: "GP-CT-2026-0001", documentType: "CONTRACT_DRAFT", format: "PDF" })
 *     → "gp-ct-2026-0001-contract-draft-v1.pdf"
 *   buildDocumentFileName({ entityCode: "GP-CT-2026-0001", documentType: "APPENDIX_PRODUCT_LIST", format: "XLSX" })
 *     → "gp-ct-2026-0001-appendix-product-list-v1.xlsx"
 */
export function buildDocumentFileName(params: {
  entityCode: string;
  documentType: DocumentType;
  format: DocumentFormat;
  version?: number;
}): string {
  const { entityCode, documentType, format, version = 1 } = params;

  // Convert document type to lowercase slug: ORDER_CONFIRMATION → order-confirmation
  const typeSlug = documentType.toLowerCase().replace(/_/g, "-");

  // Sanitize entity code: keep only alphanumeric + hyphens, lowercase
  const safeCode = entityCode
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const ext = FORMAT_EXTENSION[format];

  return `${safeCode}-${typeSlug}-v${version}.${ext}`;
}
