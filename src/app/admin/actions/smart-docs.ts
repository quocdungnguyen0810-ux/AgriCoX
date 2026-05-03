"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ActionResult, ok, fail } from "@/lib/quote-error";
import { appendDocumentRow } from "@/lib/sheets";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { OrderStepPDFDocument, OrderStepType } from "@/lib/pdf/OrderStepPDFDocument";
import { saveFileLocally } from "@/lib/local-storage";
import { safeUploadToDrive } from "@/lib/drive";

/**
 * Create a new draft for a smart document.
 */
export async function createDocDraft(
  entityType: 'ORDER' | 'CONTRACT',
  entityId: string,
  documentType: OrderStepType,
  initialData: any
): Promise<ActionResult<{ id: string }>> {
  try {
    const doc = await prisma.generatedDocument.create({
      data: {
        entityType,
        entityId,
        documentType,
        status: "DRAFT",
        dataJson: JSON.stringify(initialData),
        format: "PDF",
        fileName: `${documentType}_DRAFT.pdf`,
        mimeType: "application/pdf",
      },
    });

    revalidatePath(`/admin/${entityType.toLowerCase()}s/${entityId}`);
    return ok({ id: doc.id });
  } catch (err) {
    console.error("[createDocDraft]", err);
    return fail("ORDER_UPDATE_FAILED", "Không thể tạo bản nháp chứng từ");
  }
}

/**
 * Update the data of a draft document.
 */
export async function updateDocDraft(
  docId: string,
  data: any
): Promise<ActionResult<{ id: string }>> {
  try {
    const doc = await prisma.generatedDocument.update({
      where: { id: docId },
      data: {
        dataJson: JSON.stringify(data),
      },
    });

    revalidatePath(`/admin/${doc.entityType.toLowerCase()}s/${doc.entityId}`);
    return ok({ id: doc.id });
  } catch (err) {
    console.error("[updateDocDraft]", err);
    return fail("ORDER_UPDATE_FAILED", "Không thể cập nhật bản nháp");
  }
}

/**
 * Finalize a document: Generate PDF, save locally, and sync to Sheets.
 */
export async function finalizeDoc(
  docId: string,
  userId?: string
): Promise<ActionResult<{ fileUrl: string }>> {
  try {
    const doc = await prisma.generatedDocument.findUnique({
      where: { id: docId },
    });

    if (!doc || !doc.dataJson) return fail("ORDER_NOT_FOUND", "Không tìm thấy chứng từ");

    // Fetch entity data
    let entity;
    if (doc.entityType === 'ORDER') {
      entity = await prisma.order.findUnique({
        where: { id: doc.entityId },
        include: { customer: true, assignee: true, items: true }
      });
    } else {
      entity = await prisma.contract.findUnique({
        where: { id: doc.entityId },
        include: { customer: true, order: { include: { items: true } } }
      });
    }

    if (!entity) return fail("ORDER_NOT_FOUND", "Không tìm thấy dữ liệu gốc");

    const customData = JSON.parse(doc.dataJson);
    const items = (entity as any).items || (entity as any).order?.items || [];
    const entityCode = (entity as any).orderCode || (entity as any).contractCode;

    // Standardized filename
    const fileName = `${doc.documentType}_${entityCode}.pdf`;

    // Render PDF to stream
    const stream = await renderToStream(
      React.createElement(OrderStepPDFDocument, {
        type: doc.documentType as OrderStepType,
        order: entity,
        items,
        customData
      }) as any
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Save to local storage
    const storageSubdir = doc.entityType === 'ORDER' ? 'orders' : 'contracts';
    const saveRes = await saveFileLocally(pdfBuffer, fileName, storageSubdir);

    // Update document record
    await prisma.generatedDocument.update({
      where: { id: docId },
      data: {
        status: "GENERATED",
        documentCode: `${doc.documentType}_${entityCode}`,
        fileName,
        fileUrl: saveRes.fileUrl,
        fileSize: pdfBuffer.length,
        generatedAt: new Date(),
        generatedBy: userId,
      }
    });

    // Upload to Google Drive
    const driveUrl = await safeUploadToDrive(pdfBuffer, fileName, doc.entityType);

    // Sync to Google Sheets
    try {
      await appendDocumentRow([
        new Date().toISOString(),
        entityCode,
        doc.documentType,
        fileName,
        driveUrl || `${process.env.NEXTAUTH_URL}${saveRes.fileUrl}`,
      ]);
    } catch (sheetErr) {
      console.error("Sheets sync failed for smart doc:", sheetErr);
    }

    revalidatePath(`/admin/${doc.entityType.toLowerCase()}s/${doc.entityId}`);
    return ok({ fileUrl: saveRes.fileUrl });
  } catch (err) {
    console.error("[finalizeDoc]", err);
    return fail("ORDER_UPDATE_FAILED", "Không thể hoàn tất chứng từ");
  }
}
/**
 * Shortcut to create and finalize a document in one step.
 */
export async function createAndFinalizeDoc(
  entityType: 'ORDER' | 'CONTRACT',
  entityId: string,
  documentType: OrderStepType,
  data: any,
  userId?: string
): Promise<ActionResult<{ fileUrl: string }>> {
  const draft = await createDocDraft(entityType, entityId, documentType, data);
  if (!draft.success) return draft as any;
  return finalizeDoc(draft.data.id, userId);
}
