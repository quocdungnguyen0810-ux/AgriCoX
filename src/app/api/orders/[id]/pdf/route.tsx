import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import { OrderPDFDocument } from "@/lib/pdf/OrderPDFDocument";
import React from "react";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const stream = await renderToStream(
      React.createElement(OrderPDFDocument, { order: order as any }) as any
    );

    const response = new NextResponse(stream as unknown as BodyInit);
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      `inline; filename="${order.orderCode}.pdf"`
    );

    return response;
  } catch (error: any) {
    console.error("Order PDF generation error:", error?.message || error);
    return new NextResponse(`Internal Server Error: ${error?.message || 'Unknown error'}`, { status: 500 });
  }
}
