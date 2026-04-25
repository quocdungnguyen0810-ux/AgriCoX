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
} from "lucide-react";
import { products } from "@/data/products";

export default function OrderPage() {
  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In Phase 2, this will send to the backend
    console.log("Order request:", formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center section">
        <div className="text-center max-w-md mx-auto animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-3">
            Yêu cầu đã được gửi!
          </h2>
          <p className="text-gray-500 mb-6">
            Cảm ơn bạn đã quan tâm đến sản phẩm AgriCoX. Đội ngũ sales của 
            chúng tôi sẽ liên hệ trong vòng 2 giờ làm việc.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                name: "",
                company: "",
                phone: "",
                email: "",
                product: "",
                quantity: "",
                location: "",
                message: "",
              });
            }}
            className="btn-secondary"
          >
            Gửi yêu cầu khác
          </button>
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
            <FileText size={16} /> Đặt hàng
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Đặt hàng &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-accent to-yellow-warm">
              Yêu cầu báo giá
            </span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Điền thông tin bên dưới để nhận báo giá tốt nhất. 
            Đội ngũ sales sẽ phản hồi trong vòng 2 giờ làm việc.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="section bg-white">
        <div className="container-custom max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="form-label">
                  <User size={14} className="inline mr-1.5" />
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              {/* Company */}
              <div>
                <label className="form-label">
                  <Building2 size={14} className="inline mr-1.5" />
                  Công ty
                </label>
                <input
                  type="text"
                  placeholder="Tên công ty / trang trại"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="form-label">
                  <Phone size={14} className="inline mr-1.5" />
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0909 xxx xxx"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              {/* Email */}
              <div>
                <label className="form-label">
                  <Mail size={14} className="inline mr-1.5" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="form-input"
                />
              </div>
            </div>

            {/* Product */}
            <div>
              <label className="form-label">
                <Package size={14} className="inline mr-1.5" />
                Sản phẩm quan tâm *
              </label>
              <select
                required
                value={formData.product}
                onChange={(e) =>
                  setFormData({ ...formData, product: e.target.value })
                }
                className="form-input"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
                <option value="Khác">Sản phẩm khác / Tư vấn</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Quantity */}
              <div>
                <label className="form-label">
                  <Hash size={14} className="inline mr-1.5" />
                  Số lượng dự kiến
                </label>
                <input
                  type="text"
                  placeholder="VD: 2,400 bao / 1 container"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              {/* Location */}
              <div>
                <label className="form-label">
                  <MapPin size={14} className="inline mr-1.5" />
                  Địa điểm giao hàng
                </label>
                <input
                  type="text"
                  placeholder="Tỉnh / Thành phố / Quốc gia"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="form-input"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="form-label">
                <MessageSquare size={14} className="inline mr-1.5" />
                Nội dung yêu cầu
              </label>
              <textarea
                rows={4}
                placeholder="Mô tả chi tiết yêu cầu, quy cách, thời gian giao hàng mong muốn..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="form-input resize-none"
              />
            </div>

            <button type="submit" className="btn-primary w-full !py-4 !text-base">
              <Send size={18} /> Gửi yêu cầu báo giá
            </button>

            <p className="text-center text-sm text-gray-400">
              Thông tin của bạn được bảo mật tuyệt đối. Chúng tôi sẽ liên hệ 
              trong vòng 2 giờ làm việc.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
