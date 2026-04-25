export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import {
  Package,
  Users,
  FileText,
  ShoppingCart,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  const [productCount, customerCount, quoteCount, orderCount, recentQuotes] =
    await Promise.all([
      prisma.productRecord.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.quoteRequest.count(),
      prisma.order.count(),
      prisma.quoteRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return { productCount, customerCount, quoteCount, orderCount, recentQuotes };
}

export default async function AdminDashboardPage() {
  const { productCount, customerCount, quoteCount, orderCount, recentQuotes } =
    await getDashboardData();

  const kpis = [
    {
      label: "Sản phẩm",
      value: productCount,
      icon: Package,
      color: "bg-green-500",
      href: "/admin/products",
    },
    {
      label: "Khách hàng",
      value: customerCount,
      icon: Users,
      color: "bg-blue-500",
      href: "/admin/customers",
    },
    {
      label: "Yêu cầu báo giá",
      value: quoteCount,
      icon: FileText,
      color: "bg-orange-500",
      href: "/admin/quotes",
    },
    {
      label: "Đơn hàng",
      value: orderCount,
      icon: ShoppingCart,
      color: "bg-purple-500",
      href: "/admin/orders",
    },
  ];

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

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">
            Tổng quan
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Chào mừng trở lại! Đây là tổng quan hệ thống GreenPeat.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
          <TrendingUp size={16} />
          <span className="font-medium">Hoạt động</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-11 h-11 rounded-xl ${kpi.color} flex items-center justify-center`}
              >
                <kpi.icon size={22} className="text-white" />
              </div>
              <ArrowUpRight
                size={18}
                className="text-gray-300 group-hover:text-gray-500 transition-colors"
              />
            </div>
            <div className="text-3xl font-extrabold text-gray-800 mb-0.5">
              {kpi.value}
            </div>
            <div className="text-sm text-gray-500">{kpi.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Quotes */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-green-500" />
            Yêu cầu báo giá gần đây
          </h3>
          <Link
            href="/admin/quotes"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Xem tất cả →
          </Link>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400">
            Chưa có yêu cầu báo giá nào.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentQuotes.map((q) => (
              <div
                key={q.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <FileText size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">
                      {q.rfqCode}
                    </div>
                    <div className="text-xs text-gray-400">
                      {q.contactName} — {q.companyName || "Cá nhân"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      statusColors[q.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {statusLabels[q.status] || q.status}
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {new Date(q.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Thêm sản phẩm",
            href: "/admin/products",
            icon: Package,
            color: "text-green-600 bg-green-50 hover:bg-green-100",
          },
          {
            label: "Thêm khách hàng",
            href: "/admin/customers",
            icon: Users,
            color: "text-blue-600 bg-blue-50 hover:bg-blue-100",
          },
          {
            label: "Xem báo giá",
            href: "/admin/quotes",
            icon: FileText,
            color: "text-orange-600 bg-orange-50 hover:bg-orange-100",
          },
          {
            label: "Trang chủ",
            href: "/",
            icon: TrendingUp,
            color: "text-purple-600 bg-purple-50 hover:bg-purple-100",
          },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-center gap-3 p-4 rounded-xl ${action.color} transition-colors`}
          >
            <action.icon size={20} />
            <span className="text-sm font-semibold">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
