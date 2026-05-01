/**
 * Mini audit for quote-status.ts
 * Run: npx tsx scripts/test-quote-status.ts
 */

import {
  QUOTE_STATUSES,
  validateQuoteTransition,
  isTerminalStatus,
  quoteStatusLabels,
  quoteStatusColors,
  quoteStatusTransitions,
} from "../src/lib/quote-status";

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
// TEST 1: All 7 statuses defined
// ══════════════════════════════════════
console.log("\n═══ TEST 1: Status constants ═══");
const expected = ["DRAFT", "SENT", "REVISION_REQUESTED", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"];
for (const s of expected) {
  assert(`${s} defined`, s in QUOTE_STATUSES, `missing from QUOTE_STATUSES`);
  assert(`${s} has label`, s in quoteStatusLabels, `missing label`);
  assert(`${s} has color`, s in quoteStatusColors, `missing color`);
}

// ══════════════════════════════════════
// TEST 2: Allowed transitions
// ══════════════════════════════════════
console.log("\n═══ TEST 2: Allowed transitions ═══");
const allowedCases: [string, string][] = [
  ["DRAFT", "SENT"],
  ["SENT", "ACCEPTED"],
  ["SENT", "REJECTED"],
  ["SENT", "REVISION_REQUESTED"],
  ["SENT", "EXPIRED"],
  ["REVISION_REQUESTED", "DRAFT"],
  ["ACCEPTED", "CONVERTED"],
];
for (const [from, to] of allowedCases) {
  const r = validateQuoteTransition(from, to);
  assert(`${from} → ${to} allowed`, r.valid === true, `got valid=${r.valid}`);
}

// ══════════════════════════════════════
// TEST 3: Forbidden transitions
// ══════════════════════════════════════
console.log("\n═══ TEST 3: Forbidden transitions ═══");
const forbiddenCases: [string, string][] = [
  ["DRAFT", "ACCEPTED"],       // can't skip SENT
  ["DRAFT", "CONVERTED"],      // can't skip everything
  ["SENT", "DRAFT"],           // can't un-send (must go through REVISION_REQUESTED)
  ["ACCEPTED", "DRAFT"],       // can't revert accepted
  ["ACCEPTED", "REJECTED"],    // can't reject after accepting
  ["REJECTED", "DRAFT"],       // terminal
  ["REJECTED", "SENT"],        // terminal
  ["EXPIRED", "DRAFT"],        // terminal
  ["EXPIRED", "SENT"],         // terminal
  ["CONVERTED", "DRAFT"],      // terminal
  ["CONVERTED", "ACCEPTED"],   // terminal
];
for (const [from, to] of forbiddenCases) {
  const r = validateQuoteTransition(from, to);
  assert(`${from} → ${to} blocked`, r.valid === false, `should be blocked but got valid=true`);
}

// ══════════════════════════════════════
// TEST 4: Same-status transition blocked
// ══════════════════════════════════════
console.log("\n═══ TEST 4: Same-status blocked ═══");
for (const s of expected) {
  const r = validateQuoteTransition(s, s);
  assert(`${s} → ${s} blocked`, r.valid === false);
}

// ══════════════════════════════════════
// TEST 5: Terminal statuses
// ══════════════════════════════════════
console.log("\n═══ TEST 5: Terminal statuses ═══");
assert("REJECTED is terminal", isTerminalStatus("REJECTED"));
assert("EXPIRED is terminal", isTerminalStatus("EXPIRED"));
assert("CONVERTED is terminal", isTerminalStatus("CONVERTED"));
assert("DRAFT is NOT terminal", !isTerminalStatus("DRAFT"));
assert("SENT is NOT terminal", !isTerminalStatus("SENT"));
assert("REVISION_REQUESTED is NOT terminal", !isTerminalStatus("REVISION_REQUESTED"));
assert("ACCEPTED is NOT terminal", !isTerminalStatus("ACCEPTED"));

// ══════════════════════════════════════
// TEST 6: UI buttons match allowed transitions
// ══════════════════════════════════════
console.log("\n═══ TEST 6: UI buttons consistency ═══");
const uiStatuses = Object.keys(quoteStatusTransitions);
for (const fromStatus of uiStatuses) {
  const buttons = quoteStatusTransitions[fromStatus];
  for (const btn of buttons) {
    const r = validateQuoteTransition(fromStatus, btn.status);
    assert(`UI button "${btn.label}" (${fromStatus}→${btn.status}) is valid transition`, r.valid === true);
  }
}
// Check that terminal statuses have no buttons
for (const terminal of ["REJECTED", "EXPIRED", "CONVERTED"]) {
  const buttons = quoteStatusTransitions[terminal];
  assert(`${terminal} has no UI buttons`, !buttons || buttons.length === 0);
}

// ══════════════════════════════════════
// TEST 7: Error messages are Vietnamese
// ══════════════════════════════════════
console.log("\n═══ TEST 7: Error messages ═══");
const r7a = validateQuoteTransition("DRAFT", "DRAFT");
assert("Same-status error is Vietnamese", !r7a.valid && r7a.reason.includes("không thay đổi"));

const r7b = validateQuoteTransition("REJECTED", "DRAFT");
assert("Terminal error is Vietnamese", !r7b.valid && r7b.reason.includes("không cho phép"));

const r7c = validateQuoteTransition("DRAFT", "ACCEPTED");
assert("Invalid target error is Vietnamese", !r7c.valid && r7c.reason.includes("Không thể chuyển"));

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
