import {
  Award,
  Lightbulb,
  TreePine,
  Heart,
  CheckCircle2,
  Building2,
  Users,
  Globe,
  Leaf,
} from "lucide-react";
import { aboutContent } from "@/data/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giới thiệu GreenPeat | AgriCoX – Về chúng tôi",
  description: "Tìm hiểu về GreenPeat – đơn vị hàng đầu sản xuất giá thể mụn dừa chất lượng cao. Lịch sử, tầm nhìn, năng lực sản xuất và cam kết bền vững.",
};

const iconMap: Record<string, React.ElementType> = {
  Award, Lightbulb, TreePine, Heart,
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero text-white py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-72 h-72 bg-green-400/10 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-green-200 text-sm mb-6">
            <Building2 size={16} /> Về GreenPeat
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Câu chuyện{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-brown-300">
              GreenPeat
            </span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Từ vùng đất dừa Bến Tre, chúng tôi mang giải pháp giá thể mụn dừa 
            chất lượng cao đến nông nghiệp toàn cầu.
          </p>
        </div>
      </section>

      {/* History */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title !text-left">
                Lịch sử <span className="gradient-text">hình thành</span>
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-4">
                {aboutContent.history.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            {/* Timeline visual */}
            <div className="space-y-6">
              {[
                { year: "2018", event: "Thành lập GreenPeat tại Bến Tre", icon: Building2 },
                { year: "2020", event: "Ra mắt thương hiệu AgriCoX – tham gia xuất khẩu", icon: Globe },
                { year: "2022", event: "Đạt 200+ khách hàng, xuất khẩu 15 quốc gia", icon: Users },
                { year: "2024", event: "Mở rộng nhà máy, công suất 5,000 tấn/tháng", icon: Leaf },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center shrink-0 shadow-lg shadow-green-600/20">
                    <item.icon size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-green-600">{item.year}</div>
                    <div className="text-gray-700 font-medium">{item.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section bg-gray-soft">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="card p-8">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-5">
                <Globe size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Tầm nhìn</h3>
              <p className="text-gray-600 leading-relaxed">{aboutContent.vision}</p>
            </div>
            <div className="card p-8">
              <div className="w-14 h-14 rounded-2xl bg-brown-100 flex items-center justify-center mb-5">
                <Leaf size={28} className="text-brown-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Sứ mệnh</h3>
              <p className="text-gray-600 leading-relaxed">{aboutContent.mission}</p>
            </div>
          </div>

          {/* Core values */}
          <div className="text-center mb-10">
            <h2 className="section-title">
              Giá trị <span className="gradient-text">cốt lõi</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {aboutContent.coreValues.map((val, i) => {
              const Icon = iconMap[val.icon] || Award;
              return (
                <div key={i} className="card p-6 text-center group">
                  <div className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-600/20 group-hover:shadow-green-600/30 transition-shadow">
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{val.title}</h3>
                  <p className="text-sm text-gray-500">{val.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Production Capacity */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="section-title">
              Năng lực <span className="gradient-text">sản xuất</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {aboutContent.capacity.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100"
              >
                <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                <span className="text-gray-700 text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="section gradient-hero text-white">
        <div className="container-custom text-center">
          <h2 className="section-title !text-white mb-10">
            Chứng nhận & Cam kết
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { name: "ISO 9001:2015", desc: "Hệ thống quản lý chất lượng" },
              { name: "GlobalGAP", desc: "Thực hành nông nghiệp tốt" },
              { name: "GACC", desc: "Chứng nhận xuất khẩu" },
              { name: "Organic", desc: "Sản phẩm hữu cơ tự nhiên" },
            ].map((cert, i) => (
              <div
                key={i}
                className="glass-dark rounded-2xl p-6 w-44 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <Award size={24} className="text-green-300" />
                </div>
                <div className="font-bold text-white text-sm">{cert.name}</div>
                <div className="text-xs text-green-300 mt-1">{cert.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
