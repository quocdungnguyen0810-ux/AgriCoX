/**
 * Typed error codes and error class for quote operations.
 * Used by server actions and caught by client components.
 *
 * IMPORTANT: Server Actions serialize return values. Thrown Error objects lose
 * custom properties (like `code`) during serialization. Therefore, quote server
 * actions return ActionResult<T> instead of throwing, and QuoteError is used
 * internally for control flow only.
 */

// ── Error Code Constants ──

export const QUOTE_ERROR_CODES = {
  // ── Quote errors ──
  RFQ_NOT_FOUND: "RFQ_NOT_FOUND",
  RFQ_NO_ITEMS: "RFQ_NO_ITEMS",
  QUOTE_NOT_FOUND: "QUOTE_NOT_FOUND",
  QUOTE_NOT_EDITABLE: "QUOTE_NOT_EDITABLE",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  QUOTE_NOT_READY: "QUOTE_NOT_READY",
  INVALID_PRICING: "INVALID_PRICING",
  // ── Order errors ──
  QUOTE_NOT_ACCEPTED: "QUOTE_NOT_ACCEPTED",
  ORDER_ALREADY_EXISTS: "ORDER_ALREADY_EXISTS",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  ORDER_UPDATE_FAILED: "ORDER_UPDATE_FAILED",
  CUSTOMER_MISSING: "CUSTOMER_MISSING",
  // ── Product errors ──
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  QUOTE_UPDATE_FAILED: "QUOTE_UPDATE_FAILED",
  QUOTE_ITEM_NOT_FOUND: "QUOTE_ITEM_NOT_FOUND",
  // ── Contract errors ──
  ORDER_NOT_READY_FOR_CONTRACT: "ORDER_NOT_READY_FOR_CONTRACT",
  CONTRACT_ALREADY_EXISTS: "CONTRACT_ALREADY_EXISTS",
  CONTRACT_CREATE_FAILED: "CONTRACT_CREATE_FAILED",
  CONTRACT_NOT_FOUND: "CONTRACT_NOT_FOUND",
  CONTRACT_NOT_EDITABLE: "CONTRACT_NOT_EDITABLE",
  CONTRACT_UPDATE_FAILED: "CONTRACT_UPDATE_FAILED",
  INVALID_CONTRACT_TRANSITION: "INVALID_CONTRACT_TRANSITION",
  INVALID_SIGNER_ROLE: "INVALID_SIGNER_ROLE",
  CONTRACT_NOT_READY_FOR_SIGNING: "CONTRACT_NOT_READY_FOR_SIGNING",
  SIGNING_LINK_CREATE_FAILED: "SIGNING_LINK_CREATE_FAILED",
} as const;

export type QuoteErrorCode = (typeof QUOTE_ERROR_CODES)[keyof typeof QUOTE_ERROR_CODES];

// ── Typed QuoteError class ──

export class QuoteError extends Error {
  code: QuoteErrorCode;

  constructor(code: QuoteErrorCode, message: string) {
    super(message);
    this.name = "QuoteError";
    this.code = code;
  }
}

// ── Action Result type ──
// Server actions return this instead of throwing, so the client
// always gets structured data with error codes intact.

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: QuoteErrorCode; message: string } };

/**
 * Helper to create a success result.
 */
export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/**
 * Helper to create an error result from a QuoteError.
 */
export function fail(code: QuoteErrorCode, message: string): ActionResult<never> {
  return { success: false, error: { code, message } };
}
