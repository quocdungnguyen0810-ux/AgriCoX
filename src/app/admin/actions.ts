"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sanitizeQuoteItemInput, sanitizeQuoteTotalsInput, validateQuoteItemsForSend, calculateQuote } from "@/lib/quote-calculation";
import { validateQuoteTransition } from "@/lib/quote-status";
import { validateOrderTransition } from "@/lib/order-status";
import { QuoteError, ActionResult, ok, fail } from "@/lib/quote-error";
import { canEditContract, validateContractTransition, isTerminalContractStatus, getContractStatusLabel } from "@/lib/contract-status";
import { generateSigningToken, buildSigningUrl } from "@/lib/signing-token";


export async function updateRfqStatus(rfqId: string, newStatus: string) {
  await prisma.rfq.update({ where: { id: rfqId }, data: { status: newStatus } });
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
}

export async function assignRfqToSales(rfqId: string, userId: string) {
  await prisma.rfq.update({ where: { id: rfqId }, data: { assignedTo: userId, status: "ASSIGNED" } });
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
}

export async function deleteRfq(rfqId: string) {
  await prisma.rfq.delete({ where: { id: rfqId } });
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
}

/**
 * @legacy — Direct RFQ → Order shortcut. Retained for backward compatibility.
 * Do NOT expand this function. New Orders must be created via createOrderFromQuote().
 * Code format: ORD-YYYY-NNN (old format, differs from GP-ORD-YYYY-0001)
 */
export async function convertRfqToOrder(rfqId: string, orderData: { paymentTerms?: string; deliveryTerms?: string; deliveryAddress?: string; notes?: string }) {
  try {
    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId }, include: { items: true, customer: true } });
    if (!rfq) throw new Error("RFQ not found");

    // Find or create customer
    let customerId = rfq.customerId;
    if (!customerId) {
      const customer = await prisma.customer.create({
        data: { name: rfq.contactName, companyName: rfq.companyName, phone: rfq.contactPhone, email: rfq.contactEmail, preferredLocale: rfq.preferredLocale, customerType: "DOMESTIC" },
      });
      customerId = customer.id;
    }

    // Generate order code (legacy format ORD-YYYY-NNN)
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    const last = await prisma.order.findFirst({ where: { orderCode: { startsWith: prefix } }, orderBy: { orderCode: "desc" }, select: { orderCode: true } });
    let nextNum = 1;
    if (last) { const n = parseInt(last.orderCode.replace(prefix, ""), 10); if (!isNaN(n)) nextNum = n + 1; }
    const orderCode = `${prefix}${nextNum.toString().padStart(3, "0")}`;

    const order = await prisma.order.create({
      data: {
        orderCode, customerId, assignedTo: rfq.assignedTo, locale: rfq.preferredLocale, status: "NEW",
        paymentTerms: orderData.paymentTerms, deliveryTerms: orderData.deliveryTerms,
        deliveryAddress: orderData.deliveryAddress || rfq.deliveryAddress, notes: orderData.notes || rfq.message,
        items: { create: rfq.items.map((item) => ({ productId: item.productId, productSku: item.productSku, productNameSnapshot: item.productNameSnapshot, packagingSnapshot: item.packagingSnapshot, quantity: item.quantity, unit: item.unit })) },
        statusLogs: { create: { oldStatus: null, newStatus: "NEW", note: `Converted from ${rfq.rfqCode}` } },
      },
    });

    await prisma.rfq.update({ where: { id: rfqId }, data: { status: "CONVERTED" } });
    revalidatePath("/admin/quotes");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { orderCode: order.orderCode };
  } catch (err) {
    console.error("[convertRfqToOrder legacy]", err);
    throw err;
  }
}

/**
 * Generate a sequential Contract code: GP-CT-YYYY-NNNN
 * Must be called inside a transaction.
 */
async function generateContractCode(tx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GP-CT-${year}-`;

  const lastContract = await tx.contract.findFirst({
    where: { contractCode: { startsWith: prefix } },
    orderBy: { contractCode: "desc" },
    select: { contractCode: true },
  });

  let nextNum = 1;
  if (lastContract) {
    const parts = lastContract.contractCode.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${nextNum.toString().padStart(4, "0")}`;
}

/**
 * Create a Contract DRAFT from an existing Order.
 * 
 * - Idempotent: returns existing contract if order already has one.
 * - Snapshots order totals and terms into the legal record.
 * - Wrapped in $transaction for safety.
 */
export async function createContractFromOrder(
  orderId: string,
  createdBy: string
): Promise<ActionResult<{ contractId: string; contractCode: string; existing: boolean }>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if Order exists and is eligible
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new QuoteError("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng");
      }

      if (!order.customerId) {
        throw new QuoteError("CUSTOMER_MISSING", "Đơn hàng thiếu thông tin khách hàng, không thể tạo hợp đồng");
      }

      // Allowed statuses for drafting: NEW, CONFIRMED
      const allowedStatuses = ["NEW", "CONFIRMED"];
      if (!allowedStatuses.includes(order.status)) {
        throw new QuoteError(
          "ORDER_NOT_READY_FOR_CONTRACT",
          `Đơn hàng đang ở trạng thái "${order.status}", không thể tạo bản thảo hợp đồng.`
        );
      }

      // 2. Idempotency: Return existing if already created
      const existing = await tx.contract.findUnique({
        where: { orderId },
        select: { id: true, contractCode: true },
      });

      if (existing) {
        return { contractId: existing.id, contractCode: existing.contractCode, existing: true };
      }

      // 3. Generate Code
      const contractCode = await generateContractCode(tx);

      // 4. Create Contract Record
      const contract = await tx.contract.create({
        data: {
          contractCode,
          orderId,
          rfqId: order.rfqId,
          quoteId: order.quoteId,
          customerId: order.customerId,
          locale: order.locale,
          currency: order.currency,
          totalAmount: order.totalAmount,
          paymentTerms: order.paymentTerms,
          deliveryTerms: order.deliveryTerms,
          contractDate: new Date(),
          status: "DRAFT",
          createdBy: createdBy || null,
          contentVi: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nHỢP ĐỒNG MUA BÁN HÀNG HÓA\nSố: ${contractCode}\n\n[Bản thảo đang được chuẩn bị...]`,
          contentEn: `SOCIALIST REPUBLIC OF VIETNAM\nIndependence - Freedom - Happiness\n\nSALES CONTRACT\nNo: ${contractCode}\n\n[Draft is being prepared...]`,
          statusLogs: {
            create: {
              oldStatus: null,
              newStatus: "DRAFT",
              note: `Tạo bản thảo hợp đồng từ đơn hàng ${order.orderCode}`,
              changedBy: createdBy || null,
            },
          },
        },
      });

      return { contractId: contract.id, contractCode: contract.contractCode, existing: false };
    });

    try {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath("/admin/contracts");
      revalidatePath("/admin");
    } catch (e) {
      // revalidatePath might fail in non-Next environments (e.g. scripts), ignore it.
      console.warn("revalidatePath failed (expected in standalone scripts):", e instanceof Error ? e.message : e);
    }

    return ok(result);
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[createContractFromOrder]", err);
    return fail("CONTRACT_CREATE_FAILED", "Lỗi hệ thống khi tạo bản thảo hợp đồng");
  }
}

/**
 * Update an Order's status with transition validation.
 * Uses the centralized validateOrderTransition() whitelist from order-status.ts.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  note?: string,
  userId?: string
): Promise<ActionResult<{ status: string }>> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!order) return fail("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng");

    const transition = validateOrderTransition(order.status, newStatus);
    if (!transition.valid) return fail("INVALID_TRANSITION", transition.reason);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        statusLogs: {
          create: {
            oldStatus: order.status,
            newStatus,
            note: note ?? null,
            changedBy: userId ?? null,
          },
        },
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");
    return ok({ status: newStatus });
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[updateOrderStatus]", err);
    return fail("ORDER_NOT_FOUND", "Lỗi hệ thống khi cập nhật trạng thái đơn hàng");
  }
}


// ── Code Generator Helpers ──────────────────────────────

/**
 * Generate a sequential quote code within a Prisma transaction.
 * Format: GP-QT-YYYY-0001
 * MUST receive the transaction client — never the global prisma instance.
 */
async function generateQuoteCode(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GP-QT-${year}-`;
  const last = await tx.quote.findFirst({
    where: { quoteCode: { startsWith: prefix } },
    orderBy: { quoteCode: "desc" },
    select: { quoteCode: true },
  });
  let nextNum = 1;
  if (last) {
    const n = parseInt(last.quoteCode.replace(prefix, ""), 10);
    if (!isNaN(n)) nextNum = n + 1;
  }
  return `${prefix}${nextNum.toString().padStart(4, "0")}`;
}

/**
 * Generate a sequential order code within a Prisma transaction.
 * Format: GP-ORD-YYYY-0001
 * MUST receive the transaction client — never the global prisma instance.
 */
async function generateOrderCode(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GP-ORD-${year}-`;
  const last = await tx.order.findFirst({
    where: { orderCode: { startsWith: prefix } },
    orderBy: { orderCode: "desc" },
    select: { orderCode: true },
  });
  let nextNum = 1;
  if (last) {
    const n = parseInt(last.orderCode.replace(prefix, ""), 10);
    if (!isNaN(n)) nextNum = n + 1;
  }
  return `${prefix}${nextNum.toString().padStart(4, "0")}`;
}


// ═══════════════════════════════════════════════════════
// ORDER ACTIONS
// ═══════════════════════════════════════════════════════

/**
 * Convert an ACCEPTED Quote into a new Order.
 *
 * Rules:
 * - Quote must be in ACCEPTED status.
 * - If an Order already exists for this Quote, returns it (idempotent).
 * - Generates GP-ORD-YYYY-0001 code inside transaction (prevents races).
 * - Copies all Quote financial fields and items as snapshots.
 * - Creates the first OrderStatusLog: null → NEW.
 * - Sets Quote.status = CONVERTED.
 * - Sets RFQ.status = CONVERTED if Quote is linked to an RFQ.
 *
 * Does NOT: create Contract, generate PDF, upload to Drive, sync to Sheet.
 * TODO(Phase 6A): Generate Order Confirmation PDF after order is created.
 * TODO(Phase 6B): Upload PDF to Google Drive folder for this order.
 * TODO(Phase 6C): Sync order row to Google Sheet ORDER_LOG.
 * TODO(Phase 5B): Offer to create Contract DRAFT after Order is CONFIRMED.
 */
export async function createOrderFromQuote(
  quoteId: string,
  createdBy: string
): Promise<ActionResult<{ orderId: string; orderCode: string; existing: boolean }>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Load Quote with items
      const quote = await tx.quote.findUnique({
        where: { id: quoteId },
        include: { items: true },
      });
      if (!quote) {
        throw new QuoteError("QUOTE_NOT_FOUND", "Không tìm thấy báo giá");
      }

      // 2. Guard: must be ACCEPTED
      if (quote.status !== "ACCEPTED") {
        throw new QuoteError(
          "QUOTE_NOT_ACCEPTED",
          "Chỉ có thể tạo đơn hàng từ báo giá đã được khách hàng chấp nhận"
        );
      }

      // 3. Guard: customerId must exist
      if (!quote.customerId) {
        throw new QuoteError(
          "CUSTOMER_MISSING",
          "Báo giá chưa có thông tin khách hàng, không thể tạo đơn hàng"
        );
      }

      // 4. Idempotency: return existing Order if already linked to this Quote
      const existingOrder = await tx.order.findUnique({
        where: { quoteId },
        select: { id: true, orderCode: true },
      });
      if (existingOrder) {
        return { orderId: existingOrder.id, orderCode: existingOrder.orderCode, existing: true };
      }

      // 5. Generate order code inside transaction (prevents race conditions)
      const orderCode = await generateOrderCode(tx);

      // 6. Create Order with copied fields + OrderItems snapshot
      const order = await tx.order.create({
        data: {
          orderCode,
          rfqId: quote.rfqId ?? null,
          quoteId: quote.id,
          customerId: quote.customerId,
          assignedTo: createdBy || null,
          locale: quote.locale,
          currency: quote.currency,
          status: "NEW",
          paymentStatus: "PENDING",
          fulfillmentStatus: "NOT_STARTED",
          subtotal: quote.subtotal,
          discountAmount: quote.discountAmount,
          vatAmount: quote.vatAmount,
          shippingFee: quote.shippingFee,
          totalAmount: quote.totalAmount,
          paymentTerms: quote.paymentTerms ?? null,
          deliveryTerms: quote.deliveryTerms ?? null,
          items: {
            create: quote.items.map((item) => ({
              productId: item.productId ?? null,
              productSku: item.productSku ?? null,
              productNameSnapshot: item.productNameSnapshot,
              packagingSnapshot: item.packagingSnapshot ?? null,
              quantity: item.quantity,
              unit: item.unit ?? null,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              note: item.note ?? null,
            })),
          },
          statusLogs: {
            create: {
              oldStatus: null,
              newStatus: "NEW",
              note: `Tạo từ báo giá ${quote.quoteCode}`,
              changedBy: createdBy || null,
            },
          },
        },
      });

      // 7. Mark Quote as CONVERTED
      await tx.quote.update({
        where: { id: quoteId },
        data: { status: "CONVERTED" },
      });

      // 8. Sync RFQ status to CONVERTED if linked
      if (quote.rfqId) {
        await tx.rfq.update({
          where: { id: quote.rfqId },
          data: { status: "CONVERTED" },
        });
      }

      return { orderId: order.id, orderCode: order.orderCode, existing: false };
    });

    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${quoteId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return ok(result);
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[createOrderFromQuote]", err);
    return fail("ORDER_NOT_FOUND", "Lỗi hệ thống khi tạo đơn hàng từ báo giá");
  }
}

// ═══════════════════════════════════════════════════════
// QUOTE ACTIONS (hardened)
// ═══════════════════════════════════════════════════════

/**
 * Create a Quote from an existing RFQ.
 *
 * - Wrapped in $transaction for atomicity and concurrency safety.
 * - If a DRAFT quote already exists for the RFQ, returns it (idempotent).
 * - Copies all RFQ item snapshots including note (itemNote).
 * - Sets RFQ status to QUOTING if not already in a terminal state.
 * - Returns ActionResult<{ quoteId, quoteCode, existing }>.
 */
export async function createQuoteFromRfq(
  rfqId: string,
  createdBy: string
): Promise<ActionResult<{ quoteId: string; quoteCode: string; existing: boolean }>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate RFQ exists and has items
      const rfq = await tx.rfq.findUnique({
        where: { id: rfqId },
        include: { items: true },
      });
      if (!rfq) {
        throw new QuoteError("RFQ_NOT_FOUND", "Không tìm thấy yêu cầu báo giá");
      }
      if (rfq.items.length === 0) {
        throw new QuoteError("RFQ_NO_ITEMS", "RFQ không có sản phẩm nào, không thể tạo báo giá");
      }

      // 2. Idempotency: return existing DRAFT if present
      const existingDraft = await tx.quote.findFirst({
        where: { rfqId, status: "DRAFT" },
        select: { id: true, quoteCode: true },
      });
      if (existingDraft) {
        return { quoteId: existingDraft.id, quoteCode: existingDraft.quoteCode, existing: true };
      }

      // 3. Generate code inside the transaction (prevents races)
      const quoteCode = await generateQuoteCode(tx);

      // 4. Create Quote, copying all RFQ item snapshots
      const quote = await tx.quote.create({
        data: {
          quoteCode,
          rfqId,
          customerId: rfq.customerId ?? null,
          createdBy: createdBy || null,
          locale: rfq.preferredLocale,
          currency: "VND",
          status: "DRAFT",
          version: 1,
          items: {
            create: rfq.items.map((item) => ({
              productId: item.productId ?? null,
              productSku: item.productSku ?? null,
              productNameSnapshot: item.productNameSnapshot,
              packagingSnapshot: item.packagingSnapshot ?? null,
              quantity: Math.max(1, item.quantity),
              unit: item.unit ?? null,
              note: item.itemNote ?? null, // Preserve RFQ item note
              unitPrice: 0,
              discountRate: 0,
              totalPrice: 0,
            })),
          },
        },
      });

      // 5. Update RFQ status to QUOTING (only if not in a terminal/later state)
      const rfqTerminalStatuses = ["QUOTED", "ACCEPTED", "REJECTED", "CONVERTED"];
      if (!rfqTerminalStatuses.includes(rfq.status)) {
        await tx.rfq.update({
          where: { id: rfqId },
          data: { status: "IN_PROGRESS" },
        });
      }

      return { quoteId: quote.id, quoteCode: quote.quoteCode, existing: false };
    });

    revalidatePath("/admin/quotes");
    revalidatePath("/admin");
    return ok(result);
  } catch (err) {
    if (err instanceof QuoteError) {
      return fail(err.code, err.message);
    }
    console.error("[createQuoteFromRfq]", err);
    return fail("QUOTE_NOT_FOUND", "Lỗi hệ thống khi tạo báo giá");
  }
}

// ── 2. updateQuoteItems ───────────────────────────────

/**
 * Update quote items with sanitized pricing and recalculate all totals.
 *
 * - Only editable when status is DRAFT or REVISION_REQUESTED.
 * - Sanitizes all inputs server-side before writing.
 * - Recalculates totals using calculateQuote() — single source of truth.
 */
export async function updateQuoteItems(
  quoteId: string,
  items: { id: string; unitPrice: number; discountRate: number; quantity: number; note?: string }[]
): Promise<ActionResult<{ subtotal: number; totalAmount: number }>> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { status: true, vatRate: true, discountAmount: true, shippingFee: true },
    });
    if (!quote) {
      return fail("QUOTE_NOT_FOUND", "Không tìm thấy báo giá");
    }
    if (quote.status !== "DRAFT" && quote.status !== "REVISION_REQUESTED") {
      return fail("QUOTE_NOT_EDITABLE", "Chỉ có thể chỉnh sửa báo giá ở trạng thái Bản nháp hoặc Yêu cầu sửa");
    }

    // Sanitize and update each item
    for (const item of items) {
      const safe = sanitizeQuoteItemInput(item);
      if (safe.unitPrice < 0) {
        return fail("INVALID_PRICING", "Đơn giá không được âm");
      }
      const totalPrice = Math.round(safe.quantity * safe.unitPrice * (1 - safe.discountRate));
      await prisma.quoteItem.update({
        where: { id: item.id },
        data: {
          unitPrice: safe.unitPrice,
          discountRate: safe.discountRate,
          quantity: safe.quantity,
          totalPrice,
          note: item.note ?? null,
        },
      });
    }

    // Recalculate quote totals via calculateQuote utility
    const allItems = await prisma.quoteItem.findMany({
      where: { quoteId },
      select: { quantity: true, unitPrice: true, discountRate: true },
    });

    const calc = calculateQuote({
      items: allItems.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountRate: i.discountRate,
      })),
      discountAmount: quote.discountAmount,
      vatRate: quote.vatRate,
      shippingFee: quote.shippingFee,
    });

    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        subtotal: calc.subtotal,
        discountAmount: calc.discountAmount,
        vatAmount: calc.vatAmount,
        totalAmount: calc.totalAmount,
      },
    });

    revalidatePath(`/admin/quotes/${quoteId}`);
    revalidatePath("/admin/quotes");
    return ok({ subtotal: calc.subtotal, totalAmount: calc.totalAmount });
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[updateQuoteItems]", err);
    return fail("QUOTE_NOT_FOUND", "Lỗi hệ thống khi cập nhật sản phẩm báo giá");
  }
}

// ── 3. updateQuoteDetails ─────────────────────────────

/**
 * Update quote-level details (terms, VAT, shipping, notes) and recalculate totals.
 *
 * - Only editable when status is DRAFT or REVISION_REQUESTED.
 * - Sanitizes all monetary inputs server-side.
 * - Recalculates totals using calculateQuote() — single source of truth.
 */
export async function updateQuoteDetails(
  quoteId: string,
  details: {
    vatRate?: number;
    shippingFee?: number;
    discountAmount?: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    validUntil?: string;
    commercialNotes?: string;
    technicalNotes?: string;
  }
): Promise<ActionResult<{ totalAmount: number }>> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: { select: { quantity: true, unitPrice: true, discountRate: true } } },
    });
    if (!quote) {
      return fail("QUOTE_NOT_FOUND", "Không tìm thấy báo giá");
    }
    if (quote.status !== "DRAFT" && quote.status !== "REVISION_REQUESTED") {
      return fail("QUOTE_NOT_EDITABLE", "Chỉ có thể chỉnh sửa báo giá ở trạng thái Bản nháp hoặc Yêu cầu sửa");
    }

    // Sanitize financial inputs
    const safeTotals = sanitizeQuoteTotalsInput({
      discountAmount: details.discountAmount ?? quote.discountAmount,
      shippingFee: details.shippingFee ?? quote.shippingFee,
      vatRate: details.vatRate ?? quote.vatRate,
    });

    // Recalculate via calculateQuote utility
    const calc = calculateQuote({
      items: quote.items.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountRate: i.discountRate,
      })),
      discountAmount: safeTotals.discountAmount,
      vatRate: safeTotals.vatRate,
      shippingFee: safeTotals.shippingFee,
    });

    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        vatRate: safeTotals.vatRate,
        shippingFee: safeTotals.shippingFee,
        discountAmount: calc.discountAmount,
        vatAmount: calc.vatAmount,
        subtotal: calc.subtotal,
        totalAmount: calc.totalAmount,
        paymentTerms: details.paymentTerms ?? quote.paymentTerms,
        deliveryTerms: details.deliveryTerms ?? quote.deliveryTerms,
        validUntil: details.validUntil ? new Date(details.validUntil) : quote.validUntil,
        commercialNotes: details.commercialNotes ?? quote.commercialNotes,
        technicalNotes: details.technicalNotes ?? quote.technicalNotes,
      },
    });

    revalidatePath(`/admin/quotes/${quoteId}`);
    revalidatePath("/admin/quotes");
    return ok({ totalAmount: calc.totalAmount });
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[updateQuoteDetails]", err);
    return fail("QUOTE_NOT_FOUND", "Lỗi hệ thống khi cập nhật chi tiết báo giá");
  }
}

// ── 4. updateQuoteStatus ──────────────────────────────

/**
 * Update quote status with full transition validation.
 *
 * - Validates transition via validateQuoteTransition() from quote-status.ts.
 * - Before DRAFT → SENT: validates all items have unitPrice > 0.
 * - REVISION_REQUESTED → DRAFT: increments version.
 * - ACCEPTED → CONVERTED: blocked here (future roadmap — Order phase).
 * - Syncs related RFQ status when appropriate.
 *
 * TODO (ROADMAP): When Order phase begins, implement ACCEPTED → CONVERTED
 *   which should: create an Order from the Quote, set Quote.status = CONVERTED,
 *   and link Order.quoteId. Do NOT implement here.
 */
export async function updateQuoteStatus(
  quoteId: string,
  newStatus: string
): Promise<ActionResult<{ status: string; version: number }>> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: { select: { unitPrice: true, quantity: true } } },
    });
    if (!quote) {
      return fail("QUOTE_NOT_FOUND", "Không tìm thấy báo giá");
    }

    // Block CONVERTED — use createOrderFromQuote() instead
    if (newStatus === "CONVERTED") {
      return fail(
        "INVALID_TRANSITION",
        "Để tạo đơn hàng, hãy sử dụng nút 'Tạo đơn hàng' thay vì thay đổi trạng thái trực tiếp"
      );
    }

    // Validate transition via centralized status logic
    const transition = validateQuoteTransition(quote.status, newStatus);
    if (!transition.valid) {
      return fail("INVALID_TRANSITION", transition.reason);
    }

    // Pre-send validation: all items must have price and quantity
    if (newStatus === "SENT") {
      const itemError = validateQuoteItemsForSend(quote.items);
      if (itemError) {
        return fail("QUOTE_NOT_READY", itemError);
      }
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    // Increment version on revision cycle
    if (quote.status === "REVISION_REQUESTED" && newStatus === "DRAFT") {
      updateData.version = quote.version + 1;
    }

    await prisma.quote.update({ where: { id: quoteId }, data: updateData });

    // Sync RFQ status where relevant
    if (quote.rfqId) {
      const rfqStatusMap: Record<string, string> = {
        SENT: "QUOTED",
        ACCEPTED: "ACCEPTED",
        REJECTED: "REJECTED",
      };
      if (rfqStatusMap[newStatus]) {
        await prisma.rfq.update({
          where: { id: quote.rfqId },
          data: { status: rfqStatusMap[newStatus] },
        });
      }
    }

    revalidatePath(`/admin/quotes/${quoteId}`);
    revalidatePath("/admin/quotes");
    revalidatePath("/admin");

    const finalVersion =
      quote.status === "REVISION_REQUESTED" && newStatus === "DRAFT"
        ? quote.version + 1
        : quote.version;

    return ok({ status: newStatus, version: finalVersion });
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[updateQuoteStatus]", err);
    return fail("INVALID_TRANSITION", "Lỗi hệ thống khi cập nhật trạng thái báo giá");
  }
}

// ═══════════════════════════════════════════════════════
// CONTRACT ACTIONS
// ═══════════════════════════════════════════════════════

/**
 * Update editable contract fields (terms, dates, bilingual content).
 *
 * Rules:
 * - Only DRAFT or NEGOTIATING contracts can be edited.
 * - Does not change contract status.
 * - Does not touch Order or Quote.
 * - Does not generate documents.
 *
 * TODO(Phase 5B.7): Add contract status transition action.
 * TODO(Phase 5B.8): Add signing token generation.
 * TODO(Phase 6A): Generate contract PDF after content is finalized.
 */
export async function updateContractDetails(
  contractId: string,
  details: {
    contractDate?: string | null;
    effectiveDate?: string | null;
    expiryDate?: string | null;
    paymentTerms?: string | null;
    deliveryTerms?: string | null;
    incoterm?: string | null;
    deliveryLocation?: string | null;
    contentVi?: string | null;
    contentEn?: string | null;
  }
): Promise<ActionResult<{ updatedAt: string }>> {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { status: true },
    });

    if (!contract) {
      return fail("CONTRACT_NOT_FOUND", "Không tìm thấy hợp đồng");
    }

    if (!canEditContract(contract.status)) {
      return fail(
        "CONTRACT_NOT_EDITABLE",
        `Hợp đồng ở trạng thái "${contract.status}" không cho phép chỉnh sửa. Chỉ có thể sửa khi ở trạng thái Bản nháp hoặc Đang đàm phán.`
      );
    }

    // Parse dates safely — empty string or null → null
    const parseDate = (v: string | null | undefined): Date | null => {
      if (!v || v.trim() === "") return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: {
        contractDate: parseDate(details.contractDate),
        effectiveDate: parseDate(details.effectiveDate),
        expiryDate: parseDate(details.expiryDate),
        paymentTerms: details.paymentTerms ?? null,
        deliveryTerms: details.deliveryTerms ?? null,
        incoterm: details.incoterm ?? null,
        deliveryLocation: details.deliveryLocation ?? null,
        contentVi: details.contentVi ?? null,
        contentEn: details.contentEn ?? null,
      },
      select: { updatedAt: true },
    });

    try {
      revalidatePath(`/admin/contracts/${contractId}`);
      revalidatePath("/admin/contracts");
    } catch {
      // Safe to ignore in non-Next environments
    }

    return ok({ updatedAt: updated.updatedAt.toISOString() });
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[updateContractDetails]", err);
    return fail("CONTRACT_UPDATE_FAILED", "Lỗi hệ thống khi cập nhật hợp đồng");
  }
}

/**
 * Transition a Contract's status using the approved status machine.
 *
 * - Validates via validateContractTransition() from contract-status.ts.
 * - Creates ContractStatusLog for every successful transition.
 * - Side effect: When status becomes SIGNED and linked Order is NEW,
 *   upgrades Order to CONFIRMED.
 *
 * Does NOT: create signatures, generate PDF, upload to Drive, send email.
 *
 * TODO(Phase 5B.8): Generate signing tokens and secure signing links.
 * TODO(Phase 5B.9): Create public customer signing page.
 * TODO(Phase 5B.10): Create real ContractSignature records on sign actions.
 * TODO(Phase 6A): Generate contract PDF after SENT_TO_CUSTOMER or SIGNED.
 * TODO(Phase 6B): Upload contract PDFs to Google Drive.
 * TODO(Phase 6C): Sync contract status to Google Sheet CONTRACT_LOG.
 * TODO(Phase 7): Use authenticated session user as changedBy.
 * TODO(Phase 7): Add audit log and optimistic locking for contract edits/status.
 */
export async function updateContractStatus(
  contractId: string,
  newStatus: string,
  note?: string
): Promise<ActionResult<{ status: string; oldStatus: string }>> {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { status: true, orderId: true },
    });

    if (!contract) {
      return fail("CONTRACT_NOT_FOUND", "Không tìm thấy hợp đồng");
    }

    // Block if already terminal
    if (isTerminalContractStatus(contract.status)) {
      return fail(
        "INVALID_CONTRACT_TRANSITION",
        `Hợp đồng đã ở trạng thái kết thúc "${getContractStatusLabel(contract.status)}", không thể thay đổi.`
      );
    }

    // Validate transition via centralized status machine
    const transition = validateContractTransition(contract.status, newStatus);
    if (!transition.valid) {
      return fail("INVALID_CONTRACT_TRANSITION", transition.reason);
    }

    const oldStatus = contract.status;

    // Update contract status + create log atomically
    await prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.contract.update({
        where: { id: contractId },
        data: { status: newStatus },
      });

      // 2. Create status log
      await tx.contractStatusLog.create({
        data: {
          contractId,
          oldStatus,
          newStatus,
          note: note || `Cập nhật trạng thái từ "${getContractStatusLabel(oldStatus)}" sang "${getContractStatusLabel(newStatus)}"`,
          changedBy: null, // TODO(Phase 7): populate from session.user.id
        },
      });

      // 3. Side effect: SIGNED → confirm linked Order if NEW
      if (newStatus === "SIGNED" && contract.orderId) {
        const order = await tx.order.findUnique({
          where: { id: contract.orderId },
          select: { status: true },
        });

        if (order && order.status === "NEW") {
          // NEW → CONFIRMED is a valid transition in order-status.ts
          const orderTransition = validateOrderTransition(order.status, "CONFIRMED");
          if (orderTransition.valid) {
            await tx.order.update({
              where: { id: contract.orderId },
              data: { status: "CONFIRMED" },
            });
            await tx.orderStatusLog.create({
              data: {
                orderId: contract.orderId,
                oldStatus: order.status,
                newStatus: "CONFIRMED",
                note: `Tự động xác nhận do hợp đồng đã ký đầy đủ`,
                changedBy: null,
              },
            });
          }
        }
      }
    });

    try {
      revalidatePath(`/admin/contracts/${contractId}`);
      revalidatePath("/admin/contracts");
      revalidatePath("/admin/orders");
      revalidatePath("/admin");
    } catch {
      // Safe to ignore in non-Next environments
    }

    return ok({ status: newStatus, oldStatus });
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[updateContractStatus]", err);
    return fail("CONTRACT_UPDATE_FAILED", "Lỗi hệ thống khi cập nhật trạng thái hợp đồng");
  }
}

/**
 * Generate a secure signing link for a contract signer.
 *
 * Creates a ContractSignature record with a hashed token and returns
 * the signing URL containing the raw token. The raw token is NEVER stored.
 *
 * Eligibility:
 * - CUSTOMER: contract must be SENT_TO_CUSTOMER
 * - GREENPEAT_SIGNER: contract must be SIGNED_BY_CUSTOMER
 *
 * If a pending token already exists for the same role, it is revoked
 * and a new one is generated (the old raw token cannot be recovered).
 *
 * TODO(Phase 5B.9): Public signing page consumes this signingUrl.
 * TODO(Phase 5B.10): Signature submission records tokenUsedAt and signedAt.
 * TODO(Phase 6A): Generate signed contract PDF after both parties sign.
 * TODO(Phase 6B): Upload signed PDF to Google Drive.
 * TODO(Phase 6C): Sync signing state to Google Sheet.
 * TODO(Phase 7): Replace changedBy null with authenticated user id.
 * TODO(Phase 7): Add contract content versioning.
 */
export async function createSigningLink(
  contractId: string,
  signerRole: string,
  signerName?: string,
  signerEmail?: string
): Promise<ActionResult<{ signingUrl: string; expiresAt: string; signerRole: string }>> {
  try {
    // ── 1. Validate signer role ──
    const VALID_ROLES = ["CUSTOMER", "GREENPEAT_SIGNER"] as const;
    if (!VALID_ROLES.includes(signerRole as any)) {
      return fail(
        "INVALID_SIGNER_ROLE",
        `Vai trò ký "${signerRole}" không hợp lệ. Chỉ chấp nhận: ${VALID_ROLES.join(", ")}`
      );
    }

    // ── 2. Fetch contract with customer info ──
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        status: true,
        customer: {
          select: { name: true, email: true, companyName: true },
        },
      },
    });

    if (!contract) {
      return fail("CONTRACT_NOT_FOUND", "Không tìm thấy hợp đồng");
    }

    // ── 3. Check contract eligibility by signer role ──
    const ROLE_STATUS_MAP: Record<string, string> = {
      CUSTOMER: "SENT_TO_CUSTOMER",
      GREENPEAT_SIGNER: "SIGNED_BY_CUSTOMER",
    };

    const requiredStatus = ROLE_STATUS_MAP[signerRole];
    if (contract.status !== requiredStatus) {
      const statusLabel = getContractStatusLabel(contract.status);
      const requiredLabel = getContractStatusLabel(requiredStatus);
      return fail(
        "CONTRACT_NOT_READY_FOR_SIGNING",
        `Hợp đồng đang ở trạng thái "${statusLabel}". Cần ở trạng thái "${requiredLabel}" để tạo liên kết ký cho ${signerRole === "CUSTOMER" ? "khách hàng" : "GreenPeat"}.`
      );
    }

    // ── 4. Revoke existing pending tokens for same role ──
    await prisma.contractSignature.updateMany({
      where: {
        contractId,
        signerRole,
        status: "PENDING",
        tokenUsedAt: null,
        tokenRevokedAt: null,
      },
      data: {
        tokenRevokedAt: new Date(),
        status: "EXPIRED",
      },
    });

    // ── 5. Generate secure token ──
    const { rawToken, tokenHash, expiresAt } = generateSigningToken();

    // ── 6. Resolve signer info ──
    let resolvedName = signerName || null;
    let resolvedEmail = signerEmail || null;
    let resolvedCompany: string | null = null;

    if (signerRole === "CUSTOMER") {
      resolvedName = resolvedName || contract.customer?.name || "Khách hàng";
      resolvedEmail = resolvedEmail || contract.customer?.email || null;
      resolvedCompany = contract.customer?.companyName || null;
    } else {
      resolvedName = resolvedName || "GreenPeat Representative";
    }

    // ── 7. Create ContractSignature + log atomically ──
    await prisma.$transaction(async (tx) => {
      await tx.contractSignature.create({
        data: {
          contractId,
          signerName: resolvedName!,
          signerEmail: resolvedEmail,
          signerRole,
          signerCompany: resolvedCompany,
          signingTokenHash: tokenHash,
          tokenExpiresAt: expiresAt,
          tokenUsedAt: null,
          tokenRevokedAt: null,
          signatureMethod: null,
          signatureImageUrl: null,
          signedAt: null,
          signingVersion: 1, // TODO(Phase 7): Add contract content versioning
          status: "PENDING",
        },
      });

      // Log the action (status does NOT change)
      await tx.contractStatusLog.create({
        data: {
          contractId,
          oldStatus: contract.status,
          newStatus: contract.status,
          note: `Tạo liên kết ký cho ${signerRole === "CUSTOMER" ? "khách hàng" : "GreenPeat"} (${resolvedName})`,
          changedBy: null, // TODO(Phase 7): populate from session
        },
      });
    });

    // ── 8. Build signing URL ──
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || undefined;
    const signingUrl = buildSigningUrl(contractId, rawToken, baseUrl);

    try {
      revalidatePath(`/admin/contracts/${contractId}`);
    } catch {
      // Safe to ignore in non-Next environments
    }

    return ok({
      signingUrl,
      expiresAt: expiresAt.toISOString(),
      signerRole,
    });
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[createSigningLink]", err);
    return fail("SIGNING_LINK_CREATE_FAILED", "Lỗi hệ thống khi tạo liên kết ký hợp đồng");
  }
}
