"use client";

import { useState, useTransition, useMemo, Fragment } from "react";
import { updateContractDetails, updateContractPricing } from "@/app/admin/actions/contract";
import { Save, Loader2, CheckCircle, AlertCircle, ShoppingCart, Download, Eye } from "lucide-react";
import { calculateQuote, formatVND } from "@/lib/quote-calculation";

interface ContractItem {
  id: string;
  productNameSnapshot: string;
  packagingSnapshot: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  note: string;
}

interface ContractEditorProps {
  contractId: string;
  editable: boolean;
  initialData: {
    contractDate: string;
    effectiveDate: string;
    expiryDate: string;
    paymentTerms: string;
    deliveryTerms: string;
    incoterm: string;
    deliveryLocation: string;
    contentVi: string;
    contentEn: string;
    // Pricing data from linked order
    subtotal: number;
    discountAmount: number;
    vatAmount: number;
    shippingFee: number;
    totalAmount: number;
    items: ContractItem[];
  };
}

function toDateInput(isoString: string): string {
  if (!isoString) return "";
  try {
    return new Date(isoString).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function ContractEditor({
  contractId,
  editable,
  initialData,
}: ContractEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [contractDate, setContractDate] = useState(toDateInput(initialData.contractDate));
  const [effectiveDate, setEffectiveDate] = useState(toDateInput(initialData.effectiveDate));
  const [expiryDate, setExpiryDate] = useState(toDateInput(initialData.expiryDate));
  const [paymentTerms, setPaymentTerms] = useState(initialData.paymentTerms || "");
  const [deliveryTerms, setDeliveryTerms] = useState(initialData.deliveryTerms || "");
  const [incoterm, setIncoterm] = useState(initialData.incoterm || "");
  const [deliveryLocation, setDeliveryLocation] = useState(initialData.deliveryLocation || "");
  const [contentVi, setContentVi] = useState(initialData.contentVi || "");
  const [contentEn, setContentEn] = useState(initialData.contentEn || "");

  // Pricing state
  const [items, setItems] = useState<ContractItem[]>(initialData.items);
  const [discountAmount, setDiscountAmount] = useState(initialData.discountAmount);
  const [shippingFee, setShippingFee] = useState(initialData.shippingFee);
  
  const initialVatRate = initialData.subtotal > initialData.discountAmount 
    ? initialData.vatAmount / (initialData.subtotal - initialData.discountAmount)
    : 0.08;
  const [vatRate, setVatRate] = useState(initialVatRate);

  // Live preview
  const calc = useMemo(() => {
    return calculateQuote({
      items: items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountRate: 0 })),
      discountAmount,
      vatRate,
      shippingFee,
    });
  }, [items, discountAmount, vatRate, shippingFee]);

  const updateItem = (index: number, field: keyof ContractItem, value: number | string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      // 1. Save Details
      const detailsResult = await updateContractDetails(contractId, {
        contractDate: contractDate || null,
        effectiveDate: effectiveDate || null,
        expiryDate: expiryDate || null,
        paymentTerms: paymentTerms || null,
        deliveryTerms: deliveryTerms || null,
        incoterm: incoterm || null,
        deliveryLocation: deliveryLocation || null,
        contentVi: contentVi || null,
        contentEn: contentEn || null,
      });

      if (!detailsResult.success) {
        setMessage({ type: "error", text: detailsResult.error.message });
        return;
      }

      // 2. Save Pricing
      const pricingResult = await updateContractPricing(contractId, {
        items: items.map(i => ({ id: i.id, quantity: i.quantity, unitPrice: i.unitPrice, note: i.note })),
        shippingFee,
        discountAmount,
        vatRate,
      });

      if (!pricingResult.success) {
        setMessage({ type: "error", text: pricingResult.error.message });
        return;
      }

      setMessage({ type: "success", text: "Đã lưu hợp đồng và cập nhật giá chốt đơn hàng thành công." });
      setTimeout(() => setMessage(null), 4000);
    });
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
    editable
      ? "border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
      : "border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed"
  }`;

  return (
    <div className="space-y-6">
      {/* ── Contract Dates ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Ngày hợp đồng</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Ngày hợp đồng</label>
            <input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} disabled={!editable} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Ngày hiệu lực</label>
            <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} disabled={!editable} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Ngày hết hạn</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} disabled={!editable} className={inputClass} />
          </div>
        </div>
      </div>

      {/* ── Pricing & Items Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
          <ShoppingCart size={16} className="text-green-600" /> Sản phẩm & Giá chốt
        </h3>
        
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-gray-500 font-semibold">Sản phẩm</th>
                <th className="text-center py-2 px-2 text-gray-500 font-semibold">SL</th>
                <th className="text-right py-2 px-2 text-gray-500 font-semibold">Đơn giá (₫)</th>
                <th className="text-right py-2 px-2 text-gray-500 font-semibold">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <Fragment key={item.id}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50/40 text-sm">
                    <td className="py-3 px-2 font-medium text-gray-800">{item.productNameSnapshot}</td>
                    <td className="py-3 px-2 text-center">
                      {editable ? (
                        <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className="w-16 text-center border border-gray-200 rounded-lg py-1 text-sm focus:ring-2 focus:ring-green-400" />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {editable ? (
                        <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} className="w-32 text-right border border-gray-200 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-green-400" />
                      ) : (
                        formatVND(item.unitPrice)
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold">{formatVND(calc.itemTotals[idx] || 0)} ₫</td>
                  </tr>
                  {(editable || item.note) && (
                    <tr className="border-b border-gray-50 bg-gray-50/20">
                      <td colSpan={4} className="py-1 px-2 pb-2">
                        {editable ? (
                          <input type="text" value={item.note} onChange={(e) => updateItem(idx, "note", e.target.value)} placeholder="Ghi chú sản phẩm..." className="w-full text-xs border border-gray-200 rounded-lg py-1 px-2 focus:ring-1 focus:ring-green-300" />
                        ) : (
                          item.note && <span className="text-xs text-gray-400 italic">↳ {item.note}</span>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div className="space-y-3">
             <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Chiết khấu đơn hàng:</span>
              {editable ? (
                <input type="number" min={0} value={discountAmount} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} className="w-32 text-right border border-gray-200 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-green-400" />
              ) : (
                <span className="font-semibold text-red-500">-{formatVND(discountAmount)} ₫</span>
              )}
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Thuế VAT (%):</span>
              {editable ? (
                <input type="number" min={0} max={100} value={Math.round(vatRate * 100)} onChange={(e) => setVatRate((parseFloat(e.target.value) || 0) / 100)} className="w-16 text-center border border-gray-200 rounded-lg py-1 text-sm focus:ring-2 focus:ring-green-400" />
              ) : (
                <span className="font-semibold">{Math.round(vatRate * 100)}%</span>
              )}
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Phí vận chuyển:</span>
              {editable ? (
                <input type="number" min={0} value={shippingFee} onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)} className="w-32 text-right border border-gray-200 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-green-400" />
              ) : (
                <span className="font-semibold">{formatVND(shippingFee)} ₫</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end justify-center">
            <span className="text-xs font-bold text-gray-400 uppercase">Giá trị hợp đồng chốt</span>
            <span className="text-2xl font-extrabold text-green-600">{formatVND(calc.totalAmount)} ₫</span>
          </div>
        </div>
      </div>

      {/* ── Commercial Terms ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Điều khoản thương mại</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Điều kiện thanh toán</label>
            <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} disabled={!editable} placeholder="VD: 50% đặt cọc, 50% trước khi giao" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Điều kiện giao hàng</label>
            <input type="text" value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} disabled={!editable} placeholder="VD: Giao trong 7-10 ngày" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Incoterm</label>
            <input type="text" value={incoterm} onChange={(e) => setIncoterm(e.target.value)} disabled={!editable} placeholder="VD: FOB, CIF, EXW" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Địa điểm giao hàng</label>
            <input type="text" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} disabled={!editable} placeholder="Địa chỉ cụ thể..." className={inputClass} />
          </div>
        </div>
      </div>

      {/* ── Bilingual Content ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">Nội dung hợp đồng</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">🇻🇳 Nội dung hợp đồng tiếng Việt</label>
            <textarea value={contentVi} onChange={(e) => setContentVi(e.target.value)} disabled={!editable} rows={10} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-green-400 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">🇬🇧 English Contract Content</label>
            <textarea value={contentEn} onChange={(e) => setContentEn(e.target.value)} disabled={!editable} rows={10} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-green-400 disabled:bg-gray-50" />
          </div>
        </div>
      </div>

      {/* ── Save & Preview Buttons ── */}
      {editable && (
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-900 font-bold text-sm disabled:opacity-50 transition-colors shadow-lg">
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Lưu thay đổi nội dung
          </button>
          
          <a 
            href={`/api/contracts/${contractId}/pdf`}
            target="_blank"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 font-bold text-sm transition-colors shadow-sm"
          >
            <Download size={18} />
            Tải bản thảo PDF
          </a>

          {message && (
            <div className={`flex items-center gap-1.5 text-sm font-medium ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
