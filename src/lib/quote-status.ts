/**
 * Quote status constants, labels, transitions, and validation.
 * Single source of truth for the quote lifecycle.
 */

// ── Status Constants ──

export const QUOTE_STATUSES = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  CONVERTED: "CONVERTED",
} as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[keyof typeof QUOTE_STATUSES];

// ── Vietnamese Labels ──

export const quoteStatusLabels: Record<string, string> = {
  DRAFT: "Bản nháp",
  SENT: "Đã gửi KH",
  REVISION_REQUESTED: "Yêu cầu sửa",
  ACCEPTED: "KH chấp nhận",
  REJECTED: "KH từ chối",
  EXPIRED: "Hết hạn",
  CONVERTED: "Đã chuyển ĐH",
};

// ── Badge Colors ──

export const quoteStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  REVISION_REQUESTED: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-purple-100 text-purple-700",
};

// ── Allowed Transitions (whitelist) ──

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT"],
  SENT: ["ACCEPTED", "REJECTED", "REVISION_REQUESTED", "EXPIRED"],
  REVISION_REQUESTED: ["DRAFT"],
  ACCEPTED: ["CONVERTED"],
  // REJECTED, EXPIRED, CONVERTED are terminal — no outbound transitions
};

/**
 * Validate whether a status transition is allowed.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateQuoteTransition(
  from: string,
  to: string
): { valid: true } | { valid: false; reason: string } {
  if (from === to) {
    return { valid: false, reason: `Trạng thái không thay đổi` };
  }

  const allowed = ALLOWED_TRANSITIONS[from];

  if (!allowed) {
    return {
      valid: false,
      reason: `Trạng thái "${quoteStatusLabels[from] || from}" không cho phép chuyển tiếp`,
    };
  }

  if (!allowed.includes(to)) {
    return {
      valid: false,
      reason: `Không thể chuyển từ "${quoteStatusLabels[from] || from}" sang "${quoteStatusLabels[to] || to}"`,
    };
  }

  return { valid: true };
}

/**
 * Check if a status is terminal (no further transitions allowed).
 */
export function isTerminalStatus(status: string): boolean {
  return !ALLOWED_TRANSITIONS[status] || ALLOWED_TRANSITIONS[status].length === 0;
}

// ── UI Button Config ──

/** Transition buttons shown in the QuoteEditor for each status. */
export const quoteStatusTransitions: Record<string, { label: string; status: string; color: string }[]> = {
  DRAFT: [
    { label: "Gửi cho KH", status: "SENT", color: "bg-blue-500 hover:bg-blue-600" },
  ],
  SENT: [
    { label: "KH chấp nhận", status: "ACCEPTED", color: "bg-emerald-500 hover:bg-emerald-600" },
    { label: "KH yêu cầu sửa", status: "REVISION_REQUESTED", color: "bg-yellow-500 hover:bg-yellow-600" },
    { label: "KH từ chối", status: "REJECTED", color: "bg-red-500 hover:bg-red-600" },
    { label: "Hết hạn", status: "EXPIRED", color: "bg-orange-500 hover:bg-orange-600" },
  ],
  REVISION_REQUESTED: [
    { label: "Sửa lại báo giá", status: "DRAFT", color: "bg-gray-500 hover:bg-gray-600" },
  ],
};
