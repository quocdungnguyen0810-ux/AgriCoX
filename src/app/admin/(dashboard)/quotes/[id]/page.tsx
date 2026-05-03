export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import QuoteEditor from "./QuoteEditor";
import { DocumentUploadPanel } from "@/components/admin/DocumentUploadPanel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [quote, generatedDocuments] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: {
        items: { orderBy: { productNameSnapshot: "asc" } },
        rfq: { select: { rfqCode: true, contactName: true, companyName: true, contactPhone: true, contactEmail: true, deliveryAddress: true, message: true } },
        creator: { select: { name: true } },
      },
    }),
    prisma.generatedDocument.findMany({
      where: { entityType: "QUOTE", entityId: id },
      orderBy: { generatedAt: "desc" },
    }),
  ]);

  if (!quote) notFound();

  // Serialize for client component
  const serialized = {
    id: quote.id,
    quoteCode: quote.quoteCode,
    status: quote.status,
    version: quote.version,
    locale: quote.locale,
    currency: quote.currency,
    subtotal: quote.subtotal,
    discountAmount: quote.discountAmount,
    vatRate: quote.vatRate,
    vatAmount: quote.vatAmount,
    shippingFee: quote.shippingFee,
    totalAmount: quote.totalAmount,
    paymentTerms: quote.paymentTerms || "",
    deliveryTerms: quote.deliveryTerms || "",
    validUntil: quote.validUntil ? quote.validUntil.toISOString().split("T")[0] : "",
    commercialNotes: quote.commercialNotes || "",
    technicalNotes: quote.technicalNotes || "",
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    creatorName: quote.creator?.name || "—",
    rfq: quote.rfq ? {
      rfqCode: quote.rfq.rfqCode,
      contactName: quote.rfq.contactName,
      companyName: quote.rfq.companyName || "",
      contactPhone: quote.rfq.contactPhone,
      contactEmail: quote.rfq.contactEmail || "",
      deliveryAddress: quote.rfq.deliveryAddress || "",
      message: quote.rfq.message || "",
    } : null,
    items: quote.items.map((item) => ({
      id: item.id,
      productNameSnapshot: item.productNameSnapshot,
      packagingSnapshot: item.packagingSnapshot || "",
      quantity: item.quantity,
      unit: item.unit || "pcs",
      unitPrice: item.unitPrice,
      discountRate: item.discountRate,
      totalPrice: item.totalPrice,
      note: item.note || "",
    })),
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <QuoteEditor key={serialized.updatedAt} quote={serialized} />
      <DocumentUploadPanel
        entityType="QUOTE"
        entityId={quote.id}
        referenceCode={quote.quoteCode}
        documents={generatedDocuments.map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          storageProvider: doc.storageProvider,
          generatedAt: doc.generatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
