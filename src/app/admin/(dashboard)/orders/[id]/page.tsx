export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  ArrowLeft,
  ShoppingCart,
  FileText,
  User,
  Building2,
  Phone,
  Mail,
  Clock,
  Hash,
  Package,
  TrendingUp,
  CreditCard,
  Truck,
} from "lucide-react";
import { orderStatusLabels, orderStatusColors, paymentStatusLabels, paymentStatusColors, fulfillmentStatusLabels, isTerminalOrderStatus } from "@/lib/order-status";
import { OrderActions } from "../OrderActions";

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let order;
  try {
    order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        assignee: { select: { name: true, email: true } },
        items: true,
        quote: {
          include: {
            rfq: { select: { id: true, rfqCode: true } },
          },
        },
        statusLogs: { orderBy: { changedAt: "asc" } },
      },
    });
  } catch {
    // Malformed ID (e.g. not a valid CUID) causes PrismaClientValidationError.
    // Treat as not found — do not expose raw DB errors to the UI.
    notFound();
  }

  if (!order) notFound();

  const isTerminal = isTerminalOrderStatus(order.status);

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
              <ShoppingCart size={22} className="text-purple-500" />
              {order.orderCode}
            </h2>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Clock size={11} /> Tạo: {new Date(order.createdAt).toLocaleString("vi-VN")}
              </span>
              <span className="flex items-center gap-1">
                <Hash size={11} /> {order.locale.toUpperCase()} · {order.currency}
              </span>
              {/* Source Quote link */}
              {order.quote && (
                <Link
                  href={`/admin/quotes/${order.quote.id}`}
                  className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700"
                >
                  <FileText size={11} /> Từ {order.quote.quoteCode}
                </Link>
              )}
              {/* Source RFQ link */}
              {order.quote?.rfq && (
                <span className="flex items-center gap-1">
                  <Hash size={11} /> RFQ: {order.quote.rfq.rfqCode}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${orderStatusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
            {orderStatusLabels[order.status] || order.status}
          </span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${paymentStatusColors[order.paymentStatus] || "bg-gray-100 text-gray-500"}`}>
            {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
          </span>
          {isTerminal && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Kết thúc</span>
          )}
        </div>
      </div>

      {/* ── Customer info ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wide">Thông tin khách hàng</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User size={14} className="text-gray-400 shrink-0" />
            {order.customer.name}
          </div>
          {order.customer.companyName && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Building2 size={14} className="text-gray-400 shrink-0" />
              {order.customer.companyName}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone size={14} className="text-gray-400 shrink-0" />
            {order.customer.phone}
          </div>
          {order.customer.email && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail size={14} className="text-gray-400 shrink-0" />
              {order.customer.email}
            </div>
          )}
          {order.deliveryAddress && (
            <div className="flex items-start gap-2 text-sm text-gray-700 md:col-span-2">
              <Truck size={14} className="text-gray-400 shrink-0 mt-0.5" />
              {order.deliveryAddress}
            </div>
          )}
        </div>
      </div>

      {/* ── Items table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Sản phẩm đơn hàng</h3>
        {order.items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Không có sản phẩm.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-gray-500 font-semibold">#</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-semibold">Sản phẩm</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-semibold">Quy cách</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-semibold">SL</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-semibold">ĐVT</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-semibold">Đơn giá</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-semibold">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/40">
                    <td className="py-3 px-2 text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-2 font-medium text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <Package size={13} className="text-gray-400 shrink-0" />
                        {item.productNameSnapshot}
                      </div>
                      {item.note && <div className="text-xs text-gray-400 italic mt-0.5">↳ {item.note}</div>}
                    </td>
                    <td className="py-3 px-2 text-gray-500 text-xs">{item.packagingSnapshot || "—"}</td>
                    <td className="py-3 px-2 text-center">{item.quantity}</td>
                    <td className="py-3 px-2 text-center text-gray-500">{item.unit || "—"}</td>
                    <td className="py-3 px-2 text-right text-gray-700">{item.unitPrice > 0 ? `${formatVND(item.unitPrice)} ₫` : "—"}</td>
                    <td className="py-3 px-2 text-right font-semibold text-gray-800">{formatVND(item.totalPrice)} ₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Totals + Terms ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Totals */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Tổng kết</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tạm tính:</span>
              <span className="font-semibold">{formatVND(order.subtotal)} ₫</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Chiết khấu:</span>
                <span className="font-semibold text-red-500">-{formatVND(order.discountAmount)} ₫</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">VAT:</span>
              <span className="font-semibold">{formatVND(order.vatAmount)} ₫</span>
            </div>
            {order.shippingFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phí vận chuyển:</span>
                <span className="font-semibold">{formatVND(order.shippingFee)} ₫</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-base font-bold text-gray-800">TỔNG CỘNG:</span>
              <span className="text-xl font-extrabold text-purple-600">{formatVND(order.totalAmount)} ₫</span>
            </div>
          </div>
        </div>

        {/* Terms + Fulfillment */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Thực hiện & Điều khoản</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1.5"><Truck size={13} /> Thực hiện:</span>
              <span className="font-semibold text-gray-700">{fulfillmentStatusLabels[order.fulfillmentStatus] || order.fulfillmentStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1.5"><CreditCard size={13} /> Thanh toán:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${paymentStatusColors[order.paymentStatus] || ""}`}>
                {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
              </span>
            </div>
            {order.paymentTerms && (
              <div>
                <span className="text-xs text-gray-400 block mb-1">Điều kiện thanh toán</span>
                <span className="text-gray-700">{order.paymentTerms}</span>
              </div>
            )}
            {order.deliveryTerms && (
              <div>
                <span className="text-xs text-gray-400 block mb-1">Điều kiện giao hàng</span>
                <span className="text-gray-700">{order.deliveryTerms}</span>
              </div>
            )}
            {order.notes && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 italic border-l-4 border-purple-300">
                {order.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status timeline ── */}
      {order.statusLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
            <TrendingUp size={14} /> Lịch sử trạng thái
          </h3>
          <div className="space-y-3">
            {order.statusLogs.map((log, idx) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${idx === order.statusLogs.length - 1 ? "bg-purple-500" : "bg-gray-300"}`} />
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
                    {log.note && <span className="ml-2 text-gray-500">— {log.note}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      {!isTerminal && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wide">Thao tác</h3>
          {/* TODO(Phase 5B): Add "Tạo hợp đồng" button here after Order is CONFIRMED */}
          {/* TODO(Phase 6A): Add "Tải PDF" button here after PDF generation is implemented */}
          <OrderActions orderId={order.id} currentStatus={order.status} />
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
