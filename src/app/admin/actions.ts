"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateQuoteStatus(quoteId: string, newStatus: string) {
  await prisma.quoteRequest.update({
    where: { id: quoteId },
    data: { status: newStatus },
  });
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
}

export async function assignQuoteToSales(quoteId: string, userId: string) {
  await prisma.quoteRequest.update({
    where: { id: quoteId },
    data: {
      assignedTo: userId,
      status: "ASSIGNED",
    },
  });
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
}

export async function deleteQuote(quoteId: string) {
  await prisma.quoteRequest.delete({
    where: { id: quoteId },
  });
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
}

export async function convertQuoteToOrder(
  quoteId: string,
  orderData: {
    paymentTerms?: string;
    deliveryTerms?: string;
    deliveryAddress?: string;
    notes?: string;
  }
) {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { customer: true },
  });

  if (!quote) throw new Error("Quote not found");

  // Parse items
  let items: { productName: string; quantity: number; specification?: string }[] = [];
  try {
    items = JSON.parse(quote.items);
  } catch {
    items = [];
  }

  // Find or create customer
  let customerId = quote.customerId;
  if (!customerId) {
    const customer = await prisma.customer.create({
      data: {
        contactName: quote.contactName,
        companyName: quote.companyName,
        phone: quote.contactPhone,
        email: quote.contactEmail,
        type: "DOMESTIC",
      },
    });
    customerId = customer.id;
  }

  // Generate order code
  const year = new Date().getFullYear();
  const orderPrefix = `ORD-${year}-`;
  const lastOrder = await prisma.order.findFirst({
    where: { orderCode: { startsWith: orderPrefix } },
    orderBy: { orderCode: "desc" },
    select: { orderCode: true },
  });
  let nextNum = 1;
  if (lastOrder) {
    const num = parseInt(lastOrder.orderCode.replace(orderPrefix, ""), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  const orderCode = `${orderPrefix}${nextNum.toString().padStart(3, "0")}`;

  // Create order with items
  const order = await prisma.order.create({
    data: {
      orderCode,
      customerId,
      assignedTo: quote.assignedTo,
      status: "REQUEST_RECEIVED",
      paymentTerms: orderData.paymentTerms,
      deliveryTerms: orderData.deliveryTerms,
      deliveryAddress: orderData.deliveryAddress || quote.deliveryLocation,
      notes: orderData.notes || quote.message,
      items: {
        create: items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          specification: item.specification,
        })),
      },
      statusLogs: {
        create: {
          fromStatus: "NONE",
          toStatus: "REQUEST_RECEIVED",
          note: `Chuyển từ báo giá ${quote.rfqCode}`,
        },
      },
    },
  });

  // Update quote status
  await prisma.quoteRequest.update({
    where: { id: quoteId },
    data: { status: "CONVERTED" },
  });

  revalidatePath("/admin/quotes");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");

  return { orderCode: order.orderCode };
}

export async function updateOrderStatus(orderId: string, newStatus: string, note?: string, userId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!order) throw new Error("Order not found");

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      statusLogs: {
        create: {
          fromStatus: order.status,
          toStatus: newStatus,
          note: note || undefined,
          changedBy: userId || undefined,
        },
      },
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
