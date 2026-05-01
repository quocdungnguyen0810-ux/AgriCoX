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
  Clock,
  Hash,
  TrendingUp,
  FileStack,
} from "lucide-react";
import {
  getContractStatusLabel,
  getContractStatusBadge,
  canEditContract,
  isTerminalContractStatus,
  getAllowedContractTransitions,
} from "@/lib/contract-status";
import { ContractEditor } from "./ContractEditor";
import { ContractStatusActions } from "./ContractStatusActions";

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

export default async function ContractDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let contract;
  try {
    contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        order: { select: { id: true, orderCode: true } },
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
  } catch {
    // Malformed ID — do not expose raw Prisma errors
    notFound();
  }

  if (!contract) notFound();

  const editable = canEditContract(contract.status);
  const isTerminal = isTerminalContractStatus(contract.status);
  const allowedTransitions = getAllowedContractTransitions(contract.status as any);

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
              <span className="flex items-center gap-1">
                <Clock size={11} /> Cập nhật: {new Date(contract.updatedAt).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getContractStatusBadge(contract.status)}`}>
            {getContractStatusLabel(contract.status)}
          </span>
          <span className="px-3 py-1.5 rounded-lg text-sm font-bold text-green-700 bg-green-50 border border-green-200">
            {formatVND(contract.totalAmount)} ₫
          </span>
          {isTerminal && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Kết thúc</span>
          )}
        </div>
      </div>

      {/* ── Linked Records ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wide">Liên kết</h3>
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
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wide">Thông tin khách hàng</h3>
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

      {/* ── Editor (Dates + Terms + Content) ── */}
      <ContractEditor
        contractId={contract.id}
        editable={editable}
        initialData={{
          contractDate: contract.contractDate?.toISOString() || "",
          effectiveDate: contract.effectiveDate?.toISOString() || "",
          expiryDate: contract.expiryDate?.toISOString() || "",
          paymentTerms: contract.paymentTerms || "",
          deliveryTerms: contract.deliveryTerms || "",
          incoterm: contract.incoterm || "",
          deliveryLocation: contract.deliveryLocation || "",
          contentVi: contract.contentVi || "",
          contentEn: contract.contentEn || "",
        }}
      />

      {/* ── Status Timeline ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
          <TrendingUp size={14} /> Lịch sử trạng thái
        </h3>
        {contract.statusLogs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Chưa có lịch sử trạng thái.</p>
        ) : (
          <div className="space-y-3">
            {contract.statusLogs.map((log, idx) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${idx === contract.statusLogs.length - 1 ? "bg-green-500" : "bg-gray-300"}`} />
                  {idx < contract.statusLogs.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[16px]" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">
                      {getContractStatusLabel(log.newStatus)}
                    </span>
                    {log.oldStatus && (
                      <span className="text-xs text-gray-400">← {getContractStatusLabel(log.oldStatus)}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.changedAt).toLocaleString("vi-VN")}
                    {log.user && <span className="ml-2 text-gray-500">bởi {log.user.name}</span>}
                    {log.note && <span className="ml-2 text-gray-500">— {log.note}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Documents Placeholder ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
          <FileStack size={14} /> Tài liệu hợp đồng
        </h3>
        {contract.documents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Chưa có tài liệu nào.
          </p>
        ) : (
          <div className="space-y-2">
            {contract.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={14} className="text-gray-400" />
                  <span className="font-medium text-gray-700">{doc.fileName}</span>
                  <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">{doc.documentType}</span>
                  <span className="text-xs text-gray-400">v{doc.version}</span>
                </div>
                {doc.fileUrl ? (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
                    Tải xuống
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 italic">Chưa có file</span>
                )}
              </div>
            ))}
          </div>
        )}
        {/* TODO(Phase 6A): Generate contract PDF button */}
        {/* TODO(Phase 6B): Upload contract documents to Google Drive */}
        {/* TODO(Phase 6C): Sync contract data to Google Sheet CONTRACT_LOG */}
      </div>

      {/* ── Signatures Placeholder ── */}
      {contract.signatures.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Chữ ký</h3>
          <div className="space-y-2">
            {contract.signatures.map((sig) => (
              <div key={sig.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">{sig.signerName}</span>
                  <span className="text-xs text-gray-400 ml-2">({sig.signerRole})</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  sig.status === "SIGNED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {sig.status === "SIGNED" ? "Đã ký" : "Chờ ký"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ── Status Actions ── */}
      {!isTerminal && (
        <ContractStatusActions
          contractId={contract.id}
          currentStatus={contract.status}
          allowedTransitions={allowedTransitions}
        />
      )}
      {/* TODO(Phase 5B.8): Add signing token generation */}
      {/* TODO(Phase 5B.9): Add customer signing page */}

      {/* ── Footer Navigation ── */}
      <div className="flex justify-between items-center">
        <Link
          href="/admin/contracts"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Quay lại danh sách
        </Link>
        {contract.order && (
          <Link
            href={`/admin/orders/${contract.order.id}`}
            className="text-sm text-purple-500 hover:text-purple-700 flex items-center gap-1 transition-colors"
          >
            <ShoppingCart size={14} /> Xem đơn hàng gốc
          </Link>
        )}
      </div>
    </div>
  );
}
