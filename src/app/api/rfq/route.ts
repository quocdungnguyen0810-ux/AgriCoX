import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { rfqConfirmationEmail } from "@/lib/email-templates/rfq-confirmation";
import { rfqNotificationEmail } from "@/lib/email-templates/rfq-notification";

async function generateRFQCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RFQ-${year}-`;
  const lastRFQ = await prisma.rfq.findFirst({
    where: { rfqCode: { startsWith: prefix } },
    orderBy: { rfqCode: "desc" },
    select: { rfqCode: true },
  });
  let nextNum = 1;
  if (lastRFQ) {
    const n = parseInt(lastRFQ.rfqCode.replace(prefix, ""), 10);
    if (!isNaN(n)) nextNum = n + 1;
  }
  return `${prefix}${nextNum.toString().padStart(3, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, contactName, companyName, contactPhone, contactEmail, message, deliveryLocation, locale } = body;

    if (!contactName || !contactPhone || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rfqCode = await generateRFQCode();
    const preferredLocale = locale || "vi";

    // Find existing customer
    let customerId: string | null = null;
    if (contactEmail || contactPhone) {
      const existing = await prisma.customer.findFirst({
        where: { OR: [
          ...(contactEmail ? [{ email: contactEmail }] : []),
          { phone: contactPhone },
        ]},
      });
      if (existing) customerId = existing.id;
    }

    // Create RFQ with items
    const rfq = await prisma.rfq.create({
      data: {
        rfqCode,
        customerId,
        status: "NEW",
        contactName,
        companyName: companyName || null,
        contactPhone,
        contactEmail: contactEmail || null,
        deliveryAddress: deliveryLocation || null,
        preferredLocale,
        message: message || null,
        items: {
          create: await Promise.all(
            items.map(async (item: { productId?: string; productName: string; quantity: number; specification?: string }) => {
              // Validate productId exists in DB to avoid FK constraint violations
              let validProductId: string | null = null;
              if (item.productId) {
                const exists = await prisma.product.findUnique({ where: { id: item.productId }, select: { id: true } });
                if (exists) validProductId = exists.id;
              }
              return {
                productId: validProductId,
                productNameSnapshot: item.productName,
                packagingSnapshot: item.specification || null,
                quantity: item.quantity || 1,
              };
            })
          ),
        },
      },
    });

    // ── Send emails (fire-and-forget, don't block response) ──
    const emailItems = items.map((item: { productName: string; quantity: number; specification?: string }) => ({
      productName: item.productName,
      quantity: item.quantity || 1,
      specification: item.specification || null,
    }));

    // Customer confirmation email
    if (contactEmail) {
      const confirmation = rfqConfirmationEmail({
        rfqCode,
        contactName,
        items: emailItems,
        locale: preferredLocale,
      });
      sendEmail({ to: contactEmail, ...confirmation }).catch((err) =>
        console.error("Failed to send customer confirmation email:", err)
      );
    }

    // Internal notification email
    const notification = rfqNotificationEmail({
      rfqCode,
      contactName,
      companyName,
      contactPhone,
      contactEmail,
      items: emailItems,
      message,
    });
    sendEmail({ to: "sales@greenpeat.vn", ...notification }).catch((err) =>
      console.error("Failed to send internal notification email:", err)
    );

    return NextResponse.json({ success: true, rfqCode: rfq.rfqCode }, { status: 201 });
  } catch (error) {
    console.error("RFQ API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
