"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Leaf,
  Shield,
  Factory,
  Globe,
  Sprout,
  Recycle,
  CheckCircle2,
  ChevronRight,
  Phone,
  Star,
} from "lucide-react";
import { products } from "@/data/products";
import { stats, strengths } from "@/data/content";
import { useCart } from "@/context/CartContext";

const iconMap: Record<string, React.ElementType> = {
  Leaf, Shield, Factory, Globe, Sprout, Recycle,
};

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.1 }
    );
    el.querySelectorAll(".reveal").forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function HomePage() {
  const containerRef = useReveal();
  const { addItem } = useCart();
  const featuredProducts = products.filter((p) => p.featured);

  return (
    <div ref={containerRef}>
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden gradient-hero">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-green-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-brown-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="container-custom relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm mb-6 animate-fade-in-up">
                <Leaf size={16} className="text-green-300" />
                <span className="text-green-200">Thương hiệu AgriCoX</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 animate-fade-in-up delay-100">
                Giải pháp giá thể
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-yellow-warm">
                  mụn dừa
                </span>{" "}
                & công nghệ
                <br />
                nông nghiệp{" "}
                <span className="text-brown-300">bền vững</span>
              </h1>

              <p className="text-lg text-green-200 mb-8 leading-relaxed max-w-xl animate-fade-in-up delay-200">
                GreenPeat cung cấp cocopeat growbag, đất mụn dừa xử lý đạt chuẩn
                xuất khẩu – phù hợp nhà kính, thủy canh, nông nghiệp công nghệ
                cao tại 15+ quốc gia trên thế giới.
              </p>

              <div className="flex flex-wrap gap-4 mb-10 animate-fade-in-up delay-300">
                <Link href="/dat-hang" className="btn-accent !text-base !py-3.5 !px-7">
                  Nhận báo giá <ArrowRight size={18} />
                </Link>
                <Link href="/san-pham" className="btn-secondary !border-white/30 !text-white hover:!bg-white/10 !text-base !py-3.5 !px-7">
                  Xem sản phẩm
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 animate-fade-in-up delay-400">
                {[
                  "ISO 9001",
                  "GlobalGAP",
                  "EC < 0.5",
                ].map((badge) => (
                  <div
                    key={badge}
                    className="flex items-center gap-2 text-sm text-green-300"
                  >
                    <CheckCircle2 size={16} className="text-green-400" />
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Visual */}
            <div className="hidden lg:block animate-fade-in-right delay-200">
              <div className="relative">
                {/* Main product visual */}
                <div className="w-full aspect-square max-w-lg mx-auto relative">
                  <div className="absolute inset-4 rounded-3xl overflow-hidden border border-white/10">
                    <Image
                      src="/images/greenhouse.png"
                      alt="Nhà kính nông nghiệp AgriCoX"
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 1024px) 0vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-green-900/70 via-green-900/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                      <h3 className="text-2xl font-bold text-white mb-1">
                        AgriCoX Growbag
                      </h3>
                      <p className="text-green-200 text-sm mb-3">
                        Premium Cocopeat Substrate
                      </p>
                      <div className="flex justify-center gap-3">
                        {[
                          { label: "EC", value: "< 0.5" },
                          { label: "pH", value: "5.5-6.5" },
                          { label: "Ẩm", value: "< 20%" },
                        ].map((spec) => (
                          <div
                            key={spec.label}
                            className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-green-200"
                          >
                            <div className="font-bold text-white">
                              {spec.value}
                            </div>
                            {spec.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Floating badges */}
                  <div className="absolute -top-2 -right-2 px-4 py-2 rounded-xl glass text-sm font-bold text-green-700 animate-float" style={{ animationDelay: "0.5s" }}>
                    🌿 100% Organic
                  </div>
                  <div className="absolute -bottom-2 -left-2 px-4 py-2 rounded-xl glass text-sm font-bold text-brown-600 animate-float" style={{ animationDelay: "1s" }}>
                    📦 Xuất khẩu 15+ nước
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z"
              fill="var(--color-cream)"
            />
          </svg>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="py-6 -mt-6 relative z-10">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="reveal card text-center p-6 hover:border-green-200"
              >
                <div className="text-3xl md:text-4xl font-extrabold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-brown-500 font-semibold uppercase tracking-wider mb-1">
                  {stat.unit}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STRENGTHS SECTION ===== */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title reveal">
              Tại sao chọn{" "}
              <span className="gradient-text">GreenPeat?</span>
            </h2>
            <p className="section-subtitle reveal">
              Chúng tôi tự hào là đối tác tin cậy trong lĩnh vực giá thể mụn dừa,
              mang đến giải pháp toàn diện cho nông nghiệp hiện đại.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strengths.map((item, i) => {
              const Icon = iconMap[item.icon] || Leaf;
              return (
                <div
                  key={i}
                  className="reveal card p-7 group"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-14 h-14 rounded-2xl gradient-green flex items-center justify-center mb-5 shadow-lg shadow-green-600/20 group-hover:shadow-green-600/30 transition-shadow">
                    <Icon size={26} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="section bg-gray-soft">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title reveal">
              Sản phẩm{" "}
              <span className="gradient-text">nổi bật</span>
            </h2>
            <p className="section-subtitle reveal">
              Khám phá các dòng sản phẩm giá thể mụn dừa chất lượng cao, 
              được thiết kế tối ưu cho từng ứng dụng nông nghiệp.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, i) => (
              <div
                key={product.id}
                className="reveal card group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Product image */}
                <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-green-50 to-brown-50">
                  {(product.slug === "cocopeat-growbag-agricox" || product.slug === "dat-mun-dua-xu-ly" || product.slug === "cocopeat-block-5kg" || product.slug === "gia-the-trong-rau-dua-luoi") ? (
                    <Image
                      src={product.slug === "cocopeat-growbag-agricox" ? "/images/growbag.png" : product.slug === "dat-mun-dua-xu-ly" || product.slug === "cocopeat-block-5kg" ? "/images/cocopeat-block.png" : "/images/growbag.png"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf size={48} className="text-green-300 group-hover:scale-110 transition-transform" />
                    </div>
                  )}
                  {/* Category badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-green-600 text-white text-xs font-semibold z-10">
                    {product.category}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  {/* Specs preview */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {product.specifications.ec && (
                      <span className="px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                        EC {product.specifications.ec}
                      </span>
                    )}
                    {product.specifications.ph && (
                      <span className="px-2 py-1 rounded-md bg-brown-50 text-brown-600 text-xs font-medium">
                        pH {product.specifications.ph}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/san-pham/${product.slug}`}
                      className="flex-1 text-center text-sm py-2.5 rounded-lg bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition-colors"
                    >
                      Chi tiết
                    </Link>
                    <button
                      onClick={() =>
                        addItem({
                          productId: product.id,
                          productName: product.name,
                          quantity: 1,
                          specification: product.packaging,
                          image: product.image,
                        })
                      }
                      className="flex-1 text-center text-sm py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                    >
                      Thêm RFQ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 reveal">
            <Link href="/san-pham" className="btn-secondary">
              Xem tất cả sản phẩm <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== PROCESS PREVIEW ===== */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="reveal">
              <h2 className="section-title !text-left">
                Quy trình sản xuất{" "}
                <span className="gradient-text">đạt chuẩn</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Mỗi sản phẩm AgriCoX đều trải qua quy trình xử lý 8 bước nghiêm
                ngặt, từ thu gom nguyên liệu đến kiểm định chất lượng cuối cùng.
                Đảm bảo EC thấp, pH ổn định, không chứa mầm bệnh.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "Thu gom & phân loại nguyên liệu",
                  "Rửa sạch & xử lý EC, buffering calcium",
                  "Ủ hoai & ổn định cấu trúc",
                  "Kiểm tra chất lượng bằng lab nội bộ",
                  "Đóng gói & bảo quản đạt chuẩn",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
              <Link href="/cong-nghe" className="btn-primary">
                Tìm hiểu công nghệ <ArrowRight size={18} />
              </Link>
            </div>

            {/* Process visual */}
            <div className="reveal">
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-green-50 to-brown-50 border border-green-100">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { step: "01", label: "Thu gom", color: "bg-green-100 text-green-700" },
                    { step: "02", label: "Sàng lọc", color: "bg-green-200 text-green-800" },
                    { step: "03", label: "Rửa & xử lý EC", color: "bg-green-300 text-green-900" },
                    { step: "04", label: "Ủ hoai", color: "bg-brown-100 text-brown-700" },
                    { step: "05", label: "Ép khuôn", color: "bg-brown-200 text-brown-700" },
                    { step: "06", label: "Kiểm tra CL", color: "bg-orange-100 text-orange-700" },
                    { step: "07", label: "Đóng gói", color: "bg-green-100 text-green-700" },
                    { step: "08", label: "Giao hàng", color: "bg-green-600 text-white" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className={`${item.color} rounded-xl p-4 text-center transition-transform hover:scale-105`}
                    >
                      <div className="text-2xl font-extrabold opacity-50">
                        {item.step}
                      </div>
                      <div className="text-sm font-semibold">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-72 h-72 bg-green-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-brown-400/10 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-12">
            <h2 className="section-title reveal !text-white">
              Khách hàng nói gì về chúng tôi
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                quote:
                  "AgriCoX growbag giúp chúng tôi kiểm soát dinh dưỡng tốt hơn, dưa lưới đạt trọng lượng 1.8kg/quả.",
                author: "Nguyễn Văn Minh",
                role: "Chủ trang trại dưa lưới, Đà Lạt",
              },
              {
                quote:
                  "GreenPeat is our most reliable supplier. Quality is consistent and documentation is always perfect.",
                author: "Mr. Tanaka",
                role: "Procurement Manager, Tokyo",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="reveal glass-dark rounded-2xl p-7"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-warm fill-yellow-warm" />
                  ))}
                </div>
                <p className="text-green-100 leading-relaxed mb-5 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div className="font-bold text-white">{t.author}</div>
                  <div className="text-sm text-green-300">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="reveal rounded-3xl gradient-warm p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-brown-700/80 to-brown-600/80" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Sẵn sàng nâng tầm nông nghiệp?
              </h2>
              <p className="text-brown-100 text-lg mb-8 max-w-2xl mx-auto">
                Liên hệ ngay để nhận tư vấn chuyên sâu và báo giá tốt nhất cho
                dự án nông nghiệp của bạn.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/dat-hang" className="btn-accent !text-base !py-3.5 !px-8">
                  Nhận báo giá miễn phí <ArrowRight size={18} />
                </Link>
                <a
                  href="tel:+842751234567"
                  className="btn-secondary !border-white/40 !text-white hover:!bg-white/20 !text-base !py-3.5 !px-8"
                >
                  <Phone size={18} /> Gọi ngay: 1900 636 868
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
