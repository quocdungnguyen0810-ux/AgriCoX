"use client";

import { useState, useTransition, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Send,
  FileText,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Hash,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  BadgeInfo,
  ExternalLink,
  DownloadCloud,
  Plus,
  Trash2,
  Search,
  Package,
  ShoppingCart,
} from "lucide-react";
import { updateQuoteItems, updateQuoteDetails, updateQuoteStatus, addQuoteItem, removeQuoteItem } from "@/app/admin/actions/quote";
import { createOrderFromQuote } from "@/app/admin/actions/order";
import { searchProducts } from "@/app/admin/actions/products";
import { quoteStatusLabels, quoteStatusColors, quoteStatusTransitions } from "@/lib/quote-status";
import { calculateQuote, formatVND } from "@/lib/quote-calculation";


// ── Types ──────────────────────────────────────────────

interface QuoteItem {
  id: string;
  productNameSnapshot: string;
  packagingSnapshot: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountRate: number;
  totalPrice: number;
  note: string;
}

interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
}

interface QuoteData {
  id: string;
  quoteCode: string;
  status: string;
  version: number;
  locale: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentTerms: string;
  deliveryTerms: string;
  validUntil: string;
  commercialNotes: string;
  technicalNotes: string;
  createdAt: string;
  updatedAt: string;
  creatorName: string;
  rfq: {
    rfqCode: string;
    contactName: string;
    companyName: string;
    contactPhone: string;
    contactEmail: string;
    deliveryAddress: string;
    message: string;
  } | null;
  items: QuoteItem[];
}

// Terminal statuses: read-only, no editing or transitions
const TERMINAL_STATUSES = ["REJECTED", "EXPIRED", "CONVERTED"];

// ── Component ──────────────────────────────────────────

export default function QuoteEditor({ quote }: { quote: QuoteData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<QuoteItem[]>(quote.items);
  const [discountAmount, setDiscountAmount] = useState(quote.discountAmount);
  const [vatRate, setVatRate] = useState(quote.vatRate);
  const [shippingFee, setShippingFee] = useState(quote.shippingFee);
  const [paymentTerms, setPaymentTerms] = useState(quote.paymentTerms);
  const [deliveryTerms, setDeliveryTerms] = useState(quote.deliveryTerms);
  const [validUntil, setValidUntil] = useState(quote.validUntil);
  const [commercialNotes, setCommercialNotes] = useState(quote.commercialNotes);
  const [technicalNotes, setTechnicalNotes] = useState(quote.technicalNotes);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  // Order conversion state
  const [orderResult, setOrderResult] = useState<{ orderId: string; orderCode: string } | null>(null);
  const [isConverting, startConverting] = useTransition();

  const isEditable = quote.status === "DRAFT" || quote.status === "REVISION_REQUESTED";
  const isTerminal = TERMINAL_STATUSES.includes(quote.status);
  const transitions = quoteStatusTransitions[quote.status] || [];


  // Live preview calculation (client-side only — never used as saved truth)
  const calc = useMemo(() => {
    return calculateQuote({
      items: items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountRate: i.discountRate })),
      discountAmount,
      vatRate,
      shippingFee,
    });
  }, [items, discountAmount, vatRate, shippingFee]);

  const updateItem = (index: number, field: keyof QuoteItem, value: number | string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  // Save items + details via server actions
  const handleSave = () => {
    setSaveMsg(null);
    startTransition(async () => {
      const itemsResult = await updateQuoteItems(
        quote.id,
        items.map((item) => ({
          id: item.id,
          unitPrice: item.unitPrice,
          discountRate: item.discountRate,
          quantity: item.quantity,
          note: item.note || undefined,
        }))
      );
      if (!itemsResult.success) {
        setSaveMsg({ type: "error", text: itemsResult.error.message });
        return;
      }
      const detailsResult = await updateQuoteDetails(quote.id, {
        vatRate,
        shippingFee,
        discountAmount,
        paymentTerms,
        deliveryTerms,
        validUntil: validUntil || undefined,
        commercialNotes,
        technicalNotes,
      });
      if (!detailsResult.success) {
        setSaveMsg({ type: "error", text: detailsResult.error.message });
        return;
      }
      setSaveMsg({ type: "success", text: "Đã lưu báo giá thành công!" });
      router.refresh();
    });
  };

  // Status transition via server action
  const handleStatusChange = (newStatus: string) => {
    setSaveMsg(null);
    startTransition(async () => {
      const result = await updateQuoteStatus(quote.id, newStatus);
      if (!result.success) {
        setSaveMsg({ type: "error", text: result.error.message });
        return;
      }
      router.refresh();
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
      const res = await addQuoteItem(quote.id, productId);
      if (res.success) {
        setProductSearch("");
        setFoundProducts([]);
        router.refresh();
      }
    });
  };

  const handleAddCustomItem = () => {
    if (!customItem.name.trim()) {
      setSaveMsg({ type: "error", text: "Vui lòng nhập tên sản phẩm tùy chỉnh" });
      return;
    }

    startTransition(async () => {
      const res = await addQuoteItem(quote.id, undefined, {
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
    if (!confirm("Xác nhận xóa sản phẩm này khỏi báo giá?")) return;
    startTransition(async () => {
      const res = await removeQuoteItem(itemId);
      if (res.success) {
        router.refresh();
      }
    });
  };

  // Quote → Order conversion
  const handleCreateOrder = () => {
    setSaveMsg(null);
    startConverting(async () => {
      const result = await createOrderFromQuote(quote.id, "");
      if (!result.success) {
        setSaveMsg({ type: "error", text: result.error.message });
        return;
      }
      setOrderResult({ orderId: result.data.orderId, orderCode: result.data.orderCode });
      router.refresh();
    });
  };


  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/quotes?tab=quotes"
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
              <FileText size={22} className="text-indigo-500" />
              {quote.quoteCode}
              {quote.version > 1 && (
                <span className="text-sm font-semibold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full">
                  v{quote.version}
                </span>
              )}
            </h2>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Clock size={11} /> Tạo: {new Date(quote.createdAt).toLocaleString("vi-VN")}
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw size={11} /> Cập nhật: {new Date(quote.updatedAt).toLocaleString("vi-VN")}
              </span>
              {quote.rfq && (
                <span className="flex items-center gap-1">
                  <Hash size={11} /> Từ {quote.rfq.rfqCode}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User size={11} /> {quote.creatorName}
              </span>
              <span className="flex items-center gap-1">
                <Globe size={11} /> {quote.locale.toUpperCase()} · {quote.currency}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${quoteStatusColors[quote.status] || "bg-gray-100 text-gray-600"}`}>
            {quoteStatusLabels[quote.status] || quote.status}
          </span>
          {isTerminal && (
            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
              <BadgeInfo size={12} /> Chỉ đọc
            </span>
          )}
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

      {/* ── Customer info (from RFQ) ── */}
      {quote.rfq && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wide">Thông tin khách hàng</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User size={14} className="text-gray-400 shrink-0" /> {quote.rfq.contactName}
            </div>
            {quote.rfq.companyName && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Building2 size={14} className="text-gray-400 shrink-0" /> {quote.rfq.companyName}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone size={14} className="text-gray-400 shrink-0" /> {quote.rfq.contactPhone}
            </div>
            {quote.rfq.contactEmail && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail size={14} className="text-gray-400 shrink-0" /> {quote.rfq.contactEmail}
              </div>
            )}
            {quote.rfq.deliveryAddress && (
              <div className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
                <MapPin size={14} className="text-gray-400 shrink-0" /> {quote.rfq.deliveryAddress}
              </div>
            )}
          </div>
          {quote.rfq.message && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600 italic border-l-4 border-orange-300">
              {quote.rfq.message}
            </div>
          )}
        </div>
      )}

      {/* ── Items table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Sản phẩm báo giá</h3>
        {items.length === 0 ? (
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
                  <th className="text-right py-2 px-2 text-gray-500 font-semibold">Đơn giá (₫)</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-semibold">CK%</th>
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
                            className="w-16 text-center border border-gray-200 rounded-lg py-1 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
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
                            className="w-32 text-right border border-gray-200 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          />
                        ) : (
                          <span className={item.unitPrice === 0 ? "text-amber-500 font-medium" : ""}>
                            {item.unitPrice === 0 ? "Chưa nhập" : formatVND(item.unitPrice)}
                          </span>
                        )}
                      </td>

                      {/* Discount rate */}
                      <td className="py-3 px-2 text-center align-top">
                        {isEditable ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={Math.round(item.discountRate * 100)}
                            onChange={(e) => updateItem(idx, "discountRate", (parseFloat(e.target.value) || 0) / 100)}
                            className="w-16 text-center border border-gray-200 rounded-lg py-1 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          />
                        ) : (
                          `${Math.round(item.discountRate * 100)}%`
                        )}
                      </td>

                      {/* Line total (always from live calc) */}
                      <td className="py-3 px-2 text-right font-semibold text-gray-800 align-top">
                        {formatVND(calc.itemTotals[idx] ?? 0)} ₫
                      </td>
                    </tr>

                    {/* Note row per item */}
                    {(isEditable || item.note) && (
                      <tr key={`note-${item.id}`} className="border-b border-gray-50 bg-gray-50/30">
                        <td className="py-1 px-2" />
                        <td colSpan={7} className="py-1.5 px-2 pb-2">
                          {isEditable ? (
                            <input
                              type="text"
                              value={item.note}
                              onChange={(e) => updateItem(idx, "note", e.target.value)}
                              placeholder="Ghi chú cho sản phẩm này..."
                              className="w-full text-xs border border-gray-200 rounded-lg py-1 px-2 text-gray-600 focus:ring-1 focus:ring-indigo-300 focus:border-transparent bg-white"
                            />
                          ) : (
                            item.note && (
                              <span className="text-xs text-gray-400 italic">↳ {item.note}</span>
                            )
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}

                {isEditable && (
                  <tr>
                    <td colSpan={8} className="py-4">
                      <div className="relative space-y-3">
                        <div className="flex items-center gap-2 p-1 pl-3 bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
                          <Search size={14} className="text-gray-400" />
                          <input 
                            type="text" 
                            placeholder="Thêm sản phẩm mới..."
                            value={productSearch}
                            onChange={e => handleSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none py-2 text-sm focus:outline-none"
                          />
                        </div>

                        {foundProducts.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl p-2 max-h-60 overflow-y-auto">
                            {foundProducts.map(p => (
                              <button
                                key={p.id}
                                onClick={() => handleAddItem(p.id)}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 transition-colors text-left"
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
                                <Plus size={14} className="text-indigo-400" />
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
                            className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                          />
                          <input
                            type="number"
                            min={1}
                            value={customItem.quantity}
                            onChange={(e) => setCustomItem((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                            className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={customItem.unit}
                            onChange={(e) => setCustomItem((prev) => ({ ...prev, unit: e.target.value }))}
                            className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                          />
                          <input
                            type="number"
                            min={0}
                            value={customItem.unitPrice}
                            onChange={(e) => setCustomItem((prev) => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                            className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                          />
                          <button
                            onClick={handleAddCustomItem}
                            disabled={isPending}
                            className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 disabled:opacity-50"
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
        )}
      </div>

      {/* ── Totals + Terms ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Tổng kết</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tạm tính:</span>
              <span className="font-semibold">{formatVND(calc.subtotal)} ₫</span>
            </div>

            {/* Quote-level discount */}
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Chiết khấu tổng:</span>
              {isEditable ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right border border-gray-200 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-xs text-gray-400">₫</span>
                </div>
              ) : (
                <span className="font-semibold text-red-500">
                  {calc.discountAmount > 0 ? `-${formatVND(calc.discountAmount)} ₫` : "—"}
                </span>
              )}
            </div>

            {/* VAT */}
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
                    className="w-16 text-center border border-gray-200 rounded-lg py-1 text-sm focus:ring-2 focus:ring-indigo-400"
                  />
                ) : (
                  <span className="text-gray-600">{Math.round(vatRate * 100)}%</span>
                )}
                <span className="font-semibold">{formatVND(calc.vatAmount)} ₫</span>
              </div>
            </div>

            {/* Shipping */}
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Phí vận chuyển:</span>
              {isEditable ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={shippingFee}
                    onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right border border-gray-200 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-xs text-gray-400">₫</span>
                </div>
              ) : (
                <span className="font-semibold">{formatVND(calc.shippingFee)} ₫</span>
              )}
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-base font-bold text-gray-800">TỔNG CỘNG:</span>
              <span className="text-xl font-extrabold text-indigo-600">{formatVND(calc.totalAmount)} ₫</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Điều khoản</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Thanh toán</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                disabled={!isEditable}
                placeholder="VD: 50% đặt cọc, 50% trước khi giao"
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm disabled:bg-gray-50 focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Giao hàng</label>
              <input
                type="text"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                disabled={!isEditable}
                placeholder="VD: FOB Bến Tre, 7-10 ngày"
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm disabled:bg-gray-50 focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                <Hash size={12} className="inline mr-1" />
                Hiệu lực đến
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={!isEditable}
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm disabled:bg-gray-50 focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Ghi chú thương mại</label>
              <textarea
                value={commercialNotes}
                onChange={(e) => setCommercialNotes(e.target.value)}
                disabled={!isEditable}
                rows={2}
                placeholder="Điều khoản thương mại, ưu đãi..."
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm resize-none disabled:bg-gray-50 focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Ghi chú kỹ thuật</label>
              <textarea
                value={technicalNotes}
                onChange={(e) => setTechnicalNotes(e.target.value)}
                disabled={!isEditable}
                rows={2}
                placeholder="Thông số kỹ thuật, tiêu chuẩn..."
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm resize-none disabled:bg-gray-50 focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Save (only when editable) */}
          {isEditable && (
            <button
              id="btn-save-quote"
              onClick={handleSave}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu bản nháp
            </button>
          )}

          {/* Status transition buttons (from quote-status.ts whitelist) */}
          {!isTerminal && transitions.map((t) => (
            <button
              key={t.status}
              id={`btn-status-${t.status.toLowerCase()}`}
              onClick={() => handleStatusChange(t.status)}
              disabled={isPending}
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors ${t.color}`}
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {t.label}
            </button>
          ))}

          {/* ── ACCEPTED: Create Order CTA ── */}
          {quote.status === "ACCEPTED" && !orderResult && (
            <button
              id="btn-create-order"
              onClick={handleCreateOrder}
              disabled={isConverting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isConverting ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
              Tạo đơn hàng
            </button>
          )}

          {/* ── ACCEPTED: Order just created (success callout) ── */}
          {orderResult && (
            <Link
              href={`/admin/orders/${orderResult.orderId}`}
              id="link-new-order"
              className="px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center gap-2 hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 size={16} />
              Đơn hàng {orderResult.orderCode} đã tạo
              <ExternalLink size={14} />
            </Link>
          )}

          {/* ── CONVERTED: Link to existing order ── */}
          {quote.status === "CONVERTED" && !orderResult && (
            <span className="text-sm text-purple-600 font-medium flex items-center gap-1.5 bg-purple-50 px-3 py-2 rounded-xl border border-purple-200">
              <ShoppingCart size={14} />
              Báo giá đã chuyển thành đơn hàng
            </span>
          )}

          {/* Terminal status message */}
          {isTerminal && quote.status !== "CONVERTED" && (
            <span className="text-sm text-gray-400 italic">
              Báo giá này đã kết thúc — không thể thay đổi thêm.
            </span>
          )}

          {/* Download PDF button (always available except for very early drafts without items) */}
          <a
            href={`/api/quotes/${quote.id}/pdf`}
            target="_blank"
            className="px-5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold flex items-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <DownloadCloud size={16} />
            Tải PDF Báo Giá
          </a>

        </div>

        <Link
          href="/admin/quotes?tab=quotes"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Quay lại danh sách
        </Link>
      </div>
    </div>
  );
}
