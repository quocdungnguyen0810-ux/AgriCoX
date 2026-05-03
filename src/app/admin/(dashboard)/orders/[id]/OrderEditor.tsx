"use client";

import { useState, useTransition, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  ShoppingCart,
  User,
  Building2,
  Phone,
  Mail,
  Clock,
  Hash,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  BadgeInfo,
  CreditCard,
  Truck,
  DownloadCloud,
  ArrowRightCircle,
  XCircle,
  FilePlus2,
  Plus,
  Trash2,
  Search,
  Package,
} from "lucide-react";
import { updateOrderItems, updateOrderDetails, updateOrderStatus, addOrderItem, removeOrderItem } from "@/app/admin/actions/order";
import { searchProducts } from "@/app/admin/actions/products";
import { createContractFromOrder } from "@/app/admin/actions/contract";
import { orderStatusLabels, orderStatusColors, orderStatusTransitions, paymentStatusLabels, paymentStatusColors, fulfillmentStatusLabels, isTerminalOrderStatus } from "@/lib/order-status";
import { calculateQuote, formatVND } from "@/lib/quote-calculation";

// ── Types ──────────────────────────────────────────────

interface OrderItem {
  id: string;
  productNameSnapshot: string;
  packagingSnapshot: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  note: string;
}

interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
}

interface OrderData {
  id: string;
  orderCode: string;
  status: string;
  locale: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  paymentTerms: string;
  deliveryTerms: string;
  deliveryAddress: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  contractId?: string;
  customer: {
    name: string;
    companyName: string | null;
    phone: string;
    email: string | null;
  };
  quote?: {
    id: string;
    quoteCode: string;
  } | null;
  items: OrderItem[];
}

// ── Component ──────────────────────────────────────────

export default function OrderEditor({ order }: { order: OrderData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [discountAmount, setDiscountAmount] = useState(order.discountAmount);
  const [shippingFee, setShippingFee] = useState(order.shippingFee);
  const [paymentTerms, setPaymentTerms] = useState(order.paymentTerms || "");
  const [deliveryTerms, setDeliveryTerms] = useState(order.deliveryTerms || "");
  const [deliveryAddress, setDeliveryAddress] = useState(order.deliveryAddress || "");
  const [notes, setNotes] = useState(order.notes || "");
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Editable only if NEW or CONFIRMED
  const isEditable = ["NEW", "CONFIRMED"].includes(order.status);
  const isTerminal = isTerminalOrderStatus(order.status);
  const transitions = orderStatusTransitions[order.status] || [];

  // Estimate VAT Rate from initial data (default 8%)
  const initialVatRate = order.subtotal > order.discountAmount 
    ? order.vatAmount / (order.subtotal - order.discountAmount)
    : 0.08;
  const [vatRate, setVatRate] = useState(initialVatRate);

  // Live preview calculation
  const calc = useMemo(() => {
    return calculateQuote({
      items: items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountRate: 0 })),
      discountAmount,
      vatRate,
      shippingFee,
    });
  }, [items, discountAmount, vatRate, shippingFee]);

  const updateItem = (index: number, field: keyof OrderItem, value: number | string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  // Save items + details
  const handleSave = () => {
    setSaveMsg(null);
    startTransition(async () => {
      // 1. Update items
      const itemsResult = await updateOrderItems(
        order.id,
        items.map((item) => ({
          id: item.id,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          note: item.note || undefined,
        }))
      );
      if (!itemsResult.success) {
        setSaveMsg({ type: "error", text: itemsResult.error.message });
        return;
      }

      // 2. Update details
      const detailsResult = await updateOrderDetails(order.id, {
        vatRate,
        shippingFee,
        discountAmount,
        paymentTerms,
        deliveryTerms,
        deliveryAddress,
        notes,
      });
      if (!detailsResult.success) {
        setSaveMsg({ type: "error", text: detailsResult.error.message });
        return;
      }

      setSaveMsg({ type: "success", text: "Đã lưu đơn hàng thành công!" });
      router.refresh();
    });
  };

  // Status transition
  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "CANCELLED") {
      if (!confirm("Xác nhận hủy đơn hàng này?")) return;
    }
    setSaveMsg(null);
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus);
      if (!result.success) {
        setSaveMsg({ type: "error", text: result.error.message });
        return;
      }
      router.refresh();
    });
  };

  // Create Contract
  const handleCreateContract = () => {
    setSaveMsg(null);
    startTransition(async () => {
      const result = await createContractFromOrder(order.id, "");
      if (result.success) {
        router.push(`/admin/contracts/${result.data?.contractId}`);
      } else {
        setSaveMsg({ type: "error", text: result.error.message });
      }
    });
  };

  // Add Item logic
  const [productSearch, setProductSearch] = useState("");
  const [foundProducts, setFoundProducts] = useState<ProductSearchResult[]>([]);
  const [customItem, setCustomItem] = useState({ name: "", quantity: 1, unitPrice: 0, unit: "pcs" });

  const handleSearch = async (q: string) => {
    setProductSearch(q);
    if (q.length > 1) {
      const res = await searchProducts(q);
      if (res.success) setFoundProducts(res.data || []);
    } else {
      setFoundProducts([]);
    }
  };

  const handleAddItem = (productId: string) => {
    startTransition(async () => {
      const res = await addOrderItem(order.id, productId);
      if (res.success) {
        setProductSearch("");
        setFoundProducts([]);
        router.refresh(); // This will update the 'order' prop and thus 'items' state if we use useEffect
      }
    });
  };

  const handleAddCustomItem = () => {
    if (!customItem.name.trim()) {
      setSaveMsg({ type: "error", text: "Vui lòng nhập tên sản phẩm tùy chỉnh" });
      return;
    }

    startTransition(async () => {
      const res = await addOrderItem(order.id, undefined, {
        name: customItem.name.trim(),
        quantity: Math.max(1, customItem.quantity || 1),
        unitPrice: Math.max(0, customItem.unitPrice || 0),
        unit: customItem.unit.trim() || "pcs",
      });
      if (res.success) {
        setCustomItem({ name: "", quantity: 1, unitPrice: 0, unit: "pcs" });
        setSaveMsg(null);
        router.refresh();
      } else {
        setSaveMsg({ type: "error", text: res.error.message });
      }
    });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!confirm("Xác nhận xóa sản phẩm này khỏi đơn hàng?")) return;
    startTransition(async () => {
      const res = await removeOrderItem(itemId);
      if (res.success) {
        router.refresh();
      }
    });
  };

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
                <RefreshCw size={11} /> Cập nhật: {new Date(order.updatedAt).toLocaleString("vi-VN")}
              </span>
              {order.quote && (
                <span className="flex items-center gap-1">
                  <Hash size={11} /> Từ {order.quote.quoteCode}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Globe size={11} /> {order.locale.toUpperCase()} · {order.currency}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${orderStatusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
            {orderStatusLabels[order.status] || order.status}
          </span>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${paymentStatusColors[order.paymentStatus] || "bg-gray-100"}`}>
            {paymentStatusLabels[order.paymentStatus]}
          </span>
          {isTerminal && (
            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
              <BadgeInfo size={12} /> Kết thúc
            </span>
          )}
          <a
            href={`/api/orders/${order.id}/pdf`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors"
          >
            <DownloadCloud size={14} /> Tải PDF Đơn Hàng
          </a>
        </div>
      </div>

      {/* ── Save / error message ── */}
      {saveMsg && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
            saveMsg.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {saveMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {saveMsg.text}
        </div>
      )}

      {/* ── Customer info ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wide">Thông tin khách hàng</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User size={14} className="text-gray-400 shrink-0" /> {order.customer.name}
          </div>
          {order.customer.companyName && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Building2 size={14} className="text-gray-400 shrink-0" /> {order.customer.companyName}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone size={14} className="text-gray-400 shrink-0" /> {order.customer.phone}
          </div>
          {order.customer.email && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail size={14} className="text-gray-400 shrink-0" /> {order.customer.email}
            </div>
          )}
        </div>
      </div>

      {/* ── Items table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Sản phẩm chốt đơn</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-gray-500 font-semibold">#</th>
                <th className="text-left py-2 px-2 text-gray-500 font-semibold">Sản phẩm</th>
                <th className="text-left py-2 px-2 text-gray-500 font-semibold">Quy cách</th>
                <th className="text-center py-2 px-2 text-gray-500 font-semibold">SL</th>
                <th className="text-center py-2 px-2 text-gray-500 font-semibold">ĐVT</th>
                <th className="text-right py-2 px-2 text-gray-500 font-semibold">Đơn giá (₫)</th>
                <th className="text-right py-2 px-2 text-gray-500 font-semibold">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <Fragment key={item.id}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50/40 group">
                    <td className="py-3 px-2 text-gray-400 align-top">
                      {isEditable ? (
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 rounded bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-800 align-top">{item.productNameSnapshot}</td>
                    <td className="py-3 px-2 text-gray-500 text-xs align-top">{item.packagingSnapshot || "—"}</td>

                    {/* Quantity */}
                    <td className="py-3 px-2 text-center align-top">
                      {isEditable ? (
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="w-16 text-center border border-gray-200 rounded-lg py-1 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        />
                      ) : (
                        <span>{item.quantity}</span>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-2 text-center text-gray-500 align-top">{item.unit}</td>

                    {/* Unit price */}
                    <td className="py-3 px-2 text-right align-top">
                      {isEditable ? (
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-32 text-right border border-gray-200 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        />
                      ) : (
                        <span>{formatVND(item.unitPrice)}</span>
                      )}
                    </td>

                    {/* Line total */}
                    <td className="py-3 px-2 text-right font-semibold text-gray-800 align-top">
                      {formatVND(calc.itemTotals[idx] ?? 0)} ₫
                    </td>
                  </tr>

                  {/* Note row */}
                  {(isEditable || item.note) && (
                    <tr key={`note-${item.id}`} className="border-b border-gray-50 bg-gray-50/30">
                      <td className="py-1 px-2" />
                      <td colSpan={6} className="py-1.5 px-2 pb-2">
                        {isEditable ? (
                          <input
                            type="text"
                            value={item.note}
                            onChange={(e) => updateItem(idx, "note", e.target.value)}
                            placeholder="Ghi chú cho sản phẩm..."
                            className="w-full text-xs border border-gray-200 rounded-lg py-1 px-2 text-gray-600 focus:ring-1 focus:ring-purple-300 focus:border-transparent bg-white"
                          />
                        ) : (
                          item.note && <span className="text-xs text-gray-400 italic">↳ {item.note}</span>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}

              {isEditable && (
                <tr>
                  <td colSpan={7} className="py-4">
                    <div className="relative space-y-3">
                      <div className="flex items-center gap-2 p-1 pl-3 bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-purple-400 transition-all">
                        <Search size={14} className="text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Thêm sản phẩm mới (Nhập tên hoặc SKU)..."
                          value={productSearch}
                          onChange={e => handleSearch(e.target.value)}
                          className="flex-1 bg-transparent border-none py-2 text-sm focus:outline-none"
                        />
                        <div className="p-1 px-3 bg-white rounded-lg text-[10px] font-bold text-gray-400 border border-gray-100 uppercase tracking-widest">Tìm nhanh</div>
                      </div>

                      {foundProducts.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl p-2 max-h-60 overflow-y-auto">
                          {foundProducts.map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleAddItem(p.id)}
                              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                  <Package size={14} />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-gray-800">{p.name}</div>
                                  <div className="text-[10px] text-gray-400">{p.sku}</div>
                                </div>
                              </div>
                              <Plus size={14} className="text-purple-400" />
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_88px_88px_132px_auto] gap-2">
                        <input
                          type="text"
                          placeholder="Sản phẩm tùy chỉnh..."
                          value={customItem.name}
                          onChange={(e) => setCustomItem((prev) => ({ ...prev, name: e.target.value }))}
                          className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                        />
                        <input
                          type="number"
                          min={1}
                          value={customItem.quantity}
                          onChange={(e) => setCustomItem((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                          className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={customItem.unit}
                          onChange={(e) => setCustomItem((prev) => ({ ...prev, unit: e.target.value }))}
                          className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                        />
                        <input
                          type="number"
                          min={0}
                          value={customItem.unitPrice}
                          onChange={(e) => setCustomItem((prev) => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                          className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                        />
                        <button
                          onClick={handleAddCustomItem}
                          disabled={isPending}
                          className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 disabled:opacity-50"
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Totals + Terms ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Tổng kết tài chính</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tạm tính:</span>
              <span className="font-semibold">{formatVND(calc.subtotal)} ₫</span>
            </div>

            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Chiết khấu đơn hàng:</span>
              {isEditable ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right border border-gray-200 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-purple-400"
                  />
                  <span className="text-xs text-gray-400">₫</span>
                </div>
              ) : (
                <span className="font-semibold text-red-500">
                  {calc.discountAmount > 0 ? `-${formatVND(calc.discountAmount)} ₫` : "—"}
                </span>
              )}
            </div>

            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Thuế VAT:</span>
              <div className="flex items-center gap-2">
                {isEditable ? (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={Math.round(vatRate * 100)}
                    onChange={(e) => setVatRate((parseFloat(e.target.value) || 0) / 100)}
                    className="w-16 text-center border border-gray-200 rounded-lg py-1 text-sm focus:ring-2 focus:ring-purple-400"
                  />
                ) : (
                  <span className="text-gray-600">{Math.round(vatRate * 100)}%</span>
                )}
                <span className="font-semibold">{formatVND(calc.vatAmount)} ₫</span>
              </div>
            </div>

            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Phí vận chuyển:</span>
              {isEditable ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={shippingFee}
                    onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right border border-gray-200 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-purple-400"
                  />
                  <span className="text-xs text-gray-400">₫</span>
                </div>
              ) : (
                <span className="font-semibold">{formatVND(calc.shippingFee)} ₫</span>
              )}
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-base font-bold text-gray-800">TỔNG CỘNG CHỐT:</span>
              <span className="text-xl font-extrabold text-purple-600">{formatVND(calc.totalAmount)} ₫</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Thực hiện & Điều khoản</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Địa chỉ giao hàng</label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                disabled={!isEditable}
                rows={2}
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-purple-300 resize-none disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Điều khoản thanh toán</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                disabled={!isEditable}
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Điều khoản giao hàng</label>
              <input
                type="text"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                disabled={!isEditable}
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Ghi chú nội bộ</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isEditable}
                rows={2}
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-purple-300 resize-none disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Save Button */}
          {isEditable && (
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu thay đổi chốt giá
            </button>
          )}

          {/* Create Contract */}
          {!order.contractId && ["NEW", "CONFIRMED"].includes(order.status) && (
            <button
              onClick={handleCreateContract}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <FilePlus2 size={16} />}
              Tạo Hợp Đồng
            </button>
          )}

          {/* Status Transitions */}
          {!isTerminal && transitions.map((t) => (
            <button
              key={t.status}
              onClick={() => handleStatusChange(t.status)}
              disabled={isPending}
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm ${t.color}`}
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRightCircle size={16} />}
              {t.label}
            </button>
          ))}
        </div>

        <Link
          href="/admin/orders"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Quay lại danh sách
        </Link>
      </div>
    </div>
  );
}
