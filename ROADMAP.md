# AgriCoX Platform Roadmap & TODO

> Last updated: 2026-04-26
> Phase 4 (Quote Management) — COMPLETED ✅
> Phase 5A planning — IN PROGRESS 🔄

---

## Phase 4 — Quote Management (DONE ✅)

### Completed
- [x] 4.1 Quote Calculation Utility (`src/lib/quote-calculation.ts`)
  - Pure VND rounding, per-item totals, VAT, shipping, clamped discount
  - 65/65 unit tests passing
- [x] 4.2 Quote Status System (`src/lib/quote-status.ts`)
  - Whitelist-based transition map
  - `validateQuoteTransition()` — returns structured error on invalid moves
  - `isTerminalStatus()` — guards REJECTED, EXPIRED, CONVERTED
  - 65/65 tests passing
- [x] 4.3 Quote Server Actions (`src/app/admin/actions.ts`)
  - `createQuoteFromRfq` — Prisma $transaction, idempotent, GP-QT-YYYY-NNNN codes
  - `updateQuoteItems` — sanitizes, recalculates via calculateQuote()
  - `updateQuoteDetails` — sanitizes VAT/shipping/discount, recalculates
  - `updateQuoteStatus` — validates transition, pre-send pricing check, version bump
  - `ActionResult<T>` + `QuoteError` pattern (no thrown errors across serialization boundary)
- [x] 4.4 Quote UI Integration
  - `/admin/quotes` — two-tab layout: Yêu cầu báo giá + Báo giá
  - `/admin/quotes/[id]` — QuoteEditor with live preview, per-item note, read-only terminal state
  - Inline error handling (no alert() popups)
  - RFQ sync on status transitions (SENT→QUOTED, ACCEPTED→ACCEPTED, REJECTED→REJECTED)

---

## Phase 5 — Order Conversion & Contract Management

### Phase 5A: Quote → Order Conversion *(NEXT — Implementation Ready)*

**Purpose:**
Convert an ACCEPTED Quote into a formal Order, replacing the old `RFQ → Order` shortcut
as the professional commercial workflow. The legacy `convertRfqToOrder` action is kept but
marked as legacy and will not be expanded.

**Status flow:**
```
Quote: ACCEPTED → [Sales clicks "Tạo đơn hàng"] → Quote: CONVERTED
                                                 → Order: NEW (paymentStatus: PENDING, fulfillmentStatus: NOT_STARTED)
                                                 → OrderStatusLog created
```

**Tasks:**
- [ ] 5A.1 Add `createOrderFromQuote(quoteId, createdBy)` server action
  - Wrapped in `$transaction` for atomicity
  - Block if Quote is not ACCEPTED
  - Block if Order already linked to this Quote (idempotency via quoteId unique check)
  - Generate order code: `GP-ORD-YYYY-0001` (inside transaction)
  - Copy all financial fields from Quote → Order
  - Copy QuoteItems → OrderItems (full snapshot)
  - Create first OrderStatusLog: `null → NEW`, note = "Tạo từ báo giá {quoteCode}"
  - Update Quote.status = CONVERTED
  - Sync RFQ.status = CONVERTED if linked
  - Add TODO placeholders for: PDF, Drive, Contract, Sheet
- [ ] 5A.2 Remove the explicit CONVERTED block in `updateQuoteStatus` — conversion is now via dedicated action
- [ ] 5A.3 Add Order status constants + label file (`src/lib/order-status.ts`)
  - Statuses: `NEW → CONFIRMED → PRODUCING → QUALITY_CHECK → PACKING → SHIPPED → DELIVERED → COMPLETED`
  - Terminal: `CANCELLED`
  - paymentStatus: `PENDING → PARTIAL → PAID`
  - fulfillmentStatus: `NOT_STARTED → IN_PROGRESS → COMPLETED`
- [ ] 5A.4 UI: Add "Tạo đơn hàng" button on QuoteEditor when status = ACCEPTED
  - Button calls `createOrderFromQuote`
  - On success: show order code + link to `/admin/orders/[id]`
  - On failure: inline error (no alert())
- [ ] 5A.5 Create Order detail page `/admin/orders/[id]`
  - Display: order code, customer, items with pricing, totals, status timeline
  - Link back to source Quote and RFQ
- [ ] 5A.6 Update `/admin/orders` list page
  - Add filter by NEW, CONFIRMED, etc.
  - Show quoteId link when order was converted from Quote
- [ ] 5A.7 Mark `convertRfqToOrder` as `@legacy` in comments — do not expand

**Database changes needed (Phase 5A):**
- Add `fulfillmentStatus` field to `Order` model → `NOT_STARTED | IN_PROGRESS | COMPLETED`
- Change `paymentStatus` default from `UNPAID` → `PENDING`
- Add `quoteId` unique constraint on `Order` (one Order per Quote) — currently nullable FK only
- Rename `fromStatus`/`toStatus` on `OrderStatusLog` → `oldStatus`/`newStatus` (align with design intent)
  - Note: existing `OrderStatusLog` uses `fromStatus`/`toStatus` — migration needed

**Legacy notice:**
- `convertRfqToOrder` in `actions.ts` — kept for backward compatibility, do NOT expand.
  Uses old `ORD-YYYY-NNN` code format vs new `GP-ORD-YYYY-0001`.

---

### Phase 5B: Contract Management ✅ **COMPLETE** *(Closed 2026-04-27)*

**Purpose:**
Create a Contract from a CONFIRMED Order (recommended) or ACCEPTED Quote.
Support bilingual contract content (Vietnamese + English), full status lifecycle,
and internal + customer signature workflow.

**Recommended flow (Option B):**
```
Quote: ACCEPTED → Order: NEW → Order: CONFIRMED → Contract: DRAFT → Contract: SIGNED → Order: ACTIVE
```
Option B is preferred over Option A (direct Quote → Contract) because it ensures
an Order exists as the commercial anchor before legal obligations begin.

**Contract statuses:**
`DRAFT → SENT_TO_CUSTOMER → NEGOTIATING → SIGNED_BY_CUSTOMER → SIGNED_BY_GREENPEAT → SIGNED → ACTIVE → COMPLETED → CANCELLED`

**Completed Tasks:**
- [x] 5B.2 Contract Schema — `Contract`, `ContractSignature`, `ContractDocument`, `ContractStatusLog` models
- [x] 5B.3 Contract Status System — `src/lib/contract-status.ts` with transitions, labels, badges
- [x] 5B.4 `createContractFromOrder(orderId)` — GP-CT-YYYY-0001 code, duplicate prevention
- [x] 5B.5 Contract Admin List UI — `/admin/contracts`
- [x] 5B.6 Contract Detail & Editor — `/admin/contracts/[id]`, DRAFT/NEGOTIATING editable, read-only for others
- [x] 5B.7 Contract Status Actions — transition buttons, `ContractStatusLog`, SIGNED → Order CONFIRMED
- [x] 5B.8A Signing Schema — `signingTokenHash @unique`, secure token lifecycle fields
- [x] 5B.8B Signing Token Utility — `src/lib/signing-token.ts`, SHA-256 hashing, URL builder
- [x] 5B.8C `createSigningLink` — admin action, raw token not stored, old token revoked
- [x] 5B.9 Public Signing Page — `/sign/[contractId]`, token validation, contract display
- [x] 5B.10 TYPE_NAME Signature — `submitTypedSignature`, consent, token consumed, status advance
- [x] 5B.11 Customer Rejection — `rejectContractSignature`, NEGOTIATING, token revoked

**MVP supports:**
- Contract creation from Order
- Bilingual content editing (Vietnamese + English)
- Full 9-status lifecycle with strict state machine
- Secure signing links (SHA-256 hash, no raw token stored)
- TYPE_NAME signature method with consent recording
- Customer rejection/revision workflow
- IP address and User-Agent recording
- Complete status audit trail via ContractStatusLog

**Deferred to future phases:**
- [ ] Draw signature canvas *(Phase 5B.12)*
- [ ] Upload signature image *(Phase 5B.12)*
- [ ] PDF generation *(Phase 6A)*
- [ ] Google Drive storage *(Phase 6B)*
- [ ] Google Sheet tracking *(Phase 6C)*
- [ ] Email notifications *(Phase 7)*
- [ ] Authenticated `changedBy` for GreenPeat signer *(Phase 7)*
- [ ] Certified e-signature provider integration *(if needed)*

**Key files:**
- `src/lib/contract-status.ts` — status machine, transitions, labels
- `src/lib/signing-token.ts` — token generation, hashing, URL builder
- `src/lib/signing-validation.ts` — server-side token validation
- `src/app/admin/actions.ts` — `createContractFromOrder`, `updateContractStatus`, `updateContractDetails`, `createSigningLink`
- `src/app/sign/actions.ts` — `submitTypedSignature`, `rejectContractSignature`
- `src/app/sign/[contractId]/page.tsx` — public signing page (server component)
- `src/app/sign/[contractId]/SigningForm.tsx` — TYPE_NAME form + rejection UI (client component)


---

## Phase 6 — Documents, Storage & Tracking

### Phase 6A: Document Generation & Template System *(IN PROGRESS 🔄)*

**Purpose:**
Generate professional documents (PDF, DOCX, XLSX) for all commercial records.
Admin can choose format for download. Templates are generated programmatically from DB data.

**Libraries:** `@react-pdf/renderer` (PDF) · `docx` (DOCX) · `exceljs` (XLSX)

**Documents to generate:**
- Quote: PDF, DOCX, XLSX
- Order Confirmation: PDF, DOCX, XLSX
- Contract Draft: PDF, DOCX
- Contract Signed: PDF
- Appendices: XLSX (products, specs, delivery, payment)
- Management exports: XLSX (RFQ/Quote/Order/Contract/Document logs)

**Completed:**
- [x] 6A.1 Planning audit & architecture design → `phase_6a_planning.md`
- [x] 6A.2 `GeneratedDocument` schema added + `db push` synced
- [x] 6A.3 Document type constants (`src/lib/documents/constants.ts`)

**Remaining:**
- [ ] 6A.4 Formatter utilities (currency, date, Vietnamese number-to-words, safe filename)
- [ ] 6A.5 XLSX generation (quotes, orders, contracts, appendices, logs)
- [ ] 6A.6 DOCX generation (quotes, orders, contracts)
- [ ] 6A.7 PDF generation (quotes, orders, contracts, signed contracts)
- [ ] 6A.8 Download API routes (`/api/documents/generate` + `/api/documents/[id]/download`)
- [ ] 6A.9 Admin download buttons (DocumentDownloadBar component)
- [ ] 6A.10 Validation audit

**Key files:**
- `prisma/schema.prisma` — `GeneratedDocument` model
- `src/lib/documents/constants.ts` — enums, labels, format mappings, `buildFileName()`

---


### Phase 6B: Google Drive Storage *(After 6A)*

**Purpose:**
Automatically create a structured folder hierarchy in Google Drive and store all generated
PDFs and signed documents. Database is the source of truth; Drive is the file store.

**Folder structure:**
```
GreenPeat_Documents/
  RFQ/
    2026/
      RFQ-2026-0001/
  Quotes/
    2026/
      GP-QT-2026-0001/
        quote.pdf
  Orders/
    2026/
      GP-ORD-2026-0001/
        order-confirmation.pdf
  Contracts/
    2026/
      GP-CT-2026-0001/
        contract-draft.pdf
        contract-signed.pdf
        appendix.pdf
  Payments/
    2026/
  Delivery/
    2026/
```

**Authentication:** Google OAuth2 service account (server-to-server)
**Store in DB:** `googleDriveFolderId`, `googleDriveFolderUrl` on each model

**Tasks:**
- [ ] 6B.1 Set up Google Cloud project + Drive API service account
- [ ] 6B.2 Store credentials as environment variables (never in code)
- [ ] 6B.3 `driveClient.ts` utility — authenticated Drive API wrapper
- [ ] 6B.4 `createRecordFolder(recordType, recordCode, year)` — find-or-create folder
- [ ] 6B.5 `uploadFileToDrive(folderId, fileName, buffer, mimeType)` — upload with retry
- [ ] 6B.6 Store Drive folder/file IDs in DB after successful upload
- [ ] 6B.7 Failure handling: log error, continue main workflow (Drive is non-blocking)
- [ ] 6B.8 `TODO(6C)` placeholder: update Google Sheet after upload

---

### Phase 6C: Google Sheet Document Tracking *(After 6B)*

**Purpose:**
Maintain a master Google Sheet as a live dashboard for all commercial records.
Each tab tracks one document type. Sync is best-effort — Sheet is secondary;
DB is always source of truth.

**Sheet tabs:** `RFQ_LOG` · `QUOTE_LOG` · `ORDER_LOG` · `CONTRACT_LOG` · `DOCUMENT_LOG` · `PAYMENT_LOG`

**Common columns per row:**
| Column | Description |
|---|---|
| Record Type | RFQ / QUOTE / ORDER / CONTRACT |
| Record Code | GP-QT-2026-0001 etc. |
| Customer Name | From customer record |
| Related RFQ Code | rfqCode |
| Related Quote Code | quoteCode |
| Related Order Code | orderCode |
| Related Contract Code | contractCode |
| Status | Current status |
| Total Amount | Numeric |
| Currency | VND / USD |
| Created Date | ISO date |
| Updated Date | ISO date |
| Sales Owner | Assigned user name |
| Drive Folder Link | Google Drive folder URL |
| PDF File Link | Drive file URL |
| Signed File Link | If applicable |
| Notes | Free text |

**Sync rules:**
- Create row when record is first created
- Update row on every status change
- Use Record Code as unique key to prevent duplicate rows
- On sync failure: log to `SyncLog` table, retry async — never block main workflow

**Tasks:**
- [ ] 6C.1 Set up Google Sheets API on same service account as Drive
- [ ] 6C.2 `sheetsClient.ts` utility — find-or-create sheet row by record code
- [ ] 6C.3 `syncRecordToSheet(recordType, recordCode, data)` — upsert row
- [ ] 6C.4 Add `SyncLog` model to DB for retry tracking
- [ ] 6C.5 Trigger sync after every status change action
- [ ] 6C.6 Manual re-sync endpoint for admin

---

## Phase 7 — Auth, Audit Logs & Advanced Controls *(Future)*

- [ ] 7.1 **`createdBy` from session** — Replace `""` placeholder with real `session.user.id`
  - Affects: `createQuoteFromRfq`, `createOrderFromQuote`, `createContractFromOrder`
- [ ] 7.2 **Audit log for Quote changes** — Record who changed what and when
  - Model: `QuoteAuditLog { id, quoteId, userId, field, oldValue, newValue, changedAt }`
- [ ] 7.3 **Audit log for Order changes** — Same pattern as Quote
- [ ] 7.4 **Audit log for Contract changes**
- [ ] 7.5 **Optimistic locking** — Prevent concurrent overwrites via `version` field guard
- [ ] 7.6 **Role-based action guards** — SALES/ADMIN create Orders; MANAGER can cancel
- [ ] 7.7 **Email notifications** — Quote sent, Order confirmed, Contract signed

---

## Known Cosmetic Issues (Low Priority)

- [ ] **VAT input leading zero display** — Typing `010` shows `010` until saved.
  - Server sanitizes to `10` correctly; data is never corrupted.
  - Fix: `setVatRate(parseFloat(e.target.value) || 0)` on `onChange`
  - Severity: Cosmetic only. Not blocking.

---

## Architecture Decisions (Do Not Revisit Without Discussion)

- **`calculateQuote()` is the single source of truth** — All financial totals are computed via this
  function server-side. Client preview uses the same function for consistency but is treated as advisory.
- **`ActionResult<T>` pattern** — Server Actions return structured `{ success, data | error }`.
  Never throw across the serialization boundary; QuoteError is caught internally and converted to `fail()`.
- **Status transition whitelist** — Only transitions listed in `ALLOWED_TRANSITIONS` are valid.
  UI buttons are driven by `quoteStatusTransitions` from the same file.
- **ACCEPTED → CONVERTED is blocked in `updateQuoteStatus`** — Intentionally blocked.
  Conversion is done via dedicated `createOrderFromQuote` action (Phase 5A).
- **DB is always source of truth** — Google Drive and Google Sheet are secondary stores.
  Failures in Drive/Sheets must never block the main business workflow.
- **One Order per Quote** — A unique constraint on `Order.quoteId` prevents duplicate conversion.
- **Legacy `convertRfqToOrder`** — Retained for backward compatibility only. Not to be expanded.
  Uses old `ORD-YYYY-NNN` format. New Orders from Quote use `GP-ORD-YYYY-0001`.
