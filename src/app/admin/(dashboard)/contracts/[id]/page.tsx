export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  ArrowLeft,
  FileCheck,
  ShoppingCart,
  ReceiptText,
  FileText,
  User,
  Building2,
  Phone,
  Mail,
  Hash,
  TrendingUp,
  FileStack,
  DownloadCloud,
  Clock,
} from "lucide-react";
import {
  ContractStatus,
  getContractStatusLabel,
  getContractStatusBadge,
  canEditContract,
  isTerminalContractStatus,
  getAllowedContractTransitions,
} from "@/lib/contract-status";
import { ContractEditor } from "./ContractEditor";
import { ContractStatusActions } from "./ContractStatusActions";
import { SigningLinkGenerator } from "./SigningLinkGenerator";
import { ContractFinancialActions } from "./ContractFinancialActions";
import { SmartDocManager } from "../../orders/[id]/SmartDocManager";
import { DocumentUploadPanel } from "@/components/admin/DocumentUploadPanel";

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: contractId } = await params;
  let contract;
  try {
    contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        customer: true,
        order: { 
          include: { 
            items: true,
            invoices: { orderBy: { createdAt: "desc" } },
            receipts: { orderBy: { paymentDate: "desc" } },
            deliveryNotes: { orderBy: { createdAt: "desc" } },
            attachments: { orderBy: { createdAt: "desc" } },
          } 
        },
        quote: { select: { id: true, quoteCode: true } },
        rfq: { select: { id: true, rfqCode: true } },
        signatures: { orderBy: { createdAt: "asc" } },
        documents: { orderBy: { createdAt: "desc" } },
        statusLogs: {
          orderBy: { changedAt: "asc" },
          include: { user: { select: { name: true } } },
        },
      },
    });

    // Manually fetch generated documents since it's a polymorphic-like relation
    const generatedDocs = await prisma.generatedDocument.findMany({
      where: { entityType: 'CONTRACT', entityId: contractId },
      orderBy: { generatedAt: 'desc' }
    });

    // Add them to contract object
    (contract as any).generatedDocuments = generatedDocs;
  } catch {
    notFound();
  }

  if (!contract) notFound();

  const editable = canEditContract(contract.status);
  const isTerminal = isTerminalContractStatus(contract.status);
  const allowedTransitions = getAllowedContractTransitions(contract.status as ContractStatus);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/contracts"
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
              <FileCheck size={22} className="text-green-600" />
              {contract.contractCode}
            </h2>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Clock size={11} /> Tạo: {new Date(contract.createdAt).toLocaleString("vi-VN")}
              </span>
              <span className="flex items-center gap-1">
                <Hash size={11} /> {contract.locale.toUpperCase()} · {contract.currency}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getContractStatusBadge(contract.status)}`}>
            {getContractStatusLabel(contract.status)}
          </span>
          <span className="px-3 py-1.5 rounded-lg text-sm font-bold text-green-700 bg-green-50 border border-green-200 shadow-sm">
            {formatVND(contract.totalAmount || contract.order?.totalAmount || 0)} ₫
          </span>
          {isTerminal && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Kết thúc</span>
          )}
          <a
            href={`/api/contracts/${contract.id}/pdf`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition-colors ml-auto shadow-sm"
          >
            <DownloadCloud size={14} /> Tải PDF Hợp Đồng
          </a>
        </div>
      </div>

      {/* ── Linked Records ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wide">Liên kết hồ sơ</h3>
        <div className="flex flex-wrap gap-3">
          {contract.order && (
            <Link
              href={`/admin/orders/${contract.order.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 text-sm font-medium transition-colors"
            >
              <ShoppingCart size={14} />
              Đơn hàng: {contract.order.orderCode}
            </Link>
          )}
          {contract.quote && (
            <Link
              href={`/admin/quotes/${contract.quote.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 text-sm font-medium transition-colors"
            >
              <ReceiptText size={14} />
              Báo giá: {contract.quote.quoteCode}
            </Link>
          )}
          {contract.rfq && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-sm font-medium">
              <FileText size={14} />
              RFQ: {contract.rfq.rfqCode}
            </span>
          )}
        </div>
      </div>

      {/* ── Customer Info ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wide">Đối tác khách hàng</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User size={14} className="text-gray-400 shrink-0" />
            {contract.customer.name}
          </div>
          {contract.customer.companyName && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Building2 size={14} className="text-gray-400 shrink-0" />
              {contract.customer.companyName}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone size={14} className="text-gray-400 shrink-0" />
            {contract.customer.phone}
          </div>
          {contract.customer.email && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail size={14} className="text-gray-400 shrink-0" />
              {contract.customer.email}
            </div>
          )}
        </div>
      </div>

      {/* ── Editor (Items + Pricing + Terms + Content) ── */}
      <ContractEditor
        contractId={contract.id}
        editable={editable}
        initialData={{
          contractDate: contract.contractDate?.toISOString() || "",
          effectiveDate: contract.effectiveDate?.toISOString() || "",
          expiryDate: contract.expiryDate?.toISOString() || "",
          paymentTerms: contract.paymentTerms || contract.order?.paymentTerms || "",
          deliveryTerms: contract.deliveryTerms || contract.order?.deliveryTerms || "",
          incoterm: contract.incoterm || "",
          deliveryLocation: contract.deliveryLocation || contract.order?.deliveryAddress || "",
          contentVi: contract.contentVi || "",
          contentEn: contract.contentEn || "",
          // Pricing from linked order
          subtotal: contract.order?.subtotal || 0,
          discountAmount: contract.order?.discountAmount || 0,
          vatAmount: contract.order?.vatAmount || 0,
          shippingFee: contract.order?.shippingFee || 0,
          totalAmount: contract.order?.totalAmount || contract.totalAmount,
          items: contract.order?.items.map(item => ({
            id: item.id,
            productNameSnapshot: item.productNameSnapshot,
            packagingSnapshot: item.packagingSnapshot || "",
            quantity: item.quantity,
            unit: item.unit || "pcs",
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            note: item.note || "",
          })) || [],
        }}
      />

      {/* ── Additional Lists (Status, Docs, Signatures) ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Lịch sử trạng thái */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
              <TrendingUp size={14} className="text-green-500" /> Lịch sử trạng thái
            </h3>
            <div className="space-y-3">
              {contract.statusLogs.map((log, idx) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${idx === contract.statusLogs.length - 1 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-gray-300"}`} />
                    {idx < contract.statusLogs.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[16px]" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-700">{getContractStatusLabel(log.newStatus)}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(log.changedAt).toLocaleString("vi-VN")}
                      {log.user && <span className="ml-2 text-gray-500">— {log.user.name}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chữ ký */}
          {contract.signatures.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Chữ ký điện tử</h3>
              <div className="space-y-2">
                {contract.signatures.map((sig) => (
                  <div key={sig.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-700">{sig.signerName}</span>
                      <span className="text-xs text-gray-400 ml-2">({sig.signerRole})</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${sig.status === "SIGNED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {sig.status === "SIGNED" ? "Đã ký" : "Chờ ký"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Tài liệu hợp đồng */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
              <FileStack size={14} className="text-gray-500" /> Tài liệu & Tệp đính kèm
            </h3>
            {contract.documents.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Chưa có tài liệu đính kèm.</p>
            ) : (
              <div className="space-y-2">
                {contract.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-sm truncate pr-4">
                      <span className="font-medium text-gray-700">{doc.fileName}</span>
                      <span className="text-xs text-gray-400 block">{doc.documentType} v{doc.version}</span>
                    </div>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" className="text-xs font-bold text-green-600 hover:underline shrink-0">Tải file</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Chứng từ liên quan từ Đơn hàng (Hoá đơn, Phiếu giao hàng, Biên lai) */}
          {contract.order && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
                <ReceiptText size={14} className="text-purple-500" /> Hồ sơ tài chính & Giao nhận
              </h3>
              
              {contract.order.invoices.length === 0 && contract.order.deliveryNotes.length === 0 && contract.order.receipts.length === 0 && (
                <p className="text-sm text-gray-400 italic">Chưa có hoá đơn hay phiếu giao nhận.</p>
              )}

              <div className="space-y-4">
                {/* Invoices Section */}
                {contract.order.invoices.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Hoá đơn (Invoices)</h4>
                    <div className="space-y-2">
                      {contract.order.invoices.map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between text-xs p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                          <div className="flex flex-col">
                            <span className="font-bold text-indigo-900">{inv.invoiceNumber}</span>
                            <span className="text-[10px] text-indigo-400">{new Date(inv.issueDate).toLocaleDateString("vi-VN")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${inv.status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {inv.status}
                            </span>
                            <a href={inv.pdfUrl} target="_blank" className="p-1 rounded hover:bg-indigo-100 text-indigo-600 transition-colors">
                              <DownloadCloud size={14} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery Notes Section */}
                {contract.order.deliveryNotes.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Phiếu giao hàng / Vận đơn</h4>
                    <div className="space-y-2">
                      {contract.order.deliveryNotes.map((del: any) => (
                        <div key={del.id} className="flex items-center justify-between text-xs p-2 bg-orange-50/50 rounded-lg border border-orange-100">
                          <div className="flex flex-col">
                            <span className="font-bold text-orange-900">{del.deliveryNumber}</span>
                            <span className="text-[10px] text-orange-400">{del.status}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={del.pdfUrl} target="_blank" className="p-1 rounded hover:bg-orange-100 text-orange-600 transition-colors">
                              <DownloadCloud size={14} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Receipts Section */}
                {contract.order.receipts.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Biên lai thanh toán</h4>
                    <div className="space-y-2">
                      {contract.order.receipts.map((rec: any) => (
                        <div key={rec.id} className="flex items-center justify-between text-xs p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                          <div className="flex flex-col">
                            <span className="font-bold text-emerald-900">{rec.receiptNumber}</span>
                            <span className="text-[10px] text-emerald-400">{formatVND(rec.amount)} ₫ · {new Date(rec.paymentDate).toLocaleDateString("vi-VN")}</span>
                          </div>
                          <a href={rec.pdfUrl} target="_blank" className="p-1 rounded hover:bg-emerald-100 text-emerald-600 transition-colors">
                            <DownloadCloud size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hệ thống chứng từ nghiệp vụ thông minh (Nháp -> Chốt) */}
          <SmartDocManager 
            entityId={contract.id}
            entityType="CONTRACT"
            existingDocs={(contract as any).generatedDocuments.filter((d: any) => 
              ['PROFORMA_INVOICE', 'PHYTOSANITARY', 'CERTIFICATE_ORIGIN', 'CONTRACT_LIQUIDATION'].includes(d.documentType)
            )}
            defaultValues={{
              orderCode: contract.contractCode,
              customerName: contract.customer.name,
              deliveryAddress: contract.deliveryLocation || contract.order?.deliveryAddress || 'Kho GreenPeat',
              assigneeName: 'GREENPEAT OPS',
            }}
          />

          <DocumentUploadPanel
            entityType="CONTRACT"
            entityId={contract.id}
            referenceCode={contract.contractCode}
            documents={(contract as any).generatedDocuments.map((doc: any) => ({
              id: doc.id,
              documentType: doc.documentType,
              fileName: doc.fileName,
              fileUrl: doc.fileUrl,
              storageProvider: doc.storageProvider,
              generatedAt: doc.generatedAt.toISOString(),
            }))}
          />
        </div>
      </div>

      {/* ── Actions ── */}
      {!isTerminal && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Quản lý trạng thái & Chữ ký</h3>
            <div className="space-y-6">
              <ContractStatusActions
                contractId={contract.id}
                currentStatus={contract.status}
                allowedTransitions={allowedTransitions}
              />
              {["SENT_TO_CUSTOMER", "SIGNED_BY_CUSTOMER"].includes(contract.status) && (
                <div className="pt-6 border-t border-gray-100">
                  <SigningLinkGenerator
                    contractId={contract.id}
                    currentStatus={contract.status}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Financial Actions Area (Invoices, Shipping, Payments) */}
          {contract.order && ["ACTIVE", "SHIPPING_LOGISTICS", "TAX_SETTLEMENT", "ACCOUNTING_FINAL"].includes(contract.status) && (
            <ContractFinancialActions
              orderId={contract.order.id}
              totalAmount={contract.order.totalAmount}
              paymentStatus={contract.order.paymentStatus}
              hasInvoices={contract.order.invoices.length > 0}
              hasDeliveryNotes={contract.order.deliveryNotes.length > 0}
            />
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex justify-between items-center">
        <Link href="/admin/contracts" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Danh sách hợp đồng</Link>
        {contract.order && (
          <Link href={`/admin/orders/${contract.order.id}`} className="text-sm text-purple-500 hover:text-purple-700 flex items-center gap-1 transition-colors">
            <ShoppingCart size={14} /> Xem đơn hàng gốc
          </Link>
        )}
      </div>
    </div>
  );
}
