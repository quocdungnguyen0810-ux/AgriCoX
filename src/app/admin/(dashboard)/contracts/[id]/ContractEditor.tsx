"use client";

import { useState, useTransition } from "react";
import { updateContractDetails } from "@/app/admin/actions";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

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

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateContractDetails(contractId, {
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

      if (result.success) {
        setMessage({ type: "success", text: "Đã lưu hợp đồng thành công." });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({ type: "error", text: result.error.message });
      }
    });
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
    editable
      ? "border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
      : "border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed"
  }`;

  const textareaClass = `w-full px-3 py-2 rounded-lg border text-sm transition-colors font-mono leading-relaxed ${
    editable
      ? "border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
      : "border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed"
  }`;

  return (
    <div className="space-y-6">
      {/* ── Contract Dates ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">
          Ngày hợp đồng
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Ngày hợp đồng</label>
            <input
              type="date"
              value={contractDate}
              onChange={(e) => setContractDate(e.target.value)}
              disabled={!editable}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Ngày hiệu lực</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              disabled={!editable}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Ngày hết hạn</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={!editable}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Commercial Terms ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">
          Điều khoản thương mại
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Điều kiện thanh toán</label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              disabled={!editable}
              placeholder="VD: Thanh toán 100% trước khi giao hàng"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Điều kiện giao hàng</label>
            <input
              type="text"
              value={deliveryTerms}
              onChange={(e) => setDeliveryTerms(e.target.value)}
              disabled={!editable}
              placeholder="VD: Giao hàng tận nơi trong 7 ngày"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Incoterm</label>
            <input
              type="text"
              value={incoterm}
              onChange={(e) => setIncoterm(e.target.value)}
              disabled={!editable}
              placeholder="VD: FOB, CIF, EXW, DAP"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Địa điểm giao hàng</label>
            <input
              type="text"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              disabled={!editable}
              placeholder="VD: Cảng Cát Lái, TP.HCM"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Bilingual Content ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">
          Nội dung hợp đồng
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
              🇻🇳 Nội dung hợp đồng tiếng Việt
            </label>
            <textarea
              value={contentVi}
              onChange={(e) => setContentVi(e.target.value)}
              disabled={!editable}
              rows={12}
              placeholder="Nhập nội dung hợp đồng tiếng Việt..."
              className={textareaClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
              🇬🇧 English Contract Content
            </label>
            <textarea
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              disabled={!editable}
              rows={12}
              placeholder="Enter English contract content..."
              className={textareaClass}
            />
          </div>
        </div>
      </div>

      {/* ── Save Button + Status ── */}
      {editable && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Lưu thay đổi
          </button>
          {message && (
            <div
              className={`flex items-center gap-1.5 text-sm font-medium ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {message.text}
            </div>
          )}
        </div>
      )}

      {!editable && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Hợp đồng không thể chỉnh sửa ở trạng thái hiện tại. Chỉ có thể sửa khi ở trạng thái <strong>Bản nháp</strong> hoặc <strong>Đang đàm phán</strong>.
        </div>
      )}

      {/* TODO(Phase 5B.7): Add contract status action buttons here */}
      {/* TODO(Phase 6A): Generate contract PDF button */}
    </div>
  );
}
