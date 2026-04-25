"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/actions";
import { ArrowRightCircle, Loader2, XCircle } from "lucide-react";

interface OrderActionsProps {
  orderId: string;
  currentStatus: string;
}

const statusFlow: Record<string, { label: string; next: string; color: string }[]> = {
  REQUEST_RECEIVED: [
    { label: "Gửi báo giá", next: "QUOTATION_SENT", color: "bg-yellow-500 hover:bg-yellow-600" },
  ],
  QUOTATION_SENT: [
    { label: "Nhận PO", next: "PO_RECEIVED", color: "bg-orange-500 hover:bg-orange-600" },
  ],
  PO_RECEIVED: [
    { label: "Ký hợp đồng", next: "CONTRACT_SIGNED", color: "bg-green-500 hover:bg-green-600" },
  ],
  CONTRACT_SIGNED: [
    { label: "Bắt đầu SX", next: "PRODUCTION", color: "bg-indigo-500 hover:bg-indigo-600" },
  ],
  PRODUCTION: [
    { label: "Kiểm tra QC", next: "QC_INSPECTION", color: "bg-purple-500 hover:bg-purple-600" },
  ],
  QC_INSPECTION: [
    { label: "Đóng gói", next: "PACKING", color: "bg-pink-500 hover:bg-pink-600" },
  ],
  PACKING: [
    { label: "Xuất kho giao", next: "SHIPPING", color: "bg-cyan-500 hover:bg-cyan-600" },
  ],
  SHIPPING: [
    { label: "Đã giao hàng", next: "DELIVERED", color: "bg-emerald-500 hover:bg-emerald-600" },
  ],
  DELIVERED: [
    { label: "Hoàn thành", next: "COMPLETED", color: "bg-green-600 hover:bg-green-700" },
  ],
};

export function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
  const [isPending, startTransition] = useTransition();

  if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
    return null;
  }

  const actions = statusFlow[currentStatus] || [];

  const handleNext = (nextStatus: string) => {
    startTransition(() => {
      updateOrderStatus(orderId, nextStatus);
    });
  };

  const handleCancel = () => {
    if (confirm("Xác nhận hủy đơn hàng này?")) {
      startTransition(() => {
        updateOrderStatus(orderId, "CANCELLED", "Đơn hàng bị hủy");
      });
    }
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2 flex-wrap">
        {actions.map((action) => (
          <button
            key={action.next}
            onClick={() => handleNext(action.next)}
            disabled={isPending}
            className={`text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5 font-medium disabled:opacity-50 ${action.color}`}
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ArrowRightCircle size={14} />
            )}
            {action.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleCancel}
        disabled={isPending}
        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 disabled:opacity-50"
      >
        <XCircle size={14} /> Hủy đơn
      </button>
    </div>
  );
}
