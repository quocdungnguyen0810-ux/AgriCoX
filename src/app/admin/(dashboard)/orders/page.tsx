export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import {
  ShoppingCart,
  Clock,
  User,
  Building2,
  Package,
  Search,
  TrendingUp,
} from "lucide-react";
import { OrderActions } from "./OrderActions";

const statusColors: Record<string, string> = {
  REQUEST_RECEIVED: "bg-blue-100 text-blue-700",
  QUOTATION_SENT: "bg-yellow-100 text-yellow-700",
  PO_RECEIVED: "bg-orange-100 text-orange-700",
  CONTRACT_SIGNED: "bg-green-100 text-green-700",
  PRODUCTION: "bg-indigo-100 text-indigo-700",
  QC_INSPECTION: "bg-purple-100 text-purple-700",
  PACKING: "bg-pink-100 text-pink-700",
  SHIPPING: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-green-200 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  REQUEST_RECEIVED: "Tiếp nhận",
  QUOTATION_SENT: "Đã gửi báo giá",
  PO_RECEIVED: "Nhận PO",
  CONTRACT_SIGNED: "Đã ký HĐ",
  PRODUCTION: "Sản xuất",
  QC_INSPECTION: "Kiểm tra QC",
  PACKING: "Đóng gói",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { companyName: true, contactName: true } },
      assignee: { select: { name: true } },
      items: true,
      statusLogs: {
        orderBy: { changedAt: "desc" },
        take: 3,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-extrabold text-gray-800">
          Quản lý đơn hàng
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm mã đơn hàng..."
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tổng đơn", value: orders.length, color: "text-gray-800" },
          {
            label: "Đang xử lý",
            value: orders.filter((o) =>
              ["REQUEST_RECEIVED", "QUOTATION_SENT", "PO_RECEIVED", "CONTRACT_SIGNED"].includes(o.status)
            ).length,
            color: "text-orange-600",
          },
          {
            label: "Sản xuất/Giao",
            value: orders.filter((o) =>
              ["PRODUCTION", "QC_INSPECTION", "PACKING", "SHIPPING"].includes(o.status)
            ).length,
            color: "text-blue-600",
          },
          {
            label: "Hoàn thành",
            value: orders.filter((o) =>
              ["DELIVERED", "COMPLETED"].includes(o.status)
            ).length,
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

      {/* Order list */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all"
          >
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                  <ShoppingCart size={20} className="text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {order.orderCode}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={12} />
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>
              <span
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  statusColors[order.status] || "bg-gray-100 text-gray-600"
                }`}
              >
                {statusLabels[order.status] || order.status}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={14} className="text-gray-400" />
                  {order.customer.contactName}
                </div>
                {order.customer.companyName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 size={14} className="text-gray-400" />
                    {order.customer.companyName}
                  </div>
                )}
                {order.assignee && (
                  <div className="text-xs text-gray-400">
                    Sales: <span className="font-medium text-gray-600">{order.assignee.name}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
                  Sản phẩm
                </div>
                <div className="space-y-1">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-gray-50"
                    >
                      <span className="text-gray-700 font-medium flex items-center gap-1.5">
                        <Package size={12} className="text-gray-400" />
                        {item.productName}
                      </span>
                      <span className="text-gray-500">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status timeline */}
            {order.statusLogs.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1">
                  <TrendingUp size={12} /> Lịch sử trạng thái
                </div>
                <div className="space-y-1">
                  {order.statusLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="font-medium">{statusLabels[log.toStatus] || log.toStatus}</span>
                      <span>•</span>
                      <span>{new Date(log.changedAt).toLocaleString("vi-VN")}</span>
                      {log.note && <span className="text-gray-400">— {log.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <OrderActions orderId={order.id} currentStatus={order.status} />
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium">Chưa có đơn hàng nào.</p>
            <p className="text-sm mt-1">Đơn hàng sẽ xuất hiện khi bạn chuyển đổi từ báo giá.</p>
          </div>
        )}
      </div>
    </div>
  );
}
