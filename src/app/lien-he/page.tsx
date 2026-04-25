"use client";

import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  MessageCircle,
  User,
  MessageSquare,
} from "lucide-react";
import { companyInfo } from "@/data/content";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form:", formData);
    setSubmitted(true);
  };

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-green-400/10 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-green-200 text-sm mb-6">
            <Phone size={16} /> Liên hệ
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Liên hệ{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-brown-300">
              với chúng tôi
            </span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Đội ngũ GreenPeat luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ qua bất kỳ kênh nào phù hợp.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact info */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-extrabold text-gray-800 mb-6">
                Thông tin liên hệ
              </h2>

              {[
                {
                  icon: MapPin,
                  title: "Địa chỉ",
                  content: companyInfo.address,
                  href: null,
                },
                {
                  icon: Phone,
                  title: "Hotline",
                  content: companyInfo.hotline,
                  href: `tel:${companyInfo.hotline?.replace(/\s/g, "")}`,
                },
                {
                  icon: Phone,
                  title: "Điện thoại",
                  content: companyInfo.phone,
                  href: `tel:${companyInfo.phone?.replace(/\s/g, "")}`,
                },
                {
                  icon: Mail,
                  title: "Email",
                  content: companyInfo.email,
                  href: `mailto:${companyInfo.email}`,
                },
                {
                  icon: Mail,
                  title: "Email Sales",
                  content: companyInfo.salesEmail,
                  href: `mailto:${companyInfo.salesEmail}`,
                },
                {
                  icon: MessageCircle,
                  title: "Zalo",
                  content: companyInfo.zalo,
                  href: `https://zalo.me/${companyInfo.zalo?.replace(/\s/g, "")}`,
                },
                {
                  icon: MessageCircle,
                  title: "WhatsApp",
                  content: companyInfo.whatsapp,
                  href: `https://wa.me/${companyInfo.whatsapp?.replace(/[+\s]/g, "")}`,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                    <item.icon size={20} className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">{item.title}</div>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-gray-800 font-medium hover:text-green-600 transition-colors"
                      >
                        {item.content}
                      </a>
                    ) : (
                      <span className="text-gray-800 font-medium">
                        {item.content}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Working hours */}
              <div className="p-5 rounded-2xl bg-green-50 border border-green-100">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={18} className="text-green-600" />
                  <span className="font-bold text-gray-800">Giờ làm việc</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Thứ 2 – Thứ 6: 8:00 – 17:30</div>
                  <div>Thứ 7: 8:00 – 12:00</div>
                  <div className="text-gray-400">Chủ nhật: Nghỉ</div>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="card p-10 text-center animate-scale-in">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Tin nhắn đã gửi!
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Chúng tôi sẽ phản hồi sớm nhất có thể.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", phone: "", email: "", message: "" });
                    }}
                    className="btn-secondary"
                  >
                    Gửi tin nhắn khác
                  </button>
                </div>
              ) : (
                <div className="card p-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    Gửi tin nhắn nhanh
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="form-label">
                          <User size={14} className="inline mr-1" /> Họ tên *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="form-input"
                          placeholder="Họ và tên"
                        />
                      </div>
                      <div>
                        <label className="form-label">
                          <Phone size={14} className="inline mr-1" /> Điện thoại *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="form-input"
                          placeholder="0909 xxx xxx"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">
                        <Mail size={14} className="inline mr-1" /> Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="form-input"
                        placeholder="email@company.com"
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        <MessageSquare size={14} className="inline mr-1" /> Nội dung *
                      </label>
                      <textarea
                        rows={5}
                        required
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        className="form-input resize-none"
                        placeholder="Nội dung bạn muốn trao đổi..."
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full !py-3.5">
                      <Send size={18} /> Gửi tin nhắn
                    </button>
                  </form>
                </div>
              )}

              {/* Map */}
              <div className="mt-8 card overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <MapPin size={18} className="text-green-600" />
                    Bản đồ
                  </h3>
                </div>
                <div className="aspect-[16/9] bg-gray-100">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62889.94652289!2d106.32!3d10.24!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310aa7e5a87cba07%3A0x2a3542ea815a2536!2sTp.%20B%E1%BA%BFn%20Tre!5e0!3m2!1svi!2svn!4v1"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Bản đồ GreenPeat"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
