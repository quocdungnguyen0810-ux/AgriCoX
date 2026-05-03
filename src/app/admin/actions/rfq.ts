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
