import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import { ContractPDFDocument } from "@/lib/pdf/ContractPDFDocument";
import { sanitizeFileName } from "@/lib/file-name";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        customer: true,
        order: { include: { items: true } },
        signatures: true,
      },
    });

    if (!contract) {
      return new NextResponse("Contract not found", { status: 404 });
    }

    const customerSignature = contract.signatures.find(
      (s) => s.signerRole === "CUSTOMER"
    );
    const greenpeatSignature = contract.signatures.find(
      (s) => s.signerRole === "GREENPEAT_SIGNER"
    );

    const stream = await renderToStream(
      <ContractPDFDocument 
        contract={{
          ...contract,
          paymentTerms: contract.paymentTerms ?? undefined,
          deliveryTerms: contract.deliveryTerms ?? undefined,
          contentVi: contract.contentVi ?? undefined,
          contentEn: contract.contentEn ?? undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any} 
        customerSignature={customerSignature}
        greenpeatSignature={greenpeatSignature}
      />
    );

    const response = new NextResponse(stream as unknown as BodyInit);
    response.headers.set("Content-Type", "application/pdf");
    const filename = sanitizeFileName(`${contract.contractCode}.pdf`, "contract.pdf");

    response.headers.set(
      "Content-Disposition",
      `inline; filename="${filename}"`
    );

    return response;
  } catch (error: any) {
    console.error("PDF generation error:", error?.message || error);
    if (error?.stack) console.error(error.stack);
    return new NextResponse(`Internal Server Error: ${error?.message || 'Unknown error'}`, { status: 500 });
  }
}
