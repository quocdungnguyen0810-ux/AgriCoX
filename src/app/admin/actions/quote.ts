"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { appendQuoteRow, appendOrderRow } from "@/lib/sheets";
import { sanitizeQuoteItemInput, sanitizeQuoteTotalsInput, validateQuoteItemsForSend, calculateQuote } from "@/lib/quote-calculation";
import { validateQuoteTransition } from "@/lib/quote-status";
import { validateOrderTransition } from "@/lib/order-status";
import { QuoteError, ActionResult, ok, fail } from "@/lib/quote-error";
import { canEditContract, validateContractTransition, isTerminalContractStatus, getContractStatusLabel } from "@/lib/contract-status";
import { generateSigningToken, buildSigningUrl } from "@/lib/signing-token";
import { saveFileLocally } from "@/lib/local-storage";
import { safeUploadToDrive } from "@/lib/drive";
import { renderToStream } from "@react-pdf/renderer";
import { QuotePDFDocument } from "@/lib/pdf/QuotePDFDocument";
import React from "react";

type StandaloneCustomerInput = {
  id?: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type CustomQuoteItemInput = {
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
};

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
/**
 * Create a standalone Quote without an RFQ.
 */
export async function createStandaloneQuote(
  customerId: string,
  createdBy: string
): Promise<ActionResult<{ quoteId: string; quoteCode: string }>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const quoteCode = await generateQuoteCode(tx);
      const quote = await tx.quote.create({
        data: {
          quoteCode,
          customerId,
          createdBy,
          locale: "vi",
          currency: "VND",
          status: "DRAFT",
          version: 1,
        },
      });
      return { quoteId: quote.id, quoteCode: quote.quoteCode };
    });

    revalidatePath("/admin/quotes");
    return ok(result);
  } catch (err) {
    console.error("[createStandaloneQuote]", err);
    return fail("QUOTE_UPDATE_FAILED", "Không thể tạo báo giá độc lập");
  }
}

/**
 * Create a standalone Quote with optional new customer and initial items.
 */
export async function createStandaloneQuoteWithItems(
  customerData: StandaloneCustomerInput,
  createdBy: string,
  productIds: string[] = [],
  customItems: CustomQuoteItemInput[] = []
): Promise<ActionResult<{ quoteId: string; quoteCode: string }>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      let customerId = customerData.id;

      if (!customerId) {
        if (!customerData.name.trim()) {
          throw new QuoteError("CUSTOMER_MISSING", "Vui lòng nhập tên khách hàng");
        }

        const customer = await tx.customer.create({
          data: {
            name: customerData.name.trim(),
            companyName: customerData.companyName?.trim() || null,
            email: customerData.email?.trim() || null,
            phone: customerData.phone?.trim() || "",
            address: customerData.address?.trim() || null,
            assignedTo: createdBy || null,
          },
        });
        customerId = customer.id;
      }

      if (!customerId) {
        throw new QuoteError("CUSTOMER_MISSING", "Báo giá cần có khách hàng");
      }

      const quoteCode = await generateQuoteCode(tx);
      const products = productIds.length > 0
        ? await tx.product.findMany({
            where: { id: { in: productIds }, status: "ACTIVE" },
            include: { translations: { where: { locale: "vi" }, take: 1 } },
          })
        : [];

      const catalogItems = products.map((product) => {
        const translation = product.translations[0];
        return {
          productId: product.id,
          productSku: product.sku,
          productNameSnapshot: translation?.name || product.sku,
          packagingSnapshot: translation?.packaging || null,
          quantity: 1,
          unit: product.unit || "pcs",
          unitPrice: 0,
          discountRate: 0,
          totalPrice: 0,
        };
      });

      const freeformItems = customItems
        .filter((item) => item.name.trim())
        .map((item) => {
          const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
          const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
          return {
            productNameSnapshot: item.name.trim(),
            packagingSnapshot: null,
            quantity,
            unit: item.unit.trim() || "pcs",
            unitPrice,
            discountRate: 0,
            totalPrice: Math.round(quantity * unitPrice),
          };
        });

      const quote = await tx.quote.create({
        data: {
          quoteCode,
          customerId,
          createdBy: createdBy || null,
          locale: "vi",
          currency: "VND",
          status: "DRAFT",
          version: 1,
          items: catalogItems.length + freeformItems.length > 0
            ? { create: [...catalogItems, ...freeformItems] }
            : undefined,
        },
      });

      const calc = calculateQuote({
        items: [...catalogItems, ...freeformItems].map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountRate: item.discountRate,
        })),
        discountAmount: 0,
        vatRate: 0.08,
        shippingFee: 0,
      });

      if (calc.totalAmount > 0 || calc.subtotal > 0) {
        await tx.quote.update({
          where: { id: quote.id },
          data: {
            subtotal: calc.subtotal,
            discountAmount: calc.discountAmount,
            vatAmount: calc.vatAmount,
            totalAmount: calc.totalAmount,
          },
        });
      }

      return { quoteId: quote.id, quoteCode: quote.quoteCode };
    });

    revalidatePath("/admin/quotes");
    return ok(result);
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[createStandaloneQuoteWithItems]", err);
    return fail("QUOTE_UPDATE_FAILED", "Không thể tạo báo giá độc lập");
  }
}

async function recalculateQuoteTotals(quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: { select: { quantity: true, unitPrice: true, discountRate: true } } },
  });
  if (!quote) return;

  const calc = calculateQuote({
    items: quote.items,
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

/**
 * Add a new item to a quote.
 */
export async function addQuoteItem(
  quoteId: string,
  productId?: string,
  customItem?: { name: string; quantity: number; unitPrice: number; unit: string }
): Promise<ActionResult<{ id: string }>> {
  try {
    let itemData: {
      quoteId: string;
      productId?: string;
      productSku?: string;
      productNameSnapshot: string;
      packagingSnapshot?: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalPrice: number;
    };

    if (productId) {
      // Catalog product — fetch with translations
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          translations: { where: { locale: "vi" }, take: 1 },
        },
      });
      if (!product) return fail("PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm");

      const t = product.translations[0];
      itemData = {
        quoteId,
        productId,
        productSku: product.sku,
        productNameSnapshot: t?.name || product.sku,
        packagingSnapshot: t?.packaging || undefined,
        quantity: 1,
        unit: product.unit || "kg",
        unitPrice: 0,
        totalPrice: 0,
      };
    } else if (customItem) {
      // Custom (free-form) product
      itemData = {
        quoteId,
        productNameSnapshot: customItem.name,
        quantity: customItem.quantity,
        unit: customItem.unit,
        unitPrice: customItem.unitPrice,
        totalPrice: customItem.quantity * customItem.unitPrice,
      };
    } else {
      return fail("PRODUCT_NOT_FOUND", "Cần chọn sản phẩm từ danh mục hoặc nhập sản phẩm tự do");
    }

    const item = await prisma.quoteItem.create({ data: itemData });
    await recalculateQuoteTotals(quoteId);

    revalidatePath(`/admin/quotes/${quoteId}`);
    return ok({ id: item.id });
  } catch (err) {
    console.error("[addQuoteItem]", err);
    return fail("QUOTE_UPDATE_FAILED", "Không thể thêm sản phẩm");
  }
}

/**
 * Remove an item from a quote.
 */
export async function removeQuoteItem(
  itemId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const item = await prisma.quoteItem.findUnique({ where: { id: itemId } });
    if (!item) return fail("QUOTE_ITEM_NOT_FOUND", "Không tìm thấy sản phẩm");

    await prisma.quoteItem.delete({ where: { id: itemId } });
    await recalculateQuoteTotals(item.quoteId);

    revalidatePath(`/admin/quotes/${item.quoteId}`);
    return ok({ success: true });
  } catch (err) {
    console.error("[removeQuoteItem]", err);
    return fail("QUOTE_UPDATE_FAILED", "Không thể xóa sản phẩm");
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

    // Tự động đẩy dữ liệu sang Google Sheets Báo Giá khi gửi khách
    if (newStatus === "SENT") {
      const fullQuote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { customer: true, items: true }
      });
      if (fullQuote) {
        let pdfUrl = "";
        try {
          // 1. Tạo PDF
          const stream = await renderToStream(React.createElement(QuotePDFDocument, { quote: fullQuote as any }) as any);
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
          }
          const pdfBuffer = Buffer.concat(chunks);
          
          // 2. Lưu PDF xuống Local (public/uploads/quotes)
          const fileName = `${fullQuote.quoteCode || fullQuote.id}.pdf`;
          const saveRes = await saveFileLocally(pdfBuffer, fileName, "quotes");
          pdfUrl = saveRes.fileUrl;

          // 2b. Upload lên Google Drive
          const driveUrl = await safeUploadToDrive(pdfBuffer, fileName, "QUOTE");
          if (driveUrl) pdfUrl = driveUrl;
        } catch (pdfErr) {
          console.error("Lỗi khi sinh PDF Báo Giá:", pdfErr);
        }

        // 3. Ghi ra Google Sheets
        appendQuoteRow([
          new Date().toLocaleString("vi-VN"), // Thời gian tạo
          fullQuote.quoteCode || fullQuote.id, // Mã BG
          fullQuote.customer?.name || "Khách lẻ", // Tên khách
          fullQuote.customer?.email || "", // Email
          fullQuote.totalAmount.toString(), // Tổng tiền
          "Đã Gửi", // Trạng thái
          pdfUrl // Link PDF
        ]).catch(console.error);
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
