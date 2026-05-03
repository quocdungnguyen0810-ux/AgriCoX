"use client";

import { useState, useTransition } from "react";
import { recordPayment } from "@/app/admin/actions/accounting";
import { Loader2, Plus, CreditCard, X } from "lucide-react";
import { formatVND } from "@/lib/quote-calculation";

interface RecordPaymentModalProps {
  orderId: string;
  totalAmount: number;
  paidAmount: number;
}

export function RecordPaymentModal({ orderId, totalAmount, paidAmount }: RecordPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const remaining = totalAmount - paidAmount;
  
  const [amount, setAmount] = useState(remaining > 0 ? remaining : 0);
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [referenceCode, setReferenceCode] = useState("");
  const [note, setNote] = useState("");

  if (remaining <= 0) return null; // Không cần thanh toán nữa

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("Số tiền phải lớn hơn 0");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await recordPayment(orderId, amount, method, referenceCode, note);
      if (res.success) {
        setIsOpen(false);
        // Reset form
        setAmount(remaining - amount > 0 ? remaining - amount : 0);
        setReferenceCode("");
        setNote("");
      } else {
        setError(res.error || "Lỗi không xác định");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 font-medium transition-colors"
      >
        <CreditCard size={14} /> Ghi nhận thanh toán
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <CreditCard className="text-emerald-500" size={18} />
                Ghi nhận thanh toán
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>}

              <div className="flex justify-between text-sm p-3 bg-emerald-50 text-emerald-800 rounded-lg">
                <span>Còn phải thu:</span>
                <span className="font-bold">{formatVND(remaining)} ₫</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Số tiền khách trả (₫)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Phương thức</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                  <option value="CASH">Tiền mặt</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Mã giao dịch / UNC</label>
                <input
                  type="text"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="VD: FT23..."
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Ghi chú thêm</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Người nộp tiền..."
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Lưu thanh toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
