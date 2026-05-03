import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { renderToStream } from '@react-pdf/renderer';
import { OrderStepPDFDocument, OrderStepType } from '@/lib/pdf/OrderStepPDFDocument';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as OrderStepType;

  if (!type) {
    return NextResponse.json({ error: "Missing document type" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        assignee: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const stream = await renderToStream(
      <OrderStepPDFDocument 
        type={type} 
        order={order} 
        items={order.items} 
      />
    );

    // Standardize filename based on document type and order code
    const filename = `${type}_${order.orderCode}.pdf`;

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[OrderStepPDF API Error]:', error);
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 });
  }
}
