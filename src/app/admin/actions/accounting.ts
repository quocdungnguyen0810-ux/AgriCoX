"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { renderToStream } from "@react-pdf/renderer";
import { ReceiptPDFDocument } from "@/lib/pdf/ReceiptPDFDocument";
import { saveFileLocally } from "@/lib/local-storage";
import { appendDocumentRow } from "@/lib/sheets";
import { safeUploadToDrive } from "@/lib/drive";
import React from "react";

export async function recordPayment(
  orderId: string,
  amount: number,
  method: string,
  referenceCode?: string,
  note?: string
) {
  try {
    if (amount <= 0) {
      return { success: false, error: "Số tiền phải lớn hơn 0" };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { totalAmount: true, orderCode: true }
    });

    if (!order) {
      return { success: false, error: "Đơn hàng không tồn tại" };
    }

    // Lấy tổng số tiền đã thanh toán trước đó
    const previousReceipts = await prisma.paymentReceipt.findMany({
      where: { orderId }
    });
    
    const previousTotal = previousReceipts.reduce((sum, r) => sum + r.amount, 0);
    const newTotal = previousTotal + amount;

    // Sinh mã biên lai (unique)
    const receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    // Tạo biên lai
    const receipt = await prisma.paymentReceipt.create({
      data: {
        receiptNumber,
        orderId,
        amount,
        paymentMethod: method,
        referenceCode: referenceCode || null,
        note: note || null,
      }
    });

    // ── Sinh PDF Biên lai ──
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (fullOrder) {
      try {
        const stream = await renderToStream(
          React.createElement(ReceiptPDFDocument, {
            receipt,
            order: fullOrder
          }) as any
        );

        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
        }
        const pdfBuffer = Buffer.concat(chunks);
        
        const fileName = `${receiptNumber}.pdf`;
        const saveRes = await saveFileLocally(pdfBuffer, fileName, "receipts");
        
        // Cập nhật link PDF vào DB
        await prisma.paymentReceipt.update({
          where: { id: receipt.id },
          data: { pdfUrl: saveRes.fileUrl }
        });

        // Đồng bộ link lên Google Sheets
        await appendDocumentRow([
          new Date().toISOString(),
          order.orderCode,
          "Biên lai thanh toán",
          fileName,
          saveRes.fileUrl
        ]);

        // Upload lên Google Drive
        await safeUploadToDrive(pdfBuffer, fileName, "ORDER");
      } catch (pdfErr) {
        console.error("Lỗi khi sinh PDF Biên lai:", pdfErr);
      }
    }

    // Cập nhật trạng thái thanh toán của Đơn hàng
    let newPaymentStatus = "PENDING";
    if (newTotal > 0 && newTotal < order.totalAmount) {
      newPaymentStatus = "PARTIALLY_PAID";
    } else if (newTotal >= order.totalAmount) {
      newPaymentStatus = "PAID";
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: newPaymentStatus }
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, receiptId: receipt.id };
  } catch (error: any) {
    console.error("Lỗi khi ghi nhận thanh toán:", error);
    return { success: false, error: "Có lỗi xảy ra khi lưu thanh toán." };
  }
}

export async function createInvoice(orderId: string) {
  try {
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, items: true }
    });

    if (!fullOrder) {
      return { success: false, error: "Đơn hàng không tồn tại" };
    }

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const taxAmount = fullOrder.vatAmount; // Dùng VAT đã tính sẵn từ Order
    const totalAmount = fullOrder.totalAmount; // Dùng tổng tiền đã tính sẵn từ Order

    // Tạo hoá đơn trong DB
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        totalAmount,
        taxAmount,
        status: "ISSUED"
      }
    });

    // Sinh PDF Hoá đơn
    try {
      const { InvoicePDFDocument } = await import("@/lib/pdf/InvoicePDFDocument");
      
      const stream = await renderToStream(
        React.createElement(InvoicePDFDocument, {
          invoice,
          order: fullOrder
        }) as any
      );

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const pdfBuffer = Buffer.concat(chunks);
      
      const fileName = `${invoiceNumber}.pdf`;
      const saveRes = await saveFileLocally(pdfBuffer, fileName, "invoices");
      
      // Cập nhật link PDF vào DB
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfUrl: saveRes.fileUrl }
      });

      // Đồng bộ link lên Google Sheets
      await appendDocumentRow([
        new Date().toISOString(),
        fullOrder.orderCode,
        "Hoá đơn",
        fileName,
        saveRes.fileUrl
      ]);

      // Upload lên Google Drive
      await safeUploadToDrive(pdfBuffer, fileName, "ORDER");
    } catch (pdfErr) {
      console.error("Lỗi khi sinh PDF Hoá đơn:", pdfErr);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, invoiceId: invoice.id };
  } catch (error: any) {
    console.error("Lỗi khi tạo hoá đơn:", error);
    return { success: false, error: "Có lỗi xảy ra khi tạo hoá đơn." };
  }
}
