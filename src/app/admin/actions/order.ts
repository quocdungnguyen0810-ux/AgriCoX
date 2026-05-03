"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { appendQuoteRow, appendOrderRow, appendDocumentRow } from "@/lib/sheets";
import { sanitizeQuoteItemInput, sanitizeQuoteTotalsInput, validateQuoteItemsForSend, calculateQuote } from "@/lib/quote-calculation";
import { validateQuoteTransition } from "@/lib/quote-status";
import { validateOrderTransition } from "@/lib/order-status";
import { QuoteError, ActionResult, ok, fail } from "@/lib/quote-error";
import { canEditContract, validateContractTransition, isTerminalContractStatus, getContractStatusLabel } from "@/lib/contract-status";
import { generateSigningToken, buildSigningUrl } from "@/lib/signing-token";
import { saveFileLocally } from "@/lib/local-storage";
import { safeUploadToDrive } from "@/lib/drive";
import { renderToStream } from "@react-pdf/renderer";
import { OrderPDFDocument } from "@/lib/pdf/OrderPDFDocument";
import { createAndFinalizeDoc } from "./smart-docs";
import React from "react";
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

      return { orderId: order.id, orderCode: order.orderCode, existing: false, order, quote };
    });

    if (!result.existing) {
      // Fetch customer name for the sheet
      const customerId = result.quote?.customerId;
      const customer = customerId ? await prisma.customer.findUnique({ where: { id: customerId } }) : null;
      const fullOrder = await prisma.order.findUnique({
        where: { id: result.orderId },
        include: { items: true, customer: true }
      });

      let pdfUrl = "";
      if (fullOrder) {
        try {
          // 1. Tạo PDF
          const stream = await renderToStream(React.createElement(OrderPDFDocument, { order: fullOrder as any }) as any);
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
          }
          const pdfBuffer = Buffer.concat(chunks);
          
          // 2. Lưu PDF xuống Local
          const fileName = `${fullOrder.orderCode || fullOrder.id}.pdf`;
          const saveRes = await saveFileLocally(pdfBuffer, fileName, "orders");
          pdfUrl = saveRes.fileUrl;

          // 2b. Upload lên Google Drive
          const driveUrl = await safeUploadToDrive(pdfBuffer, fileName, "ORDER");
          if (driveUrl) pdfUrl = driveUrl;
        } catch (pdfErr) {
          console.error("Lỗi khi sinh PDF Đơn Hàng:", pdfErr);
        }
      }

      // Đồng bộ vào sheet Quản lý File
      if (pdfUrl) {
        const { appendDocumentRow } = await import("@/lib/sheets");
        appendDocumentRow([
          new Date().toISOString(),
          result.orderCode,
          "PDF Đơn hàng",
          `${fullOrder?.orderCode || result.orderCode}.pdf`,
          pdfUrl
        ]).catch(console.error);
      }

      appendOrderRow([
        new Date().toLocaleString("vi-VN"), // Thời gian tạo
        result.orderCode, // Mã đơn hàng
        result.quote?.quoteCode || "N/A", // Mã báo giá
        customer?.name || "Khách lẻ", // Tên khách
        result.order?.totalAmount?.toString() || "0", // Tổng tiền
        "MỚI", // Trạng thái
        pdfUrl // Link PDF
      ]).catch(console.error);
    }

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

/**
 * Create a standalone Order without a Quote.
 * Supports both catalog product selection and custom free-form items.
 */
export async function createStandaloneOrder(
  customerData: { id?: string; name: string; companyName?: string; email?: string; phone?: string; address?: string },
  createdBy: string,
  productIds?: string[],
  customItems?: { name: string; quantity: number; unitPrice: number; unit: string }[]
): Promise<ActionResult<{ orderId: string; orderCode: string }>> {
  try {
    let customerId = customerData.id;

    // 1. Create new customer if no ID provided
    if (!customerId) {
      const newCustomer = await prisma.customer.create({
        data: {
          name: customerData.name,
          companyName: customerData.companyName || "",
          email: customerData.email || "",
          phone: customerData.phone || "",
          address: customerData.address || "",
        }
      });
      customerId = newCustomer.id;
    }

    const result = await prisma.$transaction(async (tx) => {
      const orderCode = await generateOrderCode(tx);
      const order = await tx.order.create({
        data: {
          orderCode,
          customerId: customerId!,
          assignedTo: createdBy,
          locale: "vi",
          currency: "VND",
          status: "NEW",
          paymentStatus: "PENDING",
          fulfillmentStatus: "NOT_STARTED",
          statusLogs: {
            create: {
              oldStatus: null,
              newStatus: "NEW",
              note: "Tạo đơn hàng độc lập",
              changedBy: createdBy,
            },
          },
        },
      });

      // 2. Add initial catalog items if provided
      if (productIds && productIds.length > 0) {
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          include: {
            translations: { where: { locale: "vi" }, take: 1 },
          },
        });

        for (const p of products) {
          const t = p.translations[0];
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: p.id,
              productSku: p.sku,
              productNameSnapshot: t?.name || p.sku,
              packagingSnapshot: t?.packaging || "Đóng gói tiêu chuẩn",
              unit: p.unit,
              quantity: 1,
              unitPrice: 0,
              totalPrice: 0,
            }
          });
        }
      }

      // 3. Add custom free-form items if provided
      if (customItems && customItems.length > 0) {
        for (const ci of customItems) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productNameSnapshot: ci.name,
              unit: ci.unit,
              quantity: ci.quantity,
              unitPrice: ci.unitPrice,
              totalPrice: ci.quantity * ci.unitPrice,
            }
          });
        }
      }

      return { orderId: order.id, orderCode: order.orderCode };
    });

    // Recalculate totals after transaction
    await recalculateOrderTotals(result.orderId);

    // 4. Automatically create a linked contract
    const { createContractFromOrder } = await import("./contract");
    await createContractFromOrder(result.orderId, createdBy);

    revalidatePath("/admin/orders");
    return ok(result);
  } catch (err) {
    console.error("[createStandaloneOrder]", err);
    return fail("ORDER_UPDATE_FAILED", "Không thể tạo đơn hàng độc lập");
  }
}

/**
 * Internal helper to recalculate order totals and persist them.
 */
async function recalculateOrderTotals(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  let vatRate = 0.08;
  if (order.subtotal > order.discountAmount && order.subtotal - order.discountAmount > 0) {
    vatRate = order.vatAmount / (order.subtotal - order.discountAmount);
  }

  const calc = calculateQuote({
    items: order.items.map(i => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountRate: 0 })),
    discountAmount: order.discountAmount,
    vatRate,
    shippingFee: order.shippingFee,
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal: calc.subtotal,
      vatAmount: calc.vatAmount,
      totalAmount: calc.totalAmount,
    },
  });
}

/**
 * Add a new item to an order. Supports both catalog and custom items.
 */
export async function addOrderItem(
  orderId: string,
  productId?: string,
  customItem?: { name: string; quantity: number; unitPrice: number; unit: string }
): Promise<ActionResult<{ id: string }>> {
  try {
    let itemData: Record<string, unknown>;

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          translations: { where: { locale: "vi" }, take: 1 },
        },
      });
      if (!product) return fail("PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm");

      const t = product.translations[0];
      itemData = {
        orderId,
        productId,
        productSku: product.sku,
        productNameSnapshot: t?.name || product.sku,
        packagingSnapshot: t?.packaging || null,
        quantity: 1,
        unit: product.unit || "kg",
        unitPrice: 0,
        totalPrice: 0,
      };
    } else if (customItem) {
      itemData = {
        orderId,
        productNameSnapshot: customItem.name,
        quantity: customItem.quantity,
        unit: customItem.unit,
        unitPrice: customItem.unitPrice,
        totalPrice: customItem.quantity * customItem.unitPrice,
      };
    } else {
      return fail("PRODUCT_NOT_FOUND", "Cần chọn sản phẩm từ danh mục hoặc nhập sản phẩm tự do");
    }

    const item = await prisma.orderItem.create({ data: itemData as any });

    // Recalculate and update order totals
    await recalculateOrderTotals(orderId);

    revalidatePath(`/admin/orders/${orderId}`);
    return ok({ id: item.id });
  } catch (err) {
    console.error("[addOrderItem]", err);
    return fail("ORDER_UPDATE_FAILED", "Không thể thêm sản phẩm vào đơn hàng");
  }
}

/**
 * Remove an item from an order.
 */
export async function removeOrderItem(
  itemId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item) return fail("ORDER_NOT_FOUND", "Không tìm thấy sản phẩm");

    await prisma.orderItem.delete({ where: { id: itemId } });

    // Recalculate and update order totals
    await recalculateOrderTotals(item.orderId);

    revalidatePath(`/admin/orders/${item.orderId}`);
    return ok({ success: true });
  } catch (err) {
    console.error("[removeOrderItem]", err);
    return fail("ORDER_UPDATE_FAILED", "Không thể xóa sản phẩm khỏi đơn hàng");
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

    // Auto-generate documents based on step
    const stepDocTypeMap: Record<string, string> = {
      CONFIRMED: 'PRODUCTION_ORDER',
      QUALITY_CHECK: 'QUALITY_CERTIFICATE',
      PACKING: 'PACKING_LIST',
      SHIPPED: 'WAREHOUSE_RELEASE',
      DELIVERED: 'DELIVERY_CONFIRMATION',
    };

    const docType = stepDocTypeMap[newStatus];
    if (docType) {
      try {
        await createAndFinalizeDoc('ORDER', orderId, docType as any, {}, userId);
      } catch (autoDocErr) {
        console.error("Failed to auto-generate document:", autoDocErr);
      }
    }

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

/**
 * Update an Order's items and recalculate totals.
 */
export async function updateOrderItems(
  orderId: string,
  items: { id: string; quantity: number; unitPrice: number; note?: string }[]
): Promise<ActionResult<{ totalAmount: number }>> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return fail("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng");

    // Recalculate using provided items + existing order settings
    const calcResult = calculateQuote({
      items: items.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountRate: 0, // OrderItems in this schema don't have per-item discountRate yet, but we use totalPrice
      })),
      discountAmount: order.discountAmount,
      vatRate: order.vatAmount / (order.subtotal - order.discountAmount || 1), // Try to preserve vatRate or fallback
      shippingFee: order.shippingFee,
    });
    
    // Better: use explicit vatRate if we can store it in Order model. 
    // Currently schema has vatAmount but not vatRate. Let's assume 8% default if calculation fails.
    let vatRate = 0.08;
    if (order.subtotal > order.discountAmount) {
      vatRate = order.vatAmount / (order.subtotal - order.discountAmount);
    }

    const finalCalc = calculateQuote({
      items: items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountRate: 0 })),
      discountAmount: order.discountAmount,
      vatRate,
      shippingFee: order.shippingFee,
    });

    await prisma.$transaction(async (tx) => {
      // Update each item
      for (const item of items) {
        const idx = items.indexOf(item);
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: finalCalc.itemTotals[idx],
            note: item.note ?? null,
          },
        });
      }

      // Update Order totals
      await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: finalCalc.subtotal,
          vatAmount: finalCalc.vatAmount,
          totalAmount: finalCalc.totalAmount,
        },
      });
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return ok({ totalAmount: finalCalc.totalAmount });
  } catch (err) {
    console.error("[updateOrderItems]", err);
    return fail("ORDER_UPDATE_FAILED", "Lỗi khi cập nhật sản phẩm đơn hàng");
  }
}

/**
 * Update Order financial details (shipping, discount, etc)
 */
export async function updateOrderDetails(
  orderId: string,
  data: {
    shippingFee?: number;
    discountAmount?: number;
    vatRate?: number;
    notes?: string;
    deliveryAddress?: string;
    paymentTerms?: string;
    deliveryTerms?: string;
  }
): Promise<ActionResult<{ totalAmount: number }>> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return fail("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng");

    const currentVatRate = order.subtotal > order.discountAmount 
      ? order.vatAmount / (order.subtotal - order.discountAmount)
      : 0.08;

    const finalCalc = calculateQuote({
      items: order.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountRate: 0 })),
      discountAmount: data.discountAmount ?? order.discountAmount,
      shippingFee: data.shippingFee ?? order.shippingFee,
      vatRate: data.vatRate ?? currentVatRate,
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingFee: finalCalc.shippingFee,
        discountAmount: finalCalc.discountAmount,
        vatAmount: finalCalc.vatAmount,
        totalAmount: finalCalc.totalAmount,
        notes: data.notes !== undefined ? data.notes : order.notes,
        deliveryAddress: data.deliveryAddress !== undefined ? data.deliveryAddress : order.deliveryAddress,
        paymentTerms: data.paymentTerms !== undefined ? data.paymentTerms : order.paymentTerms,
        deliveryTerms: data.deliveryTerms !== undefined ? data.deliveryTerms : order.deliveryTerms,
      },
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return ok({ totalAmount: finalCalc.totalAmount });
  } catch (err) {
    console.error("[updateOrderDetails]", err);
    return fail("ORDER_UPDATE_FAILED", "Lỗi khi cập nhật chi tiết đơn hàng");
  }
}

/**
 * Confirm delivery with status update and proof upload.
 */
export async function confirmOrderDelivery(formData: FormData): Promise<ActionResult<{ orderId: string }>> {
  const orderId = formData.get("orderId") as string;
  const note = formData.get("note") as string;
  const userId = formData.get("userId") as string;
  const file = formData.get("file") as File;

  if (!orderId) return fail("ORDER_NOT_FOUND", "Mã đơn hàng không hợp lệ");

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.order.update({
        where: { id: orderId },
        data: { 
          status: "DELIVERED",
          fulfillmentStatus: "FULFILLED"
        }
      });

      // 2. Log status change
      await tx.orderStatusLog.create({
        data: {
          orderId,
          oldStatus: "SHIPPED",
          newStatus: "DELIVERED",
          changedBy: userId || undefined,
          note: note || "Xác nhận giao hàng thành công",
        }
      });

      // 3. Save proof if file exists
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `POD_${orderId}_${Date.now()}.${file.name.split('.').pop()}`;
        const saveRes = await saveFileLocally(buffer, fileName, 'attachments');
        
        await tx.documentAttachment.create({
          data: {
            orderId,
            documentType: 'DELIVERY_PROOF',
            fileName: file.name,
            fileUrl: saveRes.fileUrl,
            note: note || "Bằng chứng giao hàng (POD)",
          }
        });
      }

      // 4. Auto-generate Delivery Confirmation document
      try {
        await createAndFinalizeDoc('ORDER', orderId, 'DELIVERY_CONFIRMATION', { note }, userId);
      } catch (e) {
        console.error("Auto-gen delivery doc failed:", e);
      }

      revalidatePath(`/admin/orders/${orderId}`);
      return ok({ orderId });
    });
  } catch (err) {
    console.error("[confirmOrderDelivery]", err);
    return fail("ORDER_UPDATE_FAILED", "Không thể xác nhận giao hàng");
  }
}
