import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import { QuotePDFDocument } from "@/lib/pdf/QuotePDFDocument";
import React from "react";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!quote) {
      return new NextResponse("Quote not found", { status: 404 });
    }

    const stream = await renderToStream(
      React.createElement(QuotePDFDocument, { quote: quote as any }) as any
    );

    const response = new NextResponse(stream as unknown as BodyInit);
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${quote.quoteCode}.pdf"`
    );

    return response;
  } catch (error: any) {
    console.error("Quote PDF generation error:", error?.message || error);
    return new NextResponse(`Internal Server Error: ${error?.message || 'Unknown error'}`, { status: 500 });
  }
}
