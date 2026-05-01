/**
 * Document Formatter Utilities
 * ────────────────────────────
 * Pure functions for formatting dates, currency, percentages,
 * filenames, and text for use in document templates.
 *
 * All functions are null-safe and never throw.
 * Phase 6A.3 — no external dependencies.
 */

// ═══════════════════════════════════════════════════════
// DATE FORMATTING
// ═══════════════════════════════════════════════════════

/**
 * Format a date as dd/mm/yyyy.
 *
 * @param date  Date, ISO string, or nullish
 * @param locale  Intl locale (default "vi-VN")
 * @returns  Formatted date string or "—" for invalid input
 *
 * @example
 *   formatDocumentDate(new Date("2026-04-27")) → "27/04/2026"
 *   formatDocumentDate("2026-04-27")           → "27/04/2026"
 *   formatDocumentDate(null)                   → "—"
 */
export function formatDocumentDate(
  date: Date | string | null | undefined,
  locale: string = "vi-VN"
): string {
  if (date == null) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Format a date as dd/mm/yyyy HH:mm.
 *
 * @param date  Date, ISO string, or nullish
 * @param locale  Intl locale (default "vi-VN")
 * @returns  Formatted datetime string or "—" for invalid input
 *
 * @example
 *   formatDocumentDateTime(new Date("2026-04-27T14:30:00")) → "27/04/2026 14:30"
 */
export function formatDocumentDateTime(
  date: Date | string | null | undefined,
  locale: string = "vi-VN"
): string {
  if (date == null) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

// ═══════════════════════════════════════════════════════
// CURRENCY FORMATTING
// ═══════════════════════════════════════════════════════

/**
 * Format a monetary amount for document display.
 *
 * VND: no decimals, dot-separated thousands, "₫" suffix.
 * USD/EUR: standard Intl formatting.
 *
 * @param amount    Numeric value or nullish
 * @param currency  Currency code (default "VND")
 * @returns  Formatted currency string, e.g. "12.736.800 ₫"
 *
 * @example
 *   formatDocumentCurrency(12736800)       → "12.736.800 ₫"
 *   formatDocumentCurrency(0)              → "0 ₫"
 *   formatDocumentCurrency(null)           → "0 ₫"
 *   formatDocumentCurrency(150.5, "USD")   → "$150.50"
 */
export function formatDocumentCurrency(
  amount: number | null | undefined,
  currency: string = "VND"
): string {
  const safe = typeof amount === "number" && !isNaN(amount) ? amount : 0;

  if (currency === "VND") {
    const formatted = new Intl.NumberFormat("vi-VN").format(Math.round(safe));
    return `${formatted} ₫`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(safe);
  } catch {
    return `${safe} ${currency}`;
  }
}

// ═══════════════════════════════════════════════════════
// PERCENTAGE FORMATTING
// ═══════════════════════════════════════════════════════

/**
 * Format a value as a percentage string.
 *
 * Accepts both decimal ratios (0.08 → "8%") and direct values (8 → "8%").
 * Heuristic: values ≤ 1 and > 0 are treated as ratios; others as direct %.
 *
 * @param value  Numeric ratio or percentage
 * @returns  Formatted percentage string
 *
 * @example
 *   formatDocumentPercent(0.08) → "8%"
 *   formatDocumentPercent(8)    → "8%"
 *   formatDocumentPercent(0)    → "0%"
 *   formatDocumentPercent(null) → "0%"
 */
export function formatDocumentPercent(
  value: number | null | undefined
): string {
  if (value == null || typeof value !== "number" || isNaN(value)) return "0%";

  // Heuristic: if value is between 0 (exclusive) and 1 (inclusive),
  // treat as a ratio and multiply by 100.
  const pct = value > 0 && value <= 1 ? value * 100 : value;

  // Avoid floating point artifacts: round to max 2 decimals
  const rounded = Math.round(pct * 100) / 100;

  // Display without unnecessary decimal places
  const display = Number.isInteger(rounded)
    ? rounded.toString()
    : rounded.toFixed(2).replace(/\.?0+$/, "");

  return `${display}%`;
}

// ═══════════════════════════════════════════════════════
// FILENAME SANITIZATION
// ═══════════════════════════════════════════════════════

/**
 * Vietnamese accent removal map.
 * Maps accented characters to their base ASCII equivalent.
 */
const VIETNAMESE_ACCENT_MAP: Record<string, string> = {
  à: "a", á: "a", ả: "a", ã: "a", ạ: "a",
  ă: "a", ằ: "a", ắ: "a", ẳ: "a", ẵ: "a", ặ: "a",
  â: "a", ầ: "a", ấ: "a", ẩ: "a", ẫ: "a", ậ: "a",
  è: "e", é: "e", ẻ: "e", ẽ: "e", ẹ: "e",
  ê: "e", ề: "e", ế: "e", ể: "e", ễ: "e", ệ: "e",
  ì: "i", í: "i", ỉ: "i", ĩ: "i", ị: "i",
  ò: "o", ó: "o", ỏ: "o", õ: "o", ọ: "o",
  ô: "o", ồ: "o", ố: "o", ổ: "o", ỗ: "o", ộ: "o",
  ơ: "o", ờ: "o", ớ: "o", ở: "o", ỡ: "o", ợ: "o",
  ù: "u", ú: "u", ủ: "u", ũ: "u", ụ: "u",
  ư: "u", ừ: "u", ứ: "u", ử: "u", ữ: "u", ự: "u",
  ỳ: "y", ý: "y", ỷ: "y", ỹ: "y", ỵ: "y",
  đ: "d",
  // Uppercase equivalents
  À: "a", Á: "a", Ả: "a", Ã: "a", Ạ: "a",
  Ă: "a", Ằ: "a", Ắ: "a", Ẳ: "a", Ẵ: "a", Ặ: "a",
  Â: "a", Ầ: "a", Ấ: "a", Ẩ: "a", Ẫ: "a", Ậ: "a",
  È: "e", É: "e", Ẻ: "e", Ẽ: "e", Ẹ: "e",
  Ê: "e", Ề: "e", Ế: "e", Ể: "e", Ễ: "e", Ệ: "e",
  Ì: "i", Í: "i", Ỉ: "i", Ĩ: "i", Ị: "i",
  Ò: "o", Ó: "o", Ỏ: "o", Õ: "o", Ọ: "o",
  Ô: "o", Ồ: "o", Ố: "o", Ổ: "o", Ỗ: "o", Ộ: "o",
  Ơ: "o", Ờ: "o", Ớ: "o", Ở: "o", Ỡ: "o", Ợ: "o",
  Ù: "u", Ú: "u", Ủ: "u", Ũ: "u", Ụ: "u",
  Ư: "u", Ừ: "u", Ứ: "u", Ử: "u", Ữ: "u", Ự: "u",
  Ỳ: "y", Ý: "y", Ỷ: "y", Ỹ: "y", Ỵ: "y",
  Đ: "d",
};

/**
 * Remove Vietnamese accents from a string.
 */
function removeVietnameseAccents(input: string): string {
  return input
    .split("")
    .map((ch) => VIETNAMESE_ACCENT_MAP[ch] ?? ch)
    .join("");
}

/**
 * Sanitize a string into a safe, URL/filesystem-friendly filename.
 *
 * @param input  Raw filename or label
 * @returns  Sanitized lowercase hyphen-separated string
 *
 * @example
 *   sanitizeFileName("GP-QT-2026-0001 Báo giá_v1.pdf")
 *     → "gp-qt-2026-0001-bao-gia-v1-pdf"
 *   sanitizeFileName("  ")
 *     → "document"
 */
export function sanitizeFileName(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "document";

  const result = removeVietnameseAccents(input.trim())
    .toLowerCase()
    .replace(/[_ ]+/g, "-")       // spaces and underscores → hyphens
    .replace(/[^a-z0-9.-]/g, "-") // remove unsafe chars (keep dots for extensions)
    .replace(/-+/g, "-")          // collapse repeated hyphens
    .replace(/^-|-$/g, "");       // trim leading/trailing hyphens

  return result || "document";
}

// ═══════════════════════════════════════════════════════
// TEXT HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Return a safe, trimmed text value for document display.
 *
 * @param input     Raw text or nullish
 * @param fallback  Fallback value (default "—")
 * @returns  Trimmed string or fallback
 *
 * @example
 *   safeDocumentText("  Hello  ") → "Hello"
 *   safeDocumentText(null)        → "—"
 *   safeDocumentText("", "N/A")   → "N/A"
 */
export function safeDocumentText(
  input: string | null | undefined,
  fallback: string = "—"
): string {
  if (input == null) return fallback;
  const trimmed = input.trim();
  return trimmed || fallback;
}

/**
 * Format a document/record code for display.
 *
 * @param code  Raw code string or nullish
 * @returns  Uppercase trimmed code, or "N/A"
 *
 * @example
 *   formatDocumentCode("gp-qt-2026-0001") → "GP-QT-2026-0001"
 *   formatDocumentCode(null)              → "N/A"
 */
export function formatDocumentCode(
  code: string | null | undefined
): string {
  if (!code || typeof code !== "string") return "N/A";
  const trimmed = code.trim();
  return trimmed ? trimmed.toUpperCase() : "N/A";
}

// ═══════════════════════════════════════════════════════
// QUANTITY FORMATTING
// ═══════════════════════════════════════════════════════

/**
 * Format a quantity for document display.
 *
 * Whole numbers display as integers; fractional numbers show up to 2 decimals.
 *
 * @param quantity  Numeric value or nullish
 * @returns  Formatted quantity string
 *
 * @example
 *   formatQuantity(100)    → "100"
 *   formatQuantity(10.5)   → "10.5"
 *   formatQuantity(10.123) → "10.12"
 *   formatQuantity(null)   → "0"
 */
export function formatQuantity(
  quantity: number | null | undefined
): string {
  if (quantity == null || typeof quantity !== "number" || isNaN(quantity)) {
    return "0";
  }

  if (Number.isInteger(quantity)) {
    return quantity.toString();
  }

  // Round to 2 decimals and strip trailing zeros
  return parseFloat(quantity.toFixed(2)).toString();
}
