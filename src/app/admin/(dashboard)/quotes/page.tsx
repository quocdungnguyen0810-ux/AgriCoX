export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  FileText,
  Clock,
  User,
  Building2,
  Phone,
  Mail,
  Search,
  ExternalLink,
  ReceiptText,
} from "lucide-react";
import { QuoteActions } from "./QuoteActions";
import { CreateQuoteButton } from "./CreateQuoteButton";
import { quoteStatusLabels, quoteStatusColors } from "@/lib/quote-status";
import { auth } from "@/lib/auth";

// ── RFQ status display ──
const rfqStatusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  QUOTED: "bg-green-100 text-green-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CONVERTED: "bg-purple-100 text-purple-700",
};

const rfqStatusLabels: Record<string, string> = {
  NEW: "Mới",
  ASSIGNED: "Đã giao",
  IN_PROGRESS: "Đang xử lý",
  QUOTED: "Đã báo giá",
  ACCEPTED: "Chấp nhận",
  REJECTED: "Từ chối",
  CONVERTED: "Đã chuyển ĐH",
};

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + " ₫";
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminQuotesPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const activeTab = tab === "quotes" ? "quotes" : "rfqs";

  const [rfqs, salesUsers, quotes, customers, session] = await Promise.all([
    prisma.rfq.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignee: { select: { id: true, name: true } },
        items: true,
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SALES", "ADMIN"] }, isActive: true },
      select: { id: true, name: true, role: true },
    }),
    prisma.quote.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        rfq: { select: { rfqCode: true, contactName: true, companyName: true } },
        customer: { select: { name: true, companyName: true } },
      },
    }),
    prisma.customer.findMany({
      select: { id: true, name: true, companyName: true },
      orderBy: { name: 'asc' }
    }),
    auth(),
  ]);

  const user = session?.user;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-extrabold text-gray-800">Báo giá</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === "rfqs" ? "Tìm mã RFQ..." : "Tìm mã báo giá..."}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent w-64"
            />
          </div>
          {activeTab === "quotes" && (
            <CreateQuoteButton customers={customers as any} userId={user?.id || ""} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Yêu cầu BG", value: rfqs.length, color: "text-gray-800" },
          { label: "Đang xử lý", value: rfqs.filter((r) => ["ASSIGNED", "IN_PROGRESS"].includes(r.status)).length, color: "text-orange-600" },
          { label: "Báo giá đang mở", value: quotes.filter((q) => ["DRAFT", "SENT", "REVISION_REQUESTED"].includes(q.status)).length, color: "text-indigo-600" },
          { label: "Đã chốt", value: quotes.filter((q) => q.status === "ACCEPTED").length, color: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <Link
          href="/admin/quotes?tab=rfqs"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "rfqs"
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText size={15} />
          Yêu cầu báo giá
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-200 text-xs font-bold text-gray-600">
            {rfqs.length}
          </span>
        </Link>
        <Link
          href="/admin/quotes?tab=quotes"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "quotes"
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ReceiptText size={15} />
          Báo giá
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-200 text-xs font-bold text-gray-600">
            {quotes.length}
          </span>
        </Link>
      </div>

      {/* ── RFQ TAB ── */}
      {activeTab === "rfqs" && (
        <div className="space-y-4">
          {rfqs.map((rfq) => {
            const items = (rfq.items || []).map((item) => ({
              productName: item.productNameSnapshot,
              quantity: item.quantity,
              specification: item.packagingSnapshot || undefined,
            }));

            return (
              <div
                key={rfq.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all"
              >
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                      <FileText size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{rfq.rfqCode}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={12} />
                        {new Date(rfq.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${rfqStatusColors[rfq.status] || "bg-gray-100 text-gray-600"}`}>
                    {rfqStatusLabels[rfq.status] || rfq.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User size={14} className="text-gray-400" />
                      {rfq.contactName}
                    </div>
                    {rfq.companyName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 size={14} className="text-gray-400" />
                        {rfq.companyName}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      {rfq.contactPhone}
                    </div>
                    {rfq.contactEmail && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        {rfq.contactEmail}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Sản phẩm yêu cầu</div>
                    <div className="space-y-1">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-gray-50">
                          <span className="text-gray-700 font-medium">{item.productName}</span>
                          <span className="text-gray-500">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {rfq.message && (
                  <div className="px-4 py-3 rounded-xl bg-gray-50 text-sm text-gray-600 italic border-l-4 border-orange-300 mb-4">
                    {rfq.message}
                  </div>
                )}

                <QuoteActions
                  quoteId={rfq.id}
                  currentStatus={rfq.status}
                  assigneeId={rfq.assignedTo}
                  assigneeName={rfq.assignee?.name}
                  salesUsers={salesUsers}
                />
              </div>
            );
          })}

          {rfqs.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Chưa có yêu cầu báo giá nào.</p>
            </div>
          )}
        </div>
      )}

      {/* ── QUOTES TAB ── */}
      {activeTab === "quotes" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {quotes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ReceiptText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Chưa có báo giá nào.</p>
              <p className="text-sm mt-2">Tạo báo giá từ tab &quot;Yêu cầu báo giá&quot;.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Mã BG</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Khách hàng</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Từ RFQ</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tổng tiền</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Hiệu lực</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cập nhật</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {quotes.map((q) => {
                    const customerName =
                      q.customer?.companyName ||
                      q.customer?.name ||
                      q.rfq?.companyName ||
                      q.rfq?.contactName ||
                      "—";

                    return (
                      <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                              <ReceiptText size={13} className="text-indigo-500" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">{q.quoteCode}</div>
                              <div className="text-xs text-gray-400">v{q.version}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{customerName}</td>
                        <td className="py-3 px-4 text-gray-500">
                          {q.rfq?.rfqCode ? (
                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {q.rfq.rfqCode}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${quoteStatusColors[q.status] || "bg-gray-100 text-gray-600"}`}>
                            {quoteStatusLabels[q.status] || q.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-800">
                          {q.totalAmount > 0 ? formatVND(q.totalAmount) : <span className="text-gray-400 font-normal">Chưa nhập</span>}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-500">
                          {formatDate(q.validUntil)}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-400 text-xs">
                          {formatDate(q.updatedAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/quotes/${q.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition-colors"
                          >
                            <ExternalLink size={12} />
                            Mở
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
