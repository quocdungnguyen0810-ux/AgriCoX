export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  FileCheck,
  Clock,
  User,
  Building2,
  ExternalLink,
  Search,
  ReceiptText,
  ShoppingCart,
  FileText,
} from "lucide-react";
import { getContractStatusLabel, getContractStatusBadge } from "@/lib/contract-status";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + " ₫";
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

export default async function AdminContractsPage() {
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { companyName: true, name: true } },
      order: { select: { id: true, orderCode: true } },
      quote: { select: { id: true, quoteCode: true } },
      rfq: { select: { id: true, rfqCode: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-extrabold text-gray-800">Hợp đồng</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã hợp đồng..."
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats (Simple version for now) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tổng số", value: contracts.length, color: "text-gray-800" },
          { label: "Đang ký", value: contracts.filter(c => ["SENT_TO_CUSTOMER", "SIGNED_BY_CUSTOMER", "SIGNED_BY_GREENPEAT"].includes(c.status)).length, color: "text-blue-600" },
          { label: "Đang hiệu lực", value: contracts.filter(c => c.status === "ACTIVE").length, color: "text-emerald-600" },
          { label: "Đã hủy", value: contracts.filter(c => c.status === "CANCELLED").length, color: "text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Contract List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {contracts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileCheck size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium">Chưa có hợp đồng nào.</p>
            <p className="text-sm mt-1">Hãy tạo hợp đồng từ danh sách <Link href="/admin/orders" className="text-green-600 hover:underline">Đơn hàng</Link>.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Mã hợp đồng</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Khách hàng</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Liên kết</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Giá trị</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Ngày ký</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Hiệu lực</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contracts.map((c) => {
                  const customerName = c.customer.companyName || c.customer.name;
                  
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                            <FileCheck size={13} className="text-green-600" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{c.contractCode}</div>
                            <div className="text-xs text-gray-400 font-mono italic">
                              GP-CT-{new Date(c.createdAt).getFullYear()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-medium text-gray-700 truncate max-w-[180px]" title={customerName}>
                            {customerName}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            {c.customer.companyName ? (
                              <Building2 size={10} />
                            ) : (
                              <User size={10} />
                            )}
                            {c.customer.companyName ? "Doanh nghiệp" : "Cá nhân"}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {c.order && (
                            <Link href={`/admin/orders`} className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 hover:bg-purple-100">
                              <ShoppingCart size={10} /> {c.order.orderCode}
                            </Link>
                          )}
                          {c.quote && (
                            <Link href={`/admin/quotes?tab=quotes`} className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100">
                              <ReceiptText size={10} /> {c.quote.quoteCode}
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getContractStatusBadge(c.status)}`}>
                          {getContractStatusLabel(c.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-800">
                        {formatVND(c.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-500">
                        {formatDate(c.contractDate)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="text-xs text-gray-600">
                          {formatDate(c.effectiveDate)}
                          <div className="text-[10px] text-gray-400">đến {formatDate(c.expiryDate)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/contracts/${c.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs font-semibold transition-colors"
                        >
                          <ExternalLink size={12} />
                          Xem
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

      {/* TODO Roadmap */}
      {/* TODO(Phase 5B.6): Add contract content editor */}
      {/* TODO(Phase 6A): Preview and Download PDF */}
      {/* TODO(Phase 6B): Upload contract folder/files to Google Drive */}
    </div>
  );
}
