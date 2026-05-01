import { validateSigningLink } from "@/lib/signing-validation";
import { getContractStatusLabel, getContractStatusBadge } from "@/lib/contract-status";
import {
  FileCheck,
  Clock,
  User,
  Building2,
  ShoppingCart,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle,
  Leaf,
} from "lucide-react";
import SigningForm from "./SigningForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ký hợp đồng | GreenPeat AgriCoX",
  description: "Xem và ký hợp đồng GreenPeat AgriCoX",
  robots: "noindex, nofollow",
};

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Error Page ──────────────────────────────────────────

function SigningErrorPage({ reason }: { reason: string }) {
  const messages: Record<string, { title: string; desc: string }> = {
    TOKEN_EXPIRED: {
      title: "Liên kết ký đã hết hạn",
      desc: "Liên kết ký hợp đồng này đã hết hạn sử dụng. Vui lòng liên hệ GreenPeat để được cấp lại liên kết mới.",
    },
    TOKEN_ALREADY_USED: {
      title: "Liên kết ký đã được sử dụng",
      desc: "Liên kết này đã được sử dụng để ký hợp đồng. Mỗi liên kết chỉ có thể sử dụng một lần.",
    },
    default: {
      title: "Liên kết ký không hợp lệ hoặc đã hết hạn",
      desc: "Vui lòng liên hệ GreenPeat để được cấp lại liên kết ký hợp đồng.",
    },
  };

  const msg = messages[reason] || messages.default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
            <Leaf className="text-white" size={28} />
          </div>
        </div>

        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="text-red-500" size={32} />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">{msg.title}</h1>
        <p className="text-gray-500 text-sm mb-6">{msg.desc}</p>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            GreenPeat AgriCoX • Liên hệ: contact@greenpeat.vn
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────

export default async function SigningPage({
  params,
  searchParams,
}: {
  params: Promise<{ contractId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { contractId } = await params;
  const { token } = await searchParams;
  const rawToken = token || "";

  // Validate token server-side
  if (!token) {
    return <SigningErrorPage reason="INVALID_LINK" />;
  }

  const result = await validateSigningLink(contractId, token);

  if (!result.valid) {
    return <SigningErrorPage reason={result.reason} />;
  }

  const { data } = result;
  const { contract } = data;
  const roleName = data.signerRole === "CUSTOMER" ? "Khách hàng" : "Đại diện GreenPeat";
  const badgeClass = getContractStatusBadge(contract.status);
  const statusLabel = getContractStatusLabel(contract.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
              <Leaf className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800">GreenPeat AgriCoX</p>
              <p className="text-[11px] text-gray-400">Xem và ký hợp đồng</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={14} />
            <span>Hết hạn: {formatDateTime(data.tokenExpiresAt)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── Contract Header ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileCheck className="text-green-700" size={20} />
                <h1 className="text-lg font-bold text-gray-900">{contract.contractCode}</h1>
              </div>
              <p className="text-sm text-gray-500">
                Vai trò ký: <span className="font-semibold text-gray-700">{roleName}</span>
                {data.signerName && <> • {data.signerName}</>}
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* ── Contract Summary ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
            Thông tin hợp đồng
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={User} label="Khách hàng" value={contract.customer.name} />
            {contract.customer.companyName && (
              <InfoRow icon={Building2} label="Công ty" value={contract.customer.companyName} />
            )}
            {contract.order && (
              <InfoRow icon={ShoppingCart} label="Đơn hàng" value={contract.order.orderCode} />
            )}
            <InfoRow
              icon={DollarSign}
              label="Giá trị"
              value={`${formatVND(contract.totalAmount)} ${contract.currency}`}
            />
            <InfoRow icon={Calendar} label="Ngày hợp đồng" value={formatDate(contract.contractDate)} />
            <InfoRow icon={Calendar} label="Ngày hiệu lực" value={formatDate(contract.effectiveDate)} />
            <InfoRow icon={Calendar} label="Ngày hết hạn" value={formatDate(contract.expiryDate)} />
            {contract.incoterm && (
              <InfoRow icon={MapPin} label="Incoterm" value={contract.incoterm} />
            )}
            {contract.deliveryLocation && (
              <InfoRow icon={MapPin} label="Địa điểm giao" value={contract.deliveryLocation} />
            )}
          </div>

          {/* Terms */}
          {(contract.paymentTerms || contract.deliveryTerms) && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contract.paymentTerms && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Điều khoản thanh toán</p>
                  <p className="text-sm text-gray-700 mt-1">{contract.paymentTerms}</p>
                </div>
              )}
              {contract.deliveryTerms && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Điều khoản giao hàng</p>
                  <p className="text-sm text-gray-700 mt-1">{contract.deliveryTerms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Contract Content (Vietnamese) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="text-green-700" size={18} />
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
              Nội dung hợp đồng (Tiếng Việt)
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-[500px] overflow-y-auto">
            {contract.contentVi || (
              <p className="text-gray-400 italic">Nội dung tiếng Việt chưa được soạn.</p>
            )}
          </div>
        </div>

        {/* ── Contract Content (English) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="text-blue-600" size={18} />
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
              Contract Content (English)
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-[500px] overflow-y-auto">
            {contract.contentEn || (
              <p className="text-gray-400 italic">English content has not been drafted yet.</p>
            )}
          </div>
        </div>

        {/* ── Signing Form ── */}
        <SigningForm
          contractId={contractId}
          rawToken={rawToken}
          signerName={data.signerName}
          signerRole={data.signerRole}
        />

        {/* ── Footer ── */}
        <footer className="text-center py-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} GreenPeat AgriCoX • Hệ thống ký hợp đồng nội bộ
          </p>
          <p className="text-[10px] text-gray-300 mt-1">
            Đây là hệ thống ký hợp đồng nội bộ, không phải dịch vụ chữ ký số được chứng nhận.
          </p>
        </footer>
      </main>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  );
}
