"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, createContractFromOrder } from "@/app/admin/actions";
import { orderStatusTransitions } from "@/lib/order-status";
import { ArrowRightCircle, FilePlus2, Loader2, XCircle } from "lucide-react";

interface OrderActionsProps {
  orderId: string;
  currentStatus: string;
  contractId?: string;
}

export function OrderActions({ orderId, currentStatus, contractId }: OrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
    return null;
  }

  const actions = orderStatusTransitions[currentStatus] ?? [];

  const handleTransition = (nextStatus: string, label: string) => {
    if (nextStatus === "CANCELLED") {
      if (!confirm(`Xác nhận hủy đơn hàng này?`)) return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus);
      if (!result.success) {
        setError(result.error.message);
      }
    });
  };

  const handleCreateContract = () => {
    setError(null);
    startTransition(async () => {
      // createdBy placeholder for now as per Step 5B.4 plan
      const result = await createContractFromOrder(orderId, "");
      if (result.success) {
        router.push(`/admin/contracts/${result.data?.contractId}`);
      } else {
        setError(result.error.message);
      }
    });
  };

  return (
    <div className="pt-3 border-t border-gray-100">
      {error && (
        <p className="text-xs text-red-600 mb-2">{error}</p>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Create Contract Button */}
          {!contractId && ["NEW", "CONFIRMED"].includes(currentStatus) && (
            <button
              onClick={handleCreateContract}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5 font-medium disabled:opacity-50 transition-colors"
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FilePlus2 size={14} />
              )}
              Tạo hợp đồng
            </button>
          )}

          {actions
            .filter((a) => a.status !== "CANCELLED")
            .map((action) => (
              <button
                key={action.status}
                id={`btn-order-${action.status.toLowerCase()}`}
                onClick={() => handleTransition(action.status, action.label)}
                disabled={isPending}
                className={`text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5 font-medium disabled:opacity-50 transition-colors ${action.color}`}
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

        {/* Cancel is always shown as a separate destructive action */}
        {actions.some((a) => a.status === "CANCELLED") && (
          <button
            onClick={() => handleTransition("CANCELLED", "Hủy đơn")}
            disabled={isPending}
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 disabled:opacity-50 transition-colors"
          >
            <XCircle size={14} /> Hủy đơn
          </button>
        )}
      </div>
    </div>
  );
}
