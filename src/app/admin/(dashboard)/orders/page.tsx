export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  ShoppingCart,
  Clock,
  User,
  Building2,
  Package,
  Search,
  TrendingUp,
  FileText,
  FileCheck,
} from "lucide-react";
import { OrderActions } from "./OrderActions";
import { CreateOrderButton } from "./CreateOrderButton";
import { orderStatusLabels, orderStatusColors, paymentStatusLabels, paymentStatusColors } from "@/lib/order-status";
import { auth } from "@/lib/auth";



export default async function AdminOrdersPage() {
  const [orders, customers, session] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { companyName: true, name: true } },
        assignee: { select: { name: true } },
        items: true,
        quote: { select: { id: true, quoteCode: true } },
        contract: { select: { id: true, contractCode: true } },
        statusLogs: {
          orderBy: { changedAt: "desc" },
          take: 3,
        },
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
          <CreateOrderButton customers={customers as any} userId={user?.id || ""} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tổng đơn", value: orders.length, color: "text-gray-800" },
          {
            label: "Đơn mới",
            value: orders.filter((o) =>
              ["NEW", "CONFIRMED"].includes(o.status)
            ).length,
            color: "text-blue-600",
          },
          {
            label: "Đang xử lý",
            value: orders.filter((o) =>
              ["PRODUCING", "QUALITY_CHECK", "PACKING", "SHIPPED"].includes(o.status)
            ).length,
            color: "text-indigo-600",
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
                    <Link href={`/admin/orders/${order.id}`} className="hover:text-green-700 transition-colors">
                      {order.orderCode}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={12} />
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </div>
                  {/* Source links */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {order.quote && (
                      <Link
                        href={`/admin/quotes/${order.quote.id}`}
                        className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 flex items-center gap-1"
                      >
                        <FileText size={10} />
                        BG: {order.quote.quoteCode}
                      </Link>
                    )}
                    {order.contract && (
                      <Link
                        href={`/admin/contracts`}
                        className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 hover:bg-green-100 flex items-center gap-1"
                      >
                        <FileCheck size={10} />
                        HĐ: {order.contract.contractCode}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    orderStatusColors[order.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {orderStatusLabels[order.status] || order.status}
                </span>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium ${
                    paymentStatusColors[order.paymentStatus] || "bg-gray-100 text-gray-500"
                  }`}
                >
                  {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                </span>
              </div>
            </div>


            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={14} className="text-gray-400" />
                  {order.customer.name}
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
                        {item.productNameSnapshot}
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
                      <span className="font-medium">{orderStatusLabels[log.newStatus] || log.newStatus}</span>
                      <span>•</span>
                      <span>{new Date(log.changedAt).toLocaleString("vi-VN")}</span>
                      {log.note && <span className="text-gray-400">— {log.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Actions */}
            <OrderActions
              orderId={order.id}
              currentStatus={order.status}
              contractId={order.contract?.id}
            />
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
