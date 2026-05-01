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
import { getServerT } from "@/lib/i18n-server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giới thiệu GreenPeat | AgriCoX – Về chúng tôi",
  description: "Tìm hiểu về GreenPeat – đơn vị hàng đầu sản xuất giá thể mụn dừa chất lượng cao.",
};

const iconMap: Record<string, React.ElementType> = {
  Award, Lightbulb, TreePine, Heart,
};

export default async function AboutPage() {
  const { locale, t } = await getServerT();

  const timeline = locale === "en"
    ? [
        { year: "2018", event: "GreenPeat founded in Ben Tre", icon: Building2 },
        { year: "2020", event: "Launched AgriCoX brand – entered export markets", icon: Globe },
        { year: "2022", event: "200+ clients, exporting to 15 countries", icon: Users },
        { year: "2024", event: "Factory expansion, 5,000 ton/month capacity", icon: Leaf },
      ]
    : [
        { year: "2018", event: "Thành lập GreenPeat tại Bến Tre", icon: Building2 },
        { year: "2020", event: "Ra mắt thương hiệu AgriCoX – tham gia xuất khẩu", icon: Globe },
        { year: "2022", event: "Đạt 200+ khách hàng, xuất khẩu 15 quốc gia", icon: Users },
        { year: "2024", event: "Mở rộng nhà máy, công suất 5,000 tấn/tháng", icon: Leaf },
      ];

  const certifications = locale === "en"
    ? [
        { name: "ISO 9001:2015", desc: "Quality Management System" },
        { name: "GlobalGAP", desc: "Good Agricultural Practices" },
        { name: "GACC", desc: "Export Certification" },
        { name: "Organic", desc: "Natural Organic Product" },
      ]
    : [
        { name: "ISO 9001:2015", desc: "Hệ thống quản lý chất lượng" },
        { name: "GlobalGAP", desc: "Thực hành nông nghiệp tốt" },
        { name: "GACC", desc: "Chứng nhận xuất khẩu" },
        { name: "Organic", desc: "Sản phẩm hữu cơ tự nhiên" },
      ];

  const history = locale === "en"
    ? [
        "GreenPeat was established in 2018 in Ben Tre – Vietnam's renowned \"coconut capital.\" Starting as a small facility specializing in coconut by-product processing, GreenPeat quickly grew into a leading enterprise in premium cocopeat substrate manufacturing.",
        "In 2020, the AgriCoX brand was launched, marking a pivotal milestone as GreenPeat officially entered the international export market. With the philosophy \"Quality is the foundation – Innovation is the driver,\" GreenPeat has continuously invested in technology and elevated product standards.",
        "Today, GreenPeat exports to over 15 countries, serving hundreds of farms and high-tech agricultural projects worldwide.",
      ]
    : [
        "GreenPeat được thành lập năm 2018 tại Bến Tre – vùng đất được mệnh danh là \"xứ dừa\" của Việt Nam. Khởi đầu từ một cơ sở nhỏ chuyên thu mua và xử lý phụ phẩm dừa, GreenPeat nhanh chóng phát triển thành doanh nghiệp hàng đầu trong lĩnh vực sản xuất giá thể mụn dừa chất lượng cao.",
        "Năm 2020, thương hiệu AgriCoX ra đời, đánh dấu bước ngoặt quan trọng khi GreenPeat chính thức tham gia thị trường xuất khẩu quốc tế. Với triết lý \"Chất lượng là nền tảng – Đổi mới là động lực\", GreenPeat không ngừng đầu tư công nghệ, mở rộng quy mô và nâng cao tiêu chuẩn sản phẩm.",
        "Đến nay, GreenPeat đã xuất khẩu đến hơn 15 quốc gia, phục vụ hàng trăm trang trại và dự án nông nghiệp công nghệ cao trên toàn thế giới.",
      ];

  const coreValues = locale === "en"
    ? [
        { title: "Quality", description: "Strict control from raw materials to finished products", icon: "Award" },
        { title: "Innovation", description: "Continuous R&D and process improvement", icon: "Lightbulb" },
        { title: "Sustainability", description: "Green production, by-product recycling, environmental protection", icon: "TreePine" },
        { title: "Dedication", description: "Customer-centric approach, attentive service", icon: "Heart" },
      ]
    : [
        { title: "Chất lượng", description: "Kiểm soát nghiêm ngặt từ nguyên liệu đến thành phẩm", icon: "Award" },
        { title: "Đổi mới", description: "Không ngừng nghiên cứu và cải tiến quy trình sản xuất", icon: "Lightbulb" },
        { title: "Bền vững", description: "Sản xuất xanh, tái chế phụ phẩm, bảo vệ môi trường", icon: "TreePine" },
        { title: "Tận tâm", description: "Lấy khách hàng làm trung tâm, phục vụ tận tình", icon: "Heart" },
      ];

  const capacity = locale === "en"
    ? [
        "Factory: 10,000 m² in Ben Tre Industrial Zone",
        "Warehouse: 5,000 m² dedicated storage",
        "Capacity: 5,000 tons of finished cocopeat/month",
        "Team: 120+ staff, 15 agricultural engineers",
        "Lab: Internal EC, pH, moisture testing",
        "Certifications: ISO 9001, GlobalGAP, GACC",
      ]
    : [
        "Nhà máy sản xuất: 10,000 m² tại KCN Bến Tre",
        "Kho bãi: 5,000 m² chuyên dụng",
        "Công suất: 5,000 tấn mụn dừa thành phẩm/tháng",
        "Đội ngũ: 120+ nhân viên, 15 kỹ sư nông nghiệp",
        "Phòng lab: Kiểm định EC, pH, độ ẩm nội bộ",
        "Chứng nhận: ISO 9001, GlobalGAP, GACC",
      ];

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero text-white py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-72 h-72 bg-green-400/10 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-green-200 text-sm mb-6">
            <Building2 size={16} /> {t.about.badge}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            {t.about.title1}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-brown-300">
              {t.about.title2}
            </span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            {t.about.desc}
          </p>
        </div>
      </section>

      {/* History */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title !text-left">
                {locale === "en" ? "Our " : "Lịch sử "}<span className="gradient-text">{locale === "en" ? "History" : "hình thành"}</span>
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-4">
                {history.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            {/* Timeline visual */}
            <div className="space-y-6">
              {timeline.map((item, i) => (
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
              <h3 className="text-xl font-bold text-gray-800 mb-3">{t.about.visionTitle}</h3>
              <p className="text-gray-600 leading-relaxed">{t.about.visionDesc}</p>
            </div>
            <div className="card p-8">
              <div className="w-14 h-14 rounded-2xl bg-brown-100 flex items-center justify-center mb-5">
                <Leaf size={28} className="text-brown-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{t.about.missionTitle}</h3>
              <p className="text-gray-600 leading-relaxed">{t.about.missionDesc}</p>
            </div>
          </div>

          {/* Core values */}
          <div className="text-center mb-10">
            <h2 className="section-title">
              {t.about.valuesTitle.split(" ")[0]} <span className="gradient-text">{t.about.valuesTitle.split(" ").slice(1).join(" ") || ""}</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((val, i) => {
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
              {locale === "en" ? "Production " : "Năng lực "}<span className="gradient-text">{locale === "en" ? "Capacity" : "sản xuất"}</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {capacity.map((item, i) => (
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
            {locale === "en" ? "Certifications & Commitment" : "Chứng nhận & Cam kết"}
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {certifications.map((cert, i) => (
              <div key={i} className="glass-dark rounded-2xl p-6 w-44 text-center">
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
