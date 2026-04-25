import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Generate sequential RFQ code: RFQ-2026-001, RFQ-2026-002...
async function generateRFQCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RFQ-${year}-`;

  const lastRFQ = await prisma.quoteRequest.findFirst({
    where: { rfqCode: { startsWith: prefix } },
    orderBy: { rfqCode: "desc" },
    select: { rfqCode: true },
  });

  let nextNum = 1;
  if (lastRFQ) {
    const lastNum = parseInt(lastRFQ.rfqCode.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${nextNum.toString().padStart(3, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, contactName, companyName, contactPhone, contactEmail, message, deliveryLocation } = body;

    // Validate required fields
    if (!contactName || !contactPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin bắt buộc (tên, SĐT, sản phẩm)" },
        { status: 400 }
      );
    }

    // Generate RFQ code
    const rfqCode = await generateRFQCode();

    // Try to find existing customer by phone/email
    let customerId: string | null = null;
    if (contactEmail) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: contactEmail },
            { phone: contactPhone },
          ],
        },
      });
      if (existingCustomer) {
        customerId = existingCustomer.id;
      }
    }

    // Save to database
    const quote = await prisma.quoteRequest.create({
      data: {
        rfqCode,
        customerId,
        status: "NEW",
        contactName,
        companyName: companyName || null,
        contactPhone,
        contactEmail: contactEmail || null,
        deliveryLocation: deliveryLocation || null,
        items: JSON.stringify(items),
        message: message || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        rfqCode: quote.rfqCode,
        message: "Yêu cầu báo giá đã được gửi thành công!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("RFQ API Error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
