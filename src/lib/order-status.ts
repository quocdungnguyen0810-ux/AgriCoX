/**
 * Order status constants, labels, transitions, and validation.
 * Single source of truth for the order lifecycle.
 *
 * Lifecycle:
 *   NEW → CONFIRMED → PRODUCING → QUALITY_CHECK → PACKING → SHIPPED → DELIVERED → COMPLETED
 *   Any non-terminal state → CANCELLED
 *
 * paymentStatus:  PENDING → PARTIAL → PAID
 * fulfillmentStatus: NOT_STARTED → IN_PROGRESS → COMPLETED
 */

// ── Order Status Constants ──

export const ORDER_STATUSES = {
  NEW: "NEW",
  CONFIRMED: "CONFIRMED",
  PRODUCING: "PRODUCING",
  QUALITY_CHECK: "QUALITY_CHECK",
  PACKING: "PACKING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

// ── Payment Status Constants ──

export const PAYMENT_STATUSES = {
  PENDING: "PENDING",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
} as const;

// ── Fulfillment Status Constants ──

export const FULFILLMENT_STATUSES = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

// ── Vietnamese Labels ──

export const orderStatusLabels: Record<string, string> = {
  NEW: "Đơn hàng mới",
  CONFIRMED: "Đã xác nhận",
  PRODUCING: "Đang sản xuất",
  QUALITY_CHECK: "Kiểm tra QC",
  PACKING: "Đóng gói",
  SHIPPED: "Đang vận chuyển",
  DELIVERED: "Đã giao hàng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const paymentStatusLabels: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PARTIAL: "Thanh toán một phần",
  PAID: "Đã thanh toán",
};

export const fulfillmentStatusLabels: Record<string, string> = {
  NOT_STARTED: "Chưa thực hiện",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
};

// ── Badge Colors ──

export const orderStatusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PRODUCING: "bg-yellow-100 text-yellow-700",
  QUALITY_CHECK: "bg-purple-100 text-purple-700",
  PACKING: "bg-orange-100 text-orange-700",
  SHIPPED: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-green-200 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  PAID: "bg-emerald-100 text-emerald-700",
};

// ── Allowed Transitions (whitelist) ──

const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PRODUCING", "CANCELLED"],
  PRODUCING: ["QUALITY_CHECK", "CANCELLED"],
  QUALITY_CHECK: ["PACKING", "PRODUCING", "CANCELLED"],
  PACKING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  // COMPLETED and CANCELLED are terminal — no outbound transitions
};

/**
 * Validate whether an order status transition is allowed.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateOrderTransition(
  from: string,
  to: string
): { valid: true } | { valid: false; reason: string } {
  if (from === to) {
    return { valid: false, reason: "Trạng thái không thay đổi" };
  }

  const allowed = ALLOWED_ORDER_TRANSITIONS[from];

  if (!allowed) {
    return {
      valid: false,
      reason: `Trạng thái "${orderStatusLabels[from] || from}" không cho phép chuyển tiếp`,
    };
  }

  if (!allowed.includes(to)) {
    return {
      valid: false,
      reason: `Không thể chuyển từ "${orderStatusLabels[from] || from}" sang "${orderStatusLabels[to] || to}"`,
    };
  }

  return { valid: true };
}

/**
 * Check if an order status is terminal (no further transitions allowed).
 */
export function isTerminalOrderStatus(status: string): boolean {
  const allowed = ALLOWED_ORDER_TRANSITIONS[status];
  return !allowed || allowed.length === 0;
}

// ── UI Button Config ──

/** Transition buttons shown in Order detail for each status. */
export const orderStatusTransitions: Record<
  string,
  { label: string; status: string; color: string }[]
> = {
  NEW: [
    { label: "Xác nhận đơn hàng", status: "CONFIRMED", color: "bg-indigo-500 hover:bg-indigo-600" },
    { label: "Hủy đơn", status: "CANCELLED", color: "bg-red-500 hover:bg-red-600" },
  ],
  CONFIRMED: [
    { label: "Bắt đầu sản xuất", status: "PRODUCING", color: "bg-yellow-500 hover:bg-yellow-600" },
    { label: "Hủy đơn", status: "CANCELLED", color: "bg-red-500 hover:bg-red-600" },
  ],
  PRODUCING: [
    { label: "Kiểm tra QC", status: "QUALITY_CHECK", color: "bg-purple-500 hover:bg-purple-600" },
    { label: "Hủy đơn", status: "CANCELLED", color: "bg-red-500 hover:bg-red-600" },
  ],
  QUALITY_CHECK: [
    { label: "Đóng gói", status: "PACKING", color: "bg-orange-500 hover:bg-orange-600" },
    { label: "Sản xuất lại", status: "PRODUCING", color: "bg-yellow-500 hover:bg-yellow-600" },
    { label: "Hủy đơn", status: "CANCELLED", color: "bg-red-500 hover:bg-red-600" },
  ],
  PACKING: [
    { label: "Xuất kho / Giao vận", status: "SHIPPED", color: "bg-cyan-500 hover:bg-cyan-600" },
    { label: "Hủy đơn", status: "CANCELLED", color: "bg-red-500 hover:bg-red-600" },
  ],
  SHIPPED: [
    { label: "Xác nhận giao hàng", status: "DELIVERED", color: "bg-emerald-500 hover:bg-emerald-600" },
  ],
  DELIVERED: [
    { label: "Hoàn thành", status: "COMPLETED", color: "bg-green-600 hover:bg-green-700" },
  ],
};
