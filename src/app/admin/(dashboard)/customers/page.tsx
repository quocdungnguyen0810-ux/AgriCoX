export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  Search,
} from "lucide-react";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { orders: true, quoteRequests: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-extrabold text-gray-800">
          Quản lý khách hàng
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm khách hàng..."
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users size={20} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">
                    {customer.contactName}
                  </h3>
                  {customer.companyName && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Building2 size={12} />
                      {customer.companyName}
                    </div>
                  )}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                  customer.type === "EXPORT"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {customer.type === "EXPORT" ? "Xuất khẩu" : "Nội địa"}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400 shrink-0" />
                {customer.phone}
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  {customer.email}
                </div>
              )}
              {customer.city && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  {customer.city}
                  {customer.country !== "Việt Nam" && (
                    <span className="flex items-center gap-1 text-purple-600">
                      <Globe size={12} /> {customer.country}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
              <span>{customer._count.quoteRequests} báo giá</span>
              <span>{customer._count.orders} đơn hàng</span>
              <span className="ml-auto">
                {new Date(customer.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {customers.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Chưa có khách hàng nào.</p>
        </div>
      )}
    </div>
  );
}
