"use client";

import { useState } from "react";
import {
  FileText,
  Send,
  CheckCircle2,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Hash,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useT } from "@/context/LanguageContext";

interface OrderClientProps {
  productList: { id: string; name: string }[];
}

export default function OrderClient({ productList }: OrderClientProps) {
  const t = useT();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rfqCode, setRfqCode] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    product: "",
    quantity: "",
    location: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              productName: formData.product,
              quantity: parseInt(formData.quantity) || 1,
              specification: formData.quantity,
            },
          ],
          contactName: formData.name,
          companyName: formData.company,
          contactPhone: formData.phone,
          contactEmail: formData.email,
          deliveryLocation: formData.location,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.order.errorGeneric);
      }

      setRfqCode(data.rfqCode);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.order.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center section">
        <div className="text-center max-w-md mx-auto animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
            {t.order.successTitle}
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 font-mono font-bold text-lg mb-4">
            <FileText size={18} /> {rfqCode}
          </div>
          <p className="text-gray-500 mb-6">
            {t.order.successDesc}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSubmitted(false);
                setRfqCode("");
                setFormData({
                  name: "", company: "", phone: "", email: "",
                  product: "", quantity: "", location: "", message: "",
                });
              }}
              className="btn-secondary"
            >
              {t.order.sendAnother}
            </button>
            <Link href="/san-pham" className="btn-primary">
              {t.order.viewProducts}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-green-200 text-sm mb-6">
            <FileText size={16} /> {t.order.badge}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            {t.order.title1}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-accent to-yellow-warm">
              {t.order.title2}
            </span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            {t.order.desc}
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="section bg-white">
        <div className="container-custom max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">
                  <User size={14} className="inline mr-1.5" /> {t.order.fullName} *
                </label>
                <input
                  type="text" required placeholder="Nguyễn Văn A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">
                  <Building2 size={14} className="inline mr-1.5" /> {t.order.company}
                </label>
                <input
                  type="text" placeholder="Tên công ty / trang trại"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">
                  <Phone size={14} className="inline mr-1.5" /> {t.order.phone} *
                </label>
                <input
                  type="tel" required placeholder="0909 xxx xxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">
                  <Mail size={14} className="inline mr-1.5" /> {t.order.email}
                </label>
                <input
                  type="email" placeholder="email@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label className="form-label">
                <Package size={14} className="inline mr-1.5" /> {t.order.product} *
              </label>
              <select
                required
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="form-input"
              >
                <option value="">{t.order.selectProduct}</option>
                {productList.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
                <option value="Khác">{t.order.otherProduct}</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">
                  <Hash size={14} className="inline mr-1.5" /> {t.order.quantity}
                </label>
                <input
                  type="text" placeholder={t.order.quantityPlaceholder}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">
                  <MapPin size={14} className="inline mr-1.5" /> {t.order.location}
                </label>
                <input
                  type="text" placeholder={t.order.locationPlaceholder}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label className="form-label">
                <MessageSquare size={14} className="inline mr-1.5" /> {t.order.message}
              </label>
              <textarea
                rows={4}
                placeholder={t.order.messagePlaceholder}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="form-input resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-4 !text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> {t.order.submitting}</>
              ) : (
                <><Send size={18} /> {t.order.submit}</>
              )}
            </button>

            <p className="text-center text-sm text-gray-400">
              {t.order.privacy}
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
