"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  createInvoice 
} from "@/app/admin/actions/accounting";
import { 
  createDeliveryNote 
} from "@/app/admin/actions/logistics";
import { 
  recordPayment 
} from "@/app/admin/actions/accounting";
import {
  FileText,
  Truck,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Banknote,
  FilePlus2,
} from "lucide-react";

interface ContractFinancialActionsProps {
  orderId: string;
  totalAmount: number;
  paymentStatus: string;
  hasInvoices: boolean;
  hasDeliveryNotes: boolean;
}

export function ContractFinancialActions({
  orderId,
  totalAmount,
  paymentStatus,
  hasInvoices,
  hasDeliveryNotes,
}: ContractFinancialActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState(totalAmount);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentNote, setPaymentNote] = useState("");

  const handleAction = (actionFn: (id: string) => Promise<any>, successMsg: string) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await actionFn(orderId);
      if (result.success) {
        setSuccess(successMsg);
        router.refresh();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const err = (result as any).error;
        setError(typeof err === "string" ? err : err?.message || "Có lỗi xảy ra");
      }
    });
  };

  const handleRecordPayment = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await recordPayment(
        orderId, 
        paymentAmount, 
        paymentMethod, 
        undefined, 
        paymentNote
      );
      if (result.success) {
        setSuccess("Đã ghi nhận thanh toán thành công!");
        setShowPaymentForm(false);
        router.refresh();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const err = (result as any).error;
        setError(typeof err === "string" ? err : err?.message || "Có lỗi xảy ra");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
        <CreditCard size={14} className="text-indigo-500" /> Tài chính & Giao nhận (Đơn hàng)
      </h3>

      <div className="flex flex-wrap gap-3">
        {/* Invoice Action */}
        <button
          onClick={() => handleAction(createInvoice, "Đã khởi tạo hoá đơn thành công!")}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <FilePlus2 size={14} />}
          {hasInvoices ? "Tạo thêm hoá đơn" : "Khởi tạo hoá đơn"}
        </button>

        {/* Delivery Note Action */}
        <button
          onClick={() => handleAction((id) => createDeliveryNote(id, "CÔNG TY VẬN TẢI"), "Đã tạo biên bản giao nhận!")}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
          {hasDeliveryNotes ? "Tạo thêm phiếu giao hàng" : "Tạo phiếu giao hàng"}
        </button>

        {/* Payment Action */}
        {paymentStatus !== "PAID" && (
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            <Banknote size={14} />
            Xác nhận thanh toán
          </button>
        )}
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Số tiền thanh toán (₫)</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Phương thức</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400"
              >
                <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                <option value="CASH">Tiền mặt</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Ghi chú</label>
            <textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Nhập ghi chú thanh toán..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowPaymentForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              onClick={handleRecordPayment}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending && <Loader2 size={12} className="animate-spin" />}
              Xác nhận & Sinh biên lai
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
          <CheckCircle2 size={14} /> {success}
        </div>
      )}
    </div>
  );
}
