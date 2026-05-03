"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { renderToStream } from "@react-pdf/renderer";
import { DeliveryPDFDocument } from "@/lib/pdf/DeliveryPDFDocument";
import { saveFileLocally } from "@/lib/local-storage";
import { appendDocumentRow } from "@/lib/sheets";
import { safeUploadToDrive } from "@/lib/drive";
import React from "react";

export async function createDeliveryNote(
  orderId: string,
  shippingCompany?: string,
  driverName?: string,
  licensePlate?: string,
  trackingCode?: string
) {
  try {
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, items: true }
    });

    if (!fullOrder) {
      return { success: false, error: "Đơn hàng không tồn tại" };
    }

    const deliveryNumber = `DEL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    // Tạo Delivery Note trong DB
    const delivery = await prisma.deliveryNote.create({
      data: {
        deliveryNumber,
        orderId,
        shippingCompany,
        driverName,
        licensePlate,
        trackingCode,
        status: "SHIPPING"
      }
    });

    // Chuyển FulfillmentStatus sang SHIPPING
    await prisma.order.update({
      where: { id: orderId },
      data: { fulfillmentStatus: "SHIPPING" }
    });

    // Sinh PDF Biên bản giao nhận
    try {
      const stream = await renderToStream(
        React.createElement(DeliveryPDFDocument, {
          delivery,
          order: fullOrder
        }) as any
      );

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const pdfBuffer = Buffer.concat(chunks);
      
      const fileName = `${deliveryNumber}.pdf`;
      const saveRes = await saveFileLocally(pdfBuffer, fileName, "deliveries");
      
      // Cập nhật link PDF vào DB
      await prisma.deliveryNote.update({
        where: { id: delivery.id },
        data: { pdfUrl: saveRes.fileUrl }
      });

      // Đồng bộ link lên Google Sheets
      await appendDocumentRow([
        new Date().toISOString(),
        fullOrder.orderCode,
        "Biên bản giao nhận",
        fileName,
        saveRes.fileUrl
      ]);

      // Upload lên Google Drive
      await safeUploadToDrive(pdfBuffer, fileName, "ORDER");
    } catch (pdfErr) {
      console.error("Lỗi khi sinh PDF Biên bản giao nhận:", pdfErr);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, deliveryId: delivery.id };
  } catch (error: any) {
    console.error("Lỗi khi tạo Biên bản giao nhận:", error);
    return { success: false, error: "Có lỗi xảy ra khi tạo biên bản." };
  }
}

// Giả lập upload tài liệu XNK
export async function uploadDocument(orderId: string, documentType: string, fileName: string, fileUrl: string, note?: string) {
  try {
    await prisma.documentAttachment.create({
      data: {
        orderId,
        documentType,
        fileName,
        fileUrl,
        note
      }
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderCode: true }
    });

    if (order) {
      // Đồng bộ link lên Google Sheets
      await appendDocumentRow([
        new Date().toISOString(),
        order.orderCode,
        documentType,
        fileName,
        fileUrl
      ]);
    }
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi lưu tài liệu" };
  }
}
