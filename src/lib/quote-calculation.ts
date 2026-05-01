/**
 * Quote Calculation Utility
 * ──────────────────────────
 * Pure functions — no database, no side effects.
 * Reusable for Quote and future Order pricing.
 *
 * ROUNDING RULES (VND):
 *   1. Round per-item line total: Math.round(qty × unitPrice × (1 - discountRate))
 *   2. Subtotal = sum of rounded item totals (integer + integer = integer)
 *   3. Round VAT amount: Math.round(taxable × vatRate)
 *   4. Total = taxable + vatAmount + shippingFee (integer + integer = integer)
 *   → All stored values are whole-number integers.
 */

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface QuoteItemInput {
  quantity: number;
  unitPrice: number;
  discountRate: number; // 0.0 to 1.0 (e.g., 0.05 = 5%)
}

export interface QuoteCalculationInput {
  items: QuoteItemInput[];
  discountAmount: number;  // Quote-level discount (absolute VND, e.g., 100000)
  vatRate: number;         // e.g., 0.08 = 8%
  shippingFee: number;     // Absolute VND
}

export interface QuoteCalculationResult {
  itemTotals: number[];   // Per-item totalPrice (rounded integers)
  subtotal: number;       // Sum of all item totals
  discountAmount: number; // Quote-level discount (clamped to ≤ subtotal)
  vatAmount: number;      // VAT on (subtotal - discountAmount)
  shippingFee: number;    // Clamped to ≥ 0
  totalAmount: number;    // Final total
}

// ═══════════════════════════════════════════════════════
// INPUT VALIDATION
// ═══════════════════════════════════════════════════════

/**
 * Validate the entire calculation input BEFORE computing.
 * Returns null if valid, or an error message string if invalid.
 *
 * This catches structural problems (empty items, NaN values).
 * It does NOT clamp values — use sanitize functions for that.
 */
export function validateQuoteInput(input: QuoteCalculationInput): string | null {
  if (!input.items || input.items.length === 0) {
    return "Báo giá phải có ít nhất 1 sản phẩm";
  }
  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    if (typeof item.quantity !== "number" || isNaN(item.quantity)) {
      return `Sản phẩm #${i + 1}: số lượng không hợp lệ`;
    }
    if (typeof item.unitPrice !== "number" || isNaN(item.unitPrice)) {
      return `Sản phẩm #${i + 1}: đơn giá không hợp lệ`;
    }
    if (typeof item.discountRate !== "number" || isNaN(item.discountRate)) {
      return `Sản phẩm #${i + 1}: tỷ lệ chiết khấu không hợp lệ`;
    }
    if (item.quantity < 1) {
      return `Sản phẩm #${i + 1}: số lượng phải ≥ 1`;
    }
    if (item.unitPrice < 0) {
      return `Sản phẩm #${i + 1}: đơn giá không được âm`;
    }
    if (item.discountRate < 0 || item.discountRate > 1) {
      return `Sản phẩm #${i + 1}: chiết khấu phải từ 0% đến 100%`;
    }
  }
  if (typeof input.vatRate !== "number" || isNaN(input.vatRate) || input.vatRate < 0 || input.vatRate > 1) {
    return "Thuế VAT phải từ 0% đến 100%";
  }
  if (typeof input.discountAmount !== "number" || isNaN(input.discountAmount) || input.discountAmount < 0) {
    return "Chiết khấu tổng không được âm";
  }
  if (typeof input.shippingFee !== "number" || isNaN(input.shippingFee) || input.shippingFee < 0) {
    return "Phí vận chuyển không được âm";
  }
  return null;
}

// ═══════════════════════════════════════════════════════
// INPUT SANITIZATION (server-side, before DB storage)
// ═══════════════════════════════════════════════════════

/**
 * Sanitize a single quote item input.
 * Clamps to valid ranges and rounds monetary values to integers.
 */
export function sanitizeQuoteItemInput(item: {
  quantity: number;
  unitPrice: number;
  discountRate: number;
}): { quantity: number; unitPrice: number; discountRate: number } {
  return {
    quantity: Math.max(1, Math.round(item.quantity || 0)),
    unitPrice: Math.max(0, Math.round(item.unitPrice || 0)),
    discountRate: Math.max(0, Math.min(1, item.discountRate || 0)),
  };
}

/**
 * Sanitize quote-level financial inputs.
 * Rounds monetary values to integers, clamps rates to valid range.
 */
export function sanitizeQuoteTotalsInput(input: {
  discountAmount: number;
  shippingFee: number;
  vatRate: number;
}): { discountAmount: number; shippingFee: number; vatRate: number } {
  return {
    discountAmount: Math.max(0, Math.round(input.discountAmount || 0)),
    shippingFee: Math.max(0, Math.round(input.shippingFee || 0)),
    vatRate: Math.max(0, Math.min(1, input.vatRate || 0)),
  };
}

// ═══════════════════════════════════════════════════════
// CALCULATION (core)
// ═══════════════════════════════════════════════════════

/**
 * Calculate line-level and quote-level totals.
 *
 * Per item:   totalPrice = Math.round(quantity × unitPrice × (1 - discountRate))
 * Subtotal:   Σ itemTotals
 * VAT:        Math.round((subtotal - discountAmount) × vatRate)
 * Total:      (subtotal - discountAmount) + vatAmount + shippingFee
 *
 * All outputs are integers (safe for VND storage).
 */
export function calculateQuote(input: QuoteCalculationInput): QuoteCalculationResult {
  // Step 1: Calculate each item's line total, rounded individually
  const itemTotals = input.items.map((item) => {
    const rate = Math.max(0, Math.min(1, item.discountRate));
    return Math.round(item.quantity * item.unitPrice * (1 - rate));
  });

  // Step 2: Sum all line totals → subtotal (already integers, so sum is exact)
  const subtotal = itemTotals.reduce((sum, t) => sum + t, 0);

  // Step 3: Clamp quote-level discount (cannot exceed subtotal)
  const discountAmount = Math.max(0, Math.min(Math.round(input.discountAmount), subtotal));

  // Step 4: Taxable base
  const taxableAmount = subtotal - discountAmount;

  // Step 5: VAT, rounded
  const vatAmount = Math.round(taxableAmount * Math.max(0, Math.min(1, input.vatRate)));

  // Step 6: Shipping, clamped
  const shippingFee = Math.max(0, Math.round(input.shippingFee));

  // Step 7: Final total (sum of integers = integer)
  const totalAmount = taxableAmount + vatAmount + shippingFee;

  return {
    itemTotals,
    subtotal,
    discountAmount,
    vatAmount,
    shippingFee,
    totalAmount,
  };
}

// ═══════════════════════════════════════════════════════
// PRE-SEND VALIDATION
// ═══════════════════════════════════════════════════════

/**
 * Check if all quote items are ready to be sent to a customer.
 * Returns null if valid, or an error message if not.
 *
 * Rules:
 *   - At least 1 item
 *   - All items must have unitPrice > 0
 *   - All items must have quantity ≥ 1
 */
export function validateQuoteItemsForSend(
  items: { unitPrice: number; quantity: number }[]
): string | null {
  if (items.length === 0) {
    return "Báo giá chưa có sản phẩm nào";
  }
  const unpricedCount = items.filter((i) => i.unitPrice <= 0).length;
  if (unpricedCount > 0) {
    return `Còn ${unpricedCount} sản phẩm chưa nhập đơn giá`;
  }
  const invalidQty = items.filter((i) => i.quantity < 1).length;
  if (invalidQty > 0) {
    return `Còn ${invalidQty} sản phẩm có số lượng không hợp lệ`;
  }
  return null;
}

// ═══════════════════════════════════════════════════════
// FORMATTING
// ═══════════════════════════════════════════════════════

/**
 * Format a number as VND string (no symbol).
 * Example: 1500000 → "1.500.000"
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount));
}

/**
 * Format a number as currency with symbol.
 * VND: 1500000 → "1.500.000 ₫"
 * USD: 150.50 → "$150.50"
 */
export function formatCurrency(amount: number, currency = "VND"): string {
  if (currency === "VND") {
    return `${formatVND(amount)} ₫`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
