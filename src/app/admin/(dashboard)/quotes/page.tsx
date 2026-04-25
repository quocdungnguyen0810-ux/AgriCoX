export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import {
  FileText,
  Clock,
  User,
  Building2,
  Phone,
  Mail,
  Search,
} from "lucide-react";
import { QuoteActions } from "./QuoteActions";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  QUOTED: "bg-green-100 text-green-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CONVERTED: "bg-purple-100 text-purple-700",
};

const statusLabels: Record<string, string> = {
  NEW: "Mới",
  ASSIGNED: "Đã giao",
  IN_PROGRESS: "Đang xử lý",
  QUOTED: "Đã báo giá",
  ACCEPTED: "Chấp nhận",
  REJECTED: "Từ chối",
  CONVERTED: "Đã chuyển ĐH",
};

export default async function AdminQuotesPage() {
  const [quotes, salesUsers] = await Promise.all([
    prisma.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SALES", "ADMIN"] }, isActive: true },
      select: { id: true, name: true, role: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-extrabold text-gray-800">
          Yêu cầu báo giá
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm mã RFQ..."
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tổng", value: quotes.length, color: "text-gray-800" },
          {
            label: "Mới",
            value: quotes.filter((q) => q.status === "NEW").length,
            color: "text-blue-600",
          },
          {
            label: "Đang xử lý",
            value: quotes.filter((q) =>
              ["ASSIGNED", "IN_PROGRESS"].includes(q.status)
            ).length,
            color: "text-orange-600",
          },
          {
            label: "Đã báo giá",
            value: quotes.filter((q) => q.status === "QUOTED").length,
            color: "text-green-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-100 p-4 text-center"
          >
            <div className={`text-2xl font-extrabold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quote list */}
      <div className="space-y-4">
        {quotes.map((q) => {
          let items: { productName: string; quantity: number; specification?: string }[] = [];
          try {
            items = JSON.parse(q.items);
          } catch {
            items = [];
          }

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all"
            >
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                    <FileText size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {q.rfqCode}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock size={12} />
                      {new Date(q.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    statusColors[q.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {statusLabels[q.status] || q.status}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} className="text-gray-400" />
                    {q.contactName}
                  </div>
                  {q.companyName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 size={14} className="text-gray-400" />
                      {q.companyName}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    {q.contactPhone}
                  </div>
                  {q.contactEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      {q.contactEmail}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Sản phẩm yêu cầu
                  </div>
                  <div className="space-y-1">
                    {items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-gray-50"
                      >
                        <span className="text-gray-700 font-medium">
                          {item.productName}
                        </span>
                        <span className="text-gray-500">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {q.message && (
                <div className="px-4 py-3 rounded-xl bg-gray-50 text-sm text-gray-600 italic border-l-4 border-orange-300 mb-4">
                  {q.message}
                </div>
              )}

              {/* Actions */}
              <QuoteActions
                quoteId={q.id}
                currentStatus={q.status}
                assigneeId={q.assignedTo}
                assigneeName={q.assignee?.name}
                salesUsers={salesUsers}
              />
            </div>
          );
        })}

        {quotes.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Chưa có yêu cầu báo giá nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}
