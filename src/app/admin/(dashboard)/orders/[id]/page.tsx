export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  FileText,
  Package,
  TrendingUp,
  CreditCard,
  Truck,
  ShieldCheck,
  ClipboardList,
  Warehouse,
  FileCheck2,
} from "lucide-react";
import { orderStatusLabels, paymentStatusLabels, isTerminalOrderStatus } from "@/lib/order-status";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { CreateInvoiceButton } from "./CreateInvoiceButton";
import { CreateDeliveryModal } from "./CreateDeliveryModal";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { SmartDocManager } from "./SmartDocManager";
import LogisticsDocPanel from "./LogisticsDocPanel";
import { ConfirmDeliveryModal } from "./ConfirmDeliveryModal";
import OrderEditor from "./OrderEditor";
import { DocumentUploadPanel } from "@/components/admin/DocumentUploadPanel";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let order;
  try {
    order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        assignee: { select: { name: true, email: true } },
        items: true,
        quote: {
          select: { id: true, quoteCode: true },
        },
        contract: { select: { id: true } },
        statusLogs: {
          include: { user: { select: { name: true } } },
          orderBy: { changedAt: "asc" },
        },
        receipts: { orderBy: { paymentDate: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
        deliveryNotes: { orderBy: { createdAt: "desc" } },
        attachments: { orderBy: { createdAt: "desc" } },
      },
    });

    // Manually fetch generated documents since it's a polymorphic-like relation
    const generatedDocs = await prisma.generatedDocument.findMany({
      where: { entityType: 'ORDER', entityId: id },
      orderBy: { generatedAt: 'desc' }
    });

    // Add them to order object for easier use
    (order as any).generatedDocuments = generatedDocs;
  } catch (err) {
    console.error("[OrderDetailPage] DB Error:", err);
    notFound();
  }

  if (!order) notFound();

  const serializedOrder = {
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    locale: order.locale,
    currency: order.currency,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    vatAmount: order.vatAmount,
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentTerms: order.paymentTerms || "",
    deliveryTerms: order.deliveryTerms || "",
    deliveryAddress: order.deliveryAddress || "",
    notes: order.notes || "",
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    contractId: order.contract?.id,
    customer: {
      name: order.customer.name,
      companyName: order.customer.companyName,
      phone: order.customer.phone,
      email: order.customer.email,
    },
    quote: order.quote,
    items: order.items.map((item) => ({
      id: item.id,
      productNameSnapshot: item.productNameSnapshot,
      packagingSnapshot: item.packagingSnapshot || "",
      quantity: item.quantity,
      unit: item.unit || "pcs",
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      note: item.note || "",
    })),
  };

  const isTerminal = isTerminalOrderStatus(order.status);

  return (
    <div className="space-y-6 max-w-5xl">
      <OrderEditor key={serializedOrder.updatedAt} order={serializedOrder} />

      {/* ── Additional Data (Read Only) ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Accounting & Logistics Lists */}
        <div className="space-y-6">
          {/* Lịch sử thanh toán */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
              <CreditCard size={14} className="text-emerald-500" /> Lịch sử thanh toán
            </h3>
            {order.receipts.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Chưa có bản ghi thanh toán.</p>
            ) : (
              <div className="space-y-2">
                {order.receipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-sm">
                    <div>
                      <div className="font-semibold text-gray-800">{new Intl.NumberFormat("vi-VN").format(receipt.amount)} ₫</div>
                      <div className="text-xs text-gray-500">{new Date(receipt.paymentDate).toLocaleDateString("vi-VN")} • {receipt.paymentMethod}</div>
                    </div>
                    {receipt.pdfUrl && (
                      <a href={receipt.pdfUrl} target="_blank" className="text-xs font-bold text-emerald-600 hover:underline">PDF</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lịch sử hoá đơn */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
              <FileText size={14} className="text-indigo-500" /> Lịch sử hoá đơn
            </h3>
            {order.invoices.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Chưa có hoá đơn.</p>
            ) : (
              <div className="space-y-2">
                {order.invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-sm">
                    <div>
                      <div className="font-semibold text-gray-800">{inv.invoiceNumber}</div>
                      <div className="text-xs text-gray-500">{new Date(inv.issueDate).toLocaleDateString("vi-VN")}</div>
                    </div>
                    {inv.pdfUrl && (
                      <a href={inv.pdfUrl} target="_blank" className="text-xs font-bold text-indigo-600 hover:underline">PDF</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Biên bản Giao nhận */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
              <Truck size={14} className="text-orange-500" /> Biên bản Giao nhận
            </h3>
            {order.deliveryNotes.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Chưa có biên bản giao nhận.</p>
            ) : (
              <div className="space-y-2">
                {order.deliveryNotes.map((del) => (
                  <div key={del.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50/50 border border-orange-100 text-sm">
                    <div>
                      <div className="font-semibold text-gray-800">{del.deliveryNumber}</div>
                      <div className="text-xs text-gray-500">{del.shippingCompany} • {del.licensePlate}</div>
                    </div>
                    {del.pdfUrl && (
                      <a href={del.pdfUrl} target="_blank" className="text-xs font-bold text-orange-600 hover:underline">PDF</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hồ sơ Chứng từ quy trình Logistics & QC (Tương tác) */}
          <LogisticsDocPanel 
            order={serializedOrder} 
            generatedDocs={(order as any).generatedDocuments} 
          />

          <DocumentUploadPanel
            entityType="ORDER"
            entityId={order.id}
            referenceCode={order.orderCode}
            documents={(order as any).generatedDocuments.map((doc: any) => ({
              id: doc.id,
              documentType: doc.documentType,
              fileName: doc.fileName,
              fileUrl: doc.fileUrl,
              storageProvider: doc.storageProvider,
              generatedAt: doc.generatedAt.toISOString(),
            }))}
          />

          {/* Hồ sơ Chứng từ đính kèm (Upload thủ công) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
              <Package size={14} className="text-gray-500" /> Tài liệu đính kèm khác
            </h3>
            {order.attachments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Chưa có hồ sơ đính kèm.</p>
            ) : (
              <div className="space-y-2">
                {order.attachments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 text-sm">
                    <div>
                      <div className="font-semibold text-gray-800">{doc.documentType}: {doc.fileName}</div>
                      {doc.note && <div className="text-xs text-gray-500">{doc.note}</div>}
                    </div>
                    <a href={doc.fileUrl} target="_blank" className="text-xs font-bold text-gray-600 hover:underline">Tải file</a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hệ thống chứng từ nghiệp vụ thông minh (Nháp -> Chốt) */}
          <SmartDocManager 
            entityId={order.id}
            entityType="ORDER"
            existingDocs={(order as any).generatedDocuments.filter((d: any) => 
              ['PROFORMA_INVOICE', 'PHYTOSANITARY', 'CERTIFICATE_ORIGIN', 'CONTRACT_LIQUIDATION'].includes(d.documentType)
            )}
            defaultValues={{
              orderCode: order.orderCode,
              customerName: order.customer.name,
              deliveryAddress: order.deliveryAddress || 'Kho GreenPeat',
              assigneeName: order.assignee?.name || 'GREENPEAT OPS',
            }}
          />
        </div>
      </div>

      {/* ── Status timeline ── */}
      {order.statusLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
            <TrendingUp size={14} className="text-purple-500" /> Lịch sử trạng thái
          </h3>
          <div className="space-y-3">
            {order.statusLogs.map((log, idx) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${idx === order.statusLogs.length - 1 ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" : "bg-gray-300"}`} />
                  {idx < order.statusLogs.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[16px]" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">
                      {orderStatusLabels[log.newStatus] || log.newStatus}
                    </span>
                    {log.oldStatus && (
                      <span className="text-xs text-gray-400">← {orderStatusLabels[log.oldStatus] || log.oldStatus}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.changedAt).toLocaleString("vi-VN")}
                    <span className="ml-2 text-gray-500">— {log.user?.name || "Hệ thống"}</span>
                    {log.note && <span className="ml-2 text-gray-500">— {log.note}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Accounting & Logistics Modals ── */}
      {!isTerminal && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Công cụ hỗ trợ giao vận & kế toán</h3>
          <div className="flex gap-2 flex-wrap">
            <UploadDocumentModal orderId={order.id} />
            <CreateDeliveryModal orderId={order.id} />
            <CreateInvoiceButton orderId={order.id} />
            <RecordPaymentModal 
              orderId={order.id} 
              totalAmount={order.totalAmount} 
              paidAmount={order.receipts.reduce((sum, r) => sum + r.amount, 0)} 
            />
            {order.status === "SHIPPED" && (
              <ConfirmDeliveryModal orderId={order.id} />
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link
          href="/admin/orders"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Quay lại danh sách
        </Link>
        {order.quote && (
          <Link
            href={`/admin/quotes/${order.quote.id}`}
            className="text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            <FileText size={14} /> Xem báo giá gốc
          </Link>
        )}
      </div>
    </div>
  );
}
