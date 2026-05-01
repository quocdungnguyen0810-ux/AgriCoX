/**
 * Mini audit for quote-calculation.ts
 * Run: npx tsx scripts/test-quote-calc.ts
 */

import { calculateQuote, validateQuoteInput, sanitizeQuoteItemInput, formatVND } from "../src/lib/quote-calculation";

let passed = 0;
let failed = 0;

function assert(testName: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}${details ? ` — ${details}` : ""}`);
    failed++;
  }
}

// ══════════════════════════════════════
// TEST 1: Normal case
// ══════════════════════════════════════
console.log("\n═══ TEST 1: Normal case ═══");
const r1 = calculateQuote({
  items: [
    { quantity: 100, unitPrice: 45000, discountRate: 0.05 },
    { quantity: 200, unitPrice: 32000, discountRate: 0 },
  ],
  discountAmount: 500000,
  vatRate: 0.08,
  shippingFee: 2000000,
});
// Item 1: round(100 * 45000 * 0.95) = 4275000
// Item 2: round(200 * 32000 * 1.0)  = 6400000
// Subtotal: 10675000
// Discount: 500000
// Taxable:  10175000
// VAT:      round(10175000 * 0.08) = 814000
// Ship:     2000000
// Total:    10175000 + 814000 + 2000000 = 12989000
assert("Item 1 total", r1.itemTotals[0] === 4275000, `got ${r1.itemTotals[0]}`);
assert("Item 2 total", r1.itemTotals[1] === 6400000, `got ${r1.itemTotals[1]}`);
assert("Subtotal", r1.subtotal === 10675000, `got ${r1.subtotal}`);
assert("Discount", r1.discountAmount === 500000, `got ${r1.discountAmount}`);
assert("VAT", r1.vatAmount === 814000, `got ${r1.vatAmount}`);
assert("Shipping", r1.shippingFee === 2000000, `got ${r1.shippingFee}`);
assert("Total", r1.totalAmount === 12989000, `got ${r1.totalAmount}`);
assert("All values are integers", r1.itemTotals.every(v => Number.isInteger(v)) && Number.isInteger(r1.subtotal) && Number.isInteger(r1.vatAmount) && Number.isInteger(r1.totalAmount));

// ══════════════════════════════════════
// TEST 2: Discount > subtotal
// ══════════════════════════════════════
console.log("\n═══ TEST 2: Discount > subtotal ═══");
const r2 = calculateQuote({
  items: [{ quantity: 1, unitPrice: 100000, discountRate: 0 }],
  discountAmount: 999999999, // way more than subtotal
  vatRate: 0.08,
  shippingFee: 0,
});
assert("Discount clamped to subtotal", r2.discountAmount === 100000, `got ${r2.discountAmount}`);
assert("Taxable = 0", (r2.subtotal - r2.discountAmount) === 0, `taxable = ${r2.subtotal - r2.discountAmount}`);
assert("VAT = 0 when taxable = 0", r2.vatAmount === 0, `got ${r2.vatAmount}`);
assert("Total = 0", r2.totalAmount === 0, `got ${r2.totalAmount}`);

// ══════════════════════════════════════
// TEST 3: VAT rounding
// ══════════════════════════════════════
console.log("\n═══ TEST 3: VAT rounding ═══");
// 333333 * 0.08 = 26666.64 → should round to 26667
const r3 = calculateQuote({
  items: [{ quantity: 1, unitPrice: 333333, discountRate: 0 }],
  discountAmount: 0,
  vatRate: 0.08,
  shippingFee: 0,
});
assert("VAT rounded correctly", r3.vatAmount === 26667, `expected 26667, got ${r3.vatAmount}`);
assert("VAT is integer", Number.isInteger(r3.vatAmount));
assert("Total is integer", Number.isInteger(r3.totalAmount));

// Another rounding case: 123456 * 0.1 = 12345.6 → 12346
const r3b = calculateQuote({
  items: [{ quantity: 1, unitPrice: 123456, discountRate: 0 }],
  discountAmount: 0,
  vatRate: 0.1,
  shippingFee: 0,
});
assert("VAT 10% rounded", r3b.vatAmount === 12346, `expected 12346, got ${r3b.vatAmount}`);

// ══════════════════════════════════════
// TEST 4: quantity = 0
// ══════════════════════════════════════
console.log("\n═══ TEST 4: quantity = 0 ═══");
const v4 = validateQuoteInput({
  items: [{ quantity: 0, unitPrice: 50000, discountRate: 0 }],
  discountAmount: 0,
  vatRate: 0.08,
  shippingFee: 0,
});
assert("Validation rejects qty=0", v4 !== null, `got null (should be error)`);
assert("Error message mentions quantity", v4?.includes("số lượng") === true, `msg: ${v4}`);

// Sanitize should fix it
const s4 = sanitizeQuoteItemInput({ quantity: 0, unitPrice: 50000, discountRate: 0 });
assert("Sanitize clamps qty=0 to 1", s4.quantity === 1, `got ${s4.quantity}`);

// ══════════════════════════════════════
// TEST 5: Negative values
// ══════════════════════════════════════
console.log("\n═══ TEST 5: Negative values ═══");
// Validation
const v5a = validateQuoteInput({
  items: [{ quantity: 1, unitPrice: -5000, discountRate: 0 }],
  discountAmount: 0, vatRate: 0.08, shippingFee: 0,
});
assert("Validation rejects negative unitPrice", v5a !== null);

const v5b = validateQuoteInput({
  items: [{ quantity: 1, unitPrice: 5000, discountRate: -0.5 }],
  discountAmount: 0, vatRate: 0.08, shippingFee: 0,
});
assert("Validation rejects negative discountRate", v5b !== null);

const v5c = validateQuoteInput({
  items: [{ quantity: 1, unitPrice: 5000, discountRate: 0 }],
  discountAmount: -100, vatRate: 0.08, shippingFee: 0,
});
assert("Validation rejects negative discountAmount", v5c !== null);

// Sanitize
const s5 = sanitizeQuoteItemInput({ quantity: -10, unitPrice: -500, discountRate: -0.3 });
assert("Sanitize: qty clamped to 1", s5.quantity === 1, `got ${s5.quantity}`);
assert("Sanitize: unitPrice clamped to 0", s5.unitPrice === 0, `got ${s5.unitPrice}`);
assert("Sanitize: discountRate clamped to 0", s5.discountRate === 0, `got ${s5.discountRate}`);

// calculateQuote also clamps internally
const r5 = calculateQuote({
  items: [{ quantity: 10, unitPrice: 50000, discountRate: 0 }],
  discountAmount: -999, // negative
  vatRate: 0.08,
  shippingFee: -5000, // negative
});
assert("Calc: negative discount clamped to 0", r5.discountAmount === 0, `got ${r5.discountAmount}`);
assert("Calc: negative shipping clamped to 0", r5.shippingFee === 0, `got ${r5.shippingFee}`);

// ══════════════════════════════════════
// TEST 6: High values
// ══════════════════════════════════════
console.log("\n═══ TEST 6: High values (10 billion VND) ═══");
const r6 = calculateQuote({
  items: [
    { quantity: 10000, unitPrice: 500000, discountRate: 0 },  // 5,000,000,000
    { quantity: 10000, unitPrice: 500000, discountRate: 0 },  // 5,000,000,000
  ],
  discountAmount: 1000000000, // 1 billion
  vatRate: 0.08,
  shippingFee: 50000000, // 50 million
});
// Subtotal: 10,000,000,000
// Discount: 1,000,000,000
// Taxable:  9,000,000,000
// VAT:      720,000,000
// Ship:     50,000,000
// Total:    9,770,000,000
assert("High subtotal", r6.subtotal === 10000000000, `got ${r6.subtotal}`);
assert("High discount", r6.discountAmount === 1000000000, `got ${r6.discountAmount}`);
assert("High VAT", r6.vatAmount === 720000000, `got ${r6.vatAmount}`);
assert("High total", r6.totalAmount === 9770000000, `got ${r6.totalAmount}`);
assert("High values are integers", Number.isInteger(r6.totalAmount));
assert("Format high VND", formatVND(r6.totalAmount) === "9.770.000.000", `got "${formatVND(r6.totalAmount)}"`);

// ══════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════
console.log("\n══════════════════════════════════════");
console.log(`  TOTAL: ${passed + failed} tests`);
console.log(`  ✅ PASSED: ${passed}`);
console.log(`  ❌ FAILED: ${failed}`);
console.log(`  RESULT: ${failed === 0 ? "ALL PASS ✅" : "HAS FAILURES ❌"}`);
console.log("══════════════════════════════════════\n");

process.exit(failed > 0 ? 1 : 0);
