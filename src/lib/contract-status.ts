/**
 * Contract status constants, labels, transitions, and validation.
 * Single source of truth for the Contract lifecycle.
 */

// ── Contract Status Constants ──

export const CONTRACT_STATUSES = {
  DRAFT: "DRAFT",
  SENT_TO_CUSTOMER: "SENT_TO_CUSTOMER",
  NEGOTIATING: "NEGOTIATING",
  SIGNED_BY_CUSTOMER: "SIGNED_BY_CUSTOMER",
  SIGNED_BY_GREENPEAT: "SIGNED_BY_GREENPEAT",
  SIGNED: "SIGNED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[keyof typeof CONTRACT_STATUSES];

// ── Vietnamese Labels ──

export const contractStatusLabels: Record<ContractStatus, string> = {
  DRAFT: "Bản nháp",
  SENT_TO_CUSTOMER: "Đã gửi khách hàng",
  NEGOTIATING: "Đang đàm phán",
  SIGNED_BY_CUSTOMER: "Khách hàng đã ký",
  SIGNED_BY_GREENPEAT: "GreenPeat đã ký",
  SIGNED: "Đã ký đầy đủ",
  ACTIVE: "Đang hiệu lực",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

// ── Badge Styles (compatible with admin design tokens) ──

export const contractStatusStyles: Record<ContractStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  SENT_TO_CUSTOMER: "bg-blue-50 text-blue-700 border-blue-200",
  NEGOTIATING: "bg-amber-50 text-amber-700 border-amber-200",
  SIGNED_BY_CUSTOMER: "bg-purple-50 text-purple-700 border-purple-200",
  SIGNED_BY_GREENPEAT: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SIGNED: "bg-green-50 text-green-700 border-green-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

// ── Allowed Transitions (Whitelist) ──

const ALLOWED_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  [CONTRACT_STATUSES.DRAFT]: [CONTRACT_STATUSES.SENT_TO_CUSTOMER, CONTRACT_STATUSES.CANCELLED],
  [CONTRACT_STATUSES.SENT_TO_CUSTOMER]: [CONTRACT_STATUSES.NEGOTIATING, CONTRACT_STATUSES.SIGNED_BY_CUSTOMER, CONTRACT_STATUSES.CANCELLED],
  [CONTRACT_STATUSES.NEGOTIATING]: [CONTRACT_STATUSES.DRAFT, CONTRACT_STATUSES.SENT_TO_CUSTOMER, CONTRACT_STATUSES.CANCELLED],
  [CONTRACT_STATUSES.SIGNED_BY_CUSTOMER]: [CONTRACT_STATUSES.SIGNED_BY_GREENPEAT, CONTRACT_STATUSES.CANCELLED],
  [CONTRACT_STATUSES.SIGNED_BY_GREENPEAT]: [CONTRACT_STATUSES.SIGNED, CONTRACT_STATUSES.CANCELLED],
  [CONTRACT_STATUSES.SIGNED]: [CONTRACT_STATUSES.ACTIVE],
  [CONTRACT_STATUSES.ACTIVE]: [CONTRACT_STATUSES.COMPLETED, CONTRACT_STATUSES.CANCELLED],
  [CONTRACT_STATUSES.COMPLETED]: [],
  [CONTRACT_STATUSES.CANCELLED]: [],
};

// ── Helper Functions ──

export function isContractStatus(value: string): value is ContractStatus {
  return Object.values(CONTRACT_STATUSES).includes(value as ContractStatus);
}

export function getContractStatusLabel(status: string): string {
  return contractStatusLabels[status as ContractStatus] || status;
}

export function getContractStatusBadge(status: string): string {
  return contractStatusStyles[status as ContractStatus] || "bg-gray-100 text-gray-600";
}

export function getAllowedContractTransitions(status: ContractStatus): ContractStatus[] {
  return ALLOWED_TRANSITIONS[status] || [];
}

/**
 * Check if a status is terminal (COMPLETED or CANCELLED)
 */
export function isTerminalContractStatus(status: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[status as ContractStatus];
  return !allowed || allowed.length === 0;
}

/**
 * Validate whether a contract status transition is allowed.
 */
export function validateContractTransition(
  from: string,
  to: string
): { valid: true } | { valid: false; reason: string } {
  if (from === to) {
    return { valid: false, reason: "Trạng thái không thay đổi" };
  }

  if (!isContractStatus(from) || !isContractStatus(to)) {
    return { valid: false, reason: "Trạng thái không hợp lệ" };
  }

  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    return {
      valid: false,
      reason: `Không thể chuyển từ "${contractStatusLabels[from]}" sang "${contractStatusLabels[to]}"`,
    };
  }

  return { valid: true };
}

// ── Business Guard Helpers ──

export const canEditContract = (status: string) => 
  status === CONTRACT_STATUSES.DRAFT || status === CONTRACT_STATUSES.NEGOTIATING;

export const canSendContract = (status: string) => 
  status === CONTRACT_STATUSES.DRAFT || status === CONTRACT_STATUSES.NEGOTIATING;

export const canCustomerSign = (status: string) => 
  status === CONTRACT_STATUSES.SENT_TO_CUSTOMER;

export const canGreenPeatSign = (status: string) => 
  status === CONTRACT_STATUSES.SIGNED_BY_CUSTOMER;

export const canCancelContract = (status: string) => 
  !isTerminalContractStatus(status);

// ── Role/Action Matrix ──

export type ContractRole = "ADMIN" | "SALES" | "CUSTOMER" | "GP_SIGNER";
export type ContractAction = 
  | "CREATE_CONTRACT"
  | "EDIT_CONTRACT"
  | "SEND_TO_CUSTOMER"
  | "REQUEST_REVISION"
  | "CUSTOMER_SIGN"
  | "GREENPEAT_SIGN"
  | "CANCEL_CONTRACT"
  | "ACTIVATE_CONTRACT"
  | "COMPLETE_CONTRACT";

const ROLE_PERMISSIONS: Record<ContractRole, ContractAction[]> = {
  ADMIN: [
    "CREATE_CONTRACT", "EDIT_CONTRACT", "SEND_TO_CUSTOMER", "REQUEST_REVISION",
    "CUSTOMER_SIGN", "GREENPEAT_SIGN", "CANCEL_CONTRACT", "ACTIVATE_CONTRACT", "COMPLETE_CONTRACT"
  ],
  SALES: [
    "CREATE_CONTRACT", "EDIT_CONTRACT", "SEND_TO_CUSTOMER", "REQUEST_REVISION", "CANCEL_CONTRACT"
  ],
  CUSTOMER: [
    "REQUEST_REVISION", "CUSTOMER_SIGN"
  ],
  GP_SIGNER: [
    "GREENPEAT_SIGN"
  ],
};

/**
 * Check if a role can perform an action based on the current status.
 */
export function canRolePerformContractAction(
  role: ContractRole,
  action: ContractAction,
  status: string
): boolean {
  // 1. Basic permission check
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions.includes(action)) return false;

  // 2. Status-based rules
  if (isTerminalContractStatus(status)) return false;

  switch (action) {
    case "EDIT_CONTRACT":
      return canEditContract(status);
    case "SEND_TO_CUSTOMER":
      return canSendContract(status);
    case "CUSTOMER_SIGN":
      return canCustomerSign(status);
    case "GREENPEAT_SIGN":
      return canGreenPeatSign(status);
    case "CANCEL_CONTRACT":
      return canCancelContract(status);
    case "REQUEST_REVISION":
      return status === CONTRACT_STATUSES.SENT_TO_CUSTOMER || status === CONTRACT_STATUSES.NEGOTIATING;
    case "ACTIVATE_CONTRACT":
      return status === CONTRACT_STATUSES.SIGNED;
    case "COMPLETE_CONTRACT":
      return status === CONTRACT_STATUSES.ACTIVE;
    default:
      return true;
  }
}
