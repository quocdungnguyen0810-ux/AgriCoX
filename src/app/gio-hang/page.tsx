"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  ArrowLeft,
  FileText,
  User,
  Building2,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useT } from "@/context/LanguageContext";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const t = useT();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rfqCode, setRfqCode] = useState("");
  const [contactInfo, setContactInfo] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    notes: "",
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
          items: items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            specification: item.specification,
          })),
          contactName: contactInfo.name,
          companyName: contactInfo.company,
          contactPhone: contactInfo.phone,
          contactEmail: contactInfo.email,
          message: contactInfo.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Có lỗi xảy ra");
      }

      setRfqCode(data.rfqCode);
      setSubmitted(true);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra. Vui lòng thử lại.");
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
            {t.cart.successTitle}
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 font-mono font-bold text-lg mb-4">
            <FileText size={18} /> {rfqCode}
          </div>
          <p className="text-gray-500 mb-6">
            {t.cart.successDesc}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/san-pham" className="btn-primary">
              {t.cart.continueShopping}
            </Link>
            <Link href="/" className="btn-secondary">
              {t.cart.goHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero text-white py-12 md:py-16 relative overflow-hidden">
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            <ShoppingCart size={32} className="inline mr-2 -mt-1" />
            {t.cart.title}
          </h1>
          <p className="text-green-200">
            {t.cart.subtitle}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-custom max-w-4xl">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart size={64} className="text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-600 mb-2">
                {t.cart.empty}
              </h2>
              <p className="text-gray-400 mb-6">
                {t.cart.emptyDesc}
              </p>
              <Link href="/san-pham" className="btn-primary">
                <ArrowLeft size={18} /> {t.cart.viewProducts}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
                  <AlertCircle size={20} />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Cart items */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-800">
                    {t.cart.items} ({items.length})
                  </h2>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    {t.cart.clearAll}
                  </button>
                </div>

                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="card p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                  >
                    <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <ShoppingCart size={24} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-400">{item.specification}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.productId,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-16 text-center font-bold text-gray-800 border border-gray-200 rounded-lg py-1.5"
                          min="1"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact info */}
              <div className="card p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {t.cart.contactInfo}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">
                      <User size={14} className="inline mr-1" /> {t.cart.fullName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactInfo.name}
                      onChange={(e) =>
                        setContactInfo({ ...contactInfo, name: e.target.value })
                      }
                      className="form-input"
                      placeholder="Họ và tên"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      <Building2 size={14} className="inline mr-1" /> {t.cart.company}
                    </label>
                    <input
                      type="text"
                      value={contactInfo.company}
                      onChange={(e) =>
                        setContactInfo({
                          ...contactInfo,
                          company: e.target.value,
                        })
                      }
                      className="form-input"
                      placeholder="Tên công ty"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      <Phone size={14} className="inline mr-1" /> {t.cart.phone} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactInfo.phone}
                      onChange={(e) =>
                        setContactInfo({ ...contactInfo, phone: e.target.value })
                      }
                      className="form-input"
                      placeholder="0909 xxx xxx"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      <Mail size={14} className="inline mr-1" /> {t.cart.email}
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) =>
                        setContactInfo({ ...contactInfo, email: e.target.value })
                      }
                      className="form-input"
                      placeholder="email@company.com"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="form-label">{t.cart.notes}</label>
                  <textarea
                    rows={3}
                    value={contactInfo.notes}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, notes: e.target.value })
                    }
                    className="form-input resize-none"
                    placeholder={t.cart.notesPlaceholder}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-4 !text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> {t.cart.submitting}
                  </>
                ) : (
                  <>
                    <Send size={18} /> {t.cart.submit}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
