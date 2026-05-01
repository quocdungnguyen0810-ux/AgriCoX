/**
 * Vietnamese Number-to-Words Converter
 * ─────────────────────────────────────
 * Pure function to convert numeric amounts to Vietnamese words.
 * Designed for VND amounts on invoices, quotes, contracts.
 *
 * No external dependencies. Supports up to hundreds of billions.
 * Phase 6A.3.
 */

// ═══════════════════════════════════════════════════════
// VIETNAMESE DIGIT WORDS
// ═══════════════════════════════════════════════════════

const ONES = [
  "", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín",
];

const SCALE_UNITS = ["", "nghìn", "triệu", "tỷ"];

// ═══════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Read a three-digit group (0–999) to Vietnamese words.
 *
 * @param n           The 3-digit number (0–999)
 * @param hasLeading  Whether there is a higher-order group before this one.
 *                    Determines whether to add "không trăm" or "lẻ" prefixes.
 */
function readThreeDigits(n: number, hasLeading: boolean): string {
  if (n === 0) return "";

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const tens = Math.floor(remainder / 10);
  const ones = remainder % 10;

  const parts: string[] = [];

  // Hundreds
  if (hundreds > 0) {
    parts.push(`${ONES[hundreds]} trăm`);
  } else if (hasLeading && remainder > 0) {
    // If there's a higher group and this group has no hundreds,
    // add "không trăm" to clarify position.
    parts.push("không trăm");
  }

  // Tens
  if (tens === 0 && ones > 0) {
    // "lẻ" for single digit after hundreds: 101 → "một trăm lẻ một"
    if (hundreds > 0 || hasLeading) {
      parts.push("lẻ");
    }
  } else if (tens === 1) {
    parts.push("mười");
  } else if (tens > 1) {
    parts.push(`${ONES[tens]} mươi`);
  }

  // Ones
  if (ones > 0) {
    if (ones === 1 && tens > 1) {
      // 21 → "hai mươi mốt" (not "hai mươi một")
      parts.push("mốt");
    } else if (ones === 4 && tens > 1) {
      // 24 → "hai mươi tư" (not "hai mươi bốn")
      parts.push("tư");
    } else if (ones === 5 && tens > 0) {
      // 15 → "mười lăm", 25 → "hai mươi lăm"
      parts.push("lăm");
    } else {
      parts.push(ONES[ones]);
    }
  }

  return parts.join(" ");
}

/**
 * Split a non-negative integer into groups of three digits,
 * from least significant to most significant.
 *
 * @example splitIntoGroups(12736800) → [800, 736, 12]
 */
function splitIntoGroups(n: number): number[] {
  const groups: number[] = [];
  let remaining = n;

  if (remaining === 0) {
    groups.push(0);
    return groups;
  }

  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  return groups;
}

// ═══════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════

/**
 * Convert a number to Vietnamese words.
 *
 * @param amount  Numeric value (will be rounded to integer)
 * @returns  Vietnamese words with first letter capitalized
 *
 * @example
 *   numberToVietnameseWords(0)         → "Không"
 *   numberToVietnameseWords(1)         → "Một"
 *   numberToVietnameseWords(1000)      → "Một nghìn"
 *   numberToVietnameseWords(1500000)   → "Một triệu năm trăm nghìn"
 *   numberToVietnameseWords(12736800)  → "Mười hai triệu bảy trăm ba mươi sáu nghìn tám trăm"
 *   numberToVietnameseWords(-5000)     → "Âm năm nghìn"
 */
export function numberToVietnameseWords(amount: number | null | undefined): string {
  // Handle null/undefined/NaN
  if (amount == null || typeof amount !== "number" || isNaN(amount)) {
    return "Không";
  }

  // Handle negative
  const isNegative = amount < 0;
  const absAmount = Math.round(Math.abs(amount));

  if (absAmount === 0) return "Không";

  const groups = splitIntoGroups(absAmount);

  // Process groups from most significant to least significant
  const wordParts: string[] = [];

  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group === 0) continue;

    // hasLeading: true if there are non-zero groups before this one
    const hasLeading = wordParts.length > 0;
    const groupWords = readThreeDigits(group, hasLeading);

    if (groupWords) {
      // Handle scale units. For values > 999,999,999 (billions),
      // we handle "tỷ" recursively by cycling through scale units.
      const scaleIndex = i % 4;
      const billionMultiplier = Math.floor(i / 4);

      let scaleWord = SCALE_UNITS[scaleIndex];
      if (billionMultiplier > 0 && scaleIndex === 0) {
        // This group is at a "tỷ" boundary
        scaleWord = "tỷ";
      }

      wordParts.push(scaleWord ? `${groupWords} ${scaleWord}` : groupWords);
    }
  }

  let result = wordParts.join(" ").replace(/\s+/g, " ").trim();

  if (isNegative) {
    result = `Âm ${result}`;
  }

  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Convert a monetary amount to Vietnamese words with currency suffix.
 *
 * @param amount    Numeric value
 * @param currency  Currency label suffix (default "đồng")
 * @returns  Vietnamese words with currency, e.g. "Một triệu năm trăm nghìn đồng"
 *
 * @example
 *   amountToWordsVi(0)          → "Không đồng"
 *   amountToWordsVi(1)          → "Một đồng"
 *   amountToWordsVi(1500000)    → "Một triệu năm trăm nghìn đồng"
 *   amountToWordsVi(12736800)   → "Mười hai triệu bảy trăm ba mươi sáu nghìn tám trăm đồng"
 *   amountToWordsVi(-5000)      → "Âm năm nghìn đồng"
 */
export function amountToWordsVi(
  amount: number | null | undefined,
  currency: string = "đồng"
): string {
  const words = numberToVietnameseWords(amount);
  return `${words} ${currency}`;
}
