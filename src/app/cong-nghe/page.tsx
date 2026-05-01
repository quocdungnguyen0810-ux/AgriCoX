import {
  Truck,
  Filter,
  Droplets,
  Timer,
  Layers,
  ClipboardCheck,
  Package,
  Ship,
  Leaf,
  ArrowRight,
  Thermometer,
  Wifi,
  BarChart3,
  Sprout,
} from "lucide-react";
import Link from "next/link";
import { getServerT } from "@/lib/i18n-server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Công nghệ xử lý mụn dừa | GreenPeat AgriCoX",
  description: "Quy trình xử lý mụn dừa 8 bước đạt chuẩn xuất khẩu. Công nghệ kiểm soát chất lượng EC, pH.",
};

const iconMap: Record<string, React.ElementType> = {
  Truck, Filter, Droplets, Timer, Layers, ClipboardCheck, Package, Ship,
};

const processStepsData: Record<string, { step: number; title: string; description: string; icon: string }[]> = {
  vi: [
    { step: 1, title: "Thu gom nguyên liệu", description: "Thu mua vỏ dừa từ vùng nguyên liệu Bến Tre, Long An, Trà Vinh. Phân loại, tách xơ dừa và mụn dừa thô.", icon: "Truck" },
    { step: 2, title: "Sàng lọc & phân loại", description: "Sàng lọc qua nhiều cấp để tách riêng mụn dừa mịn, xơ dừa chips, loại bỏ tạp chất, đất cát.", icon: "Filter" },
    { step: 3, title: "Rửa & xử lý EC", description: "Rửa sạch bằng nước ngọt tuần hoàn, xử lý buffering calcium để giảm EC xuống dưới 0.5 mS/cm.", icon: "Droplets" },
    { step: 4, title: "Ủ hoai & ổn định", description: "Ủ mụn dừa trong điều kiện kiểm soát để ổn định cấu trúc, loại bỏ chất hữu cơ chưa phân hủy.", icon: "Timer" },
    { step: 5, title: "Phối trộn & ép khuôn", description: "Phối trộn tỷ lệ xơ/mụn theo công thức sản phẩm. Ép block hoặc đóng growbag với máy ép thủy lực.", icon: "Layers" },
    { step: 6, title: "Kiểm tra chất lượng", description: "Kiểm tra EC, pH, độ ẩm, khối lượng, kích thước cho mỗi lô. Lấy mẫu phân tích tại phòng lab.", icon: "ClipboardCheck" },
    { step: 7, title: "Đóng gói & bảo quản", description: "Đóng gói bao PE co nhiệt, dán nhãn thương hiệu AgriCoX, xếp pallet, bảo quản trong kho khô ráo.", icon: "Package" },
    { step: 8, title: "Vận chuyển & giao hàng", description: "Đóng container, xuất kho, vận chuyển nội địa hoặc xuất khẩu FOB/CIF theo yêu cầu.", icon: "Ship" },
  ],
  en: [
    { step: 1, title: "Raw Material Collection", description: "Procuring coconut husks from Ben Tre, Long An, Tra Vinh. Sorting, separating coir fiber and raw coir pith.", icon: "Truck" },
    { step: 2, title: "Screening & Grading", description: "Multi-stage screening to separate fine coir pith, coir chips, and remove impurities and sand.", icon: "Filter" },
    { step: 3, title: "Washing & EC Treatment", description: "Cleaned with recirculated fresh water, calcium buffering to reduce EC below 0.5 mS/cm.", icon: "Droplets" },
    { step: 4, title: "Composting & Stabilization", description: "Controlled composting to stabilize structure, removing incompletely decomposed organic matter.", icon: "Timer" },
    { step: 5, title: "Blending & Pressing", description: "Blending fiber/pith ratio per product formula. Pressing blocks or filling growbags with hydraulic press.", icon: "Layers" },
    { step: 6, title: "Quality Inspection", description: "Testing EC, pH, moisture, weight, and dimensions per batch. Lab sampling and analysis.", icon: "ClipboardCheck" },
    { step: 7, title: "Packing & Storage", description: "Heat-shrink PE packaging, AgriCoX labeling, palletizing, and dry warehouse storage.", icon: "Package" },
    { step: 8, title: "Shipping & Delivery", description: "Container loading, dispatch, domestic transport or FOB/CIF export per client request.", icon: "Ship" },
  ],
};

const qualityData: Record<string, { title: string; desc: string; value: string }[]> = {
  vi: [
    { title: "Kiểm tra EC", desc: "Đo điện dẫn (EC) bằng thiết bị chuyên dụng, đảm bảo < 0.5 mS/cm.", value: "< 0.5 mS/cm" },
    { title: "Kiểm tra pH", desc: "Đo pH bằng pH meter kỹ thuật số, đảm bảo mức 5.5 – 6.5.", value: "5.5 – 6.5" },
    { title: "Kiểm tra độ ẩm", desc: "Đo độ ẩm bằng cân sấy, đảm bảo < 20% để bảo quản tối ưu.", value: "< 20%" },
    { title: "Lấy mẫu & báo cáo", desc: "Mỗi lô hàng được lấy mẫu phân tích, cấp chứng nhận kèm theo.", value: "100% lô hàng" },
  ],
  en: [
    { title: "EC Testing", desc: "Measuring conductivity (EC) with specialized equipment, ensuring < 0.5 mS/cm.", value: "< 0.5 mS/cm" },
    { title: "pH Testing", desc: "Measuring pH with digital meter, ensuring optimal 5.5 – 6.5 range.", value: "5.5 – 6.5" },
    { title: "Moisture Testing", desc: "Measuring moisture with drying scale, ensuring < 20% for optimal storage.", value: "< 20%" },
    { title: "Sampling & Reports", desc: "Every batch is sampled and analyzed, with quality certificates issued.", value: "100% batches" },
  ],
};

const agriTechData: Record<string, { title: string; desc: string }[]> = {
  vi: [
    { title: "Nhà kính & nhà màng", desc: "Giá thể AgriCoX tối ưu cho hệ thống nhà kính hiện đại, kiểm soát môi trường trồng trọt chính xác." },
    { title: "Tưới nhỏ giọt", desc: "Cocopeat có cấu trúc xốp, phân phối nước đều, tiết kiệm 40-60% nước." },
    { title: "Cảm biến IoT", desc: "Tích hợp cảm biến theo dõi độ ẩm, EC, pH theo thời gian thực. Quản lý dinh dưỡng tự động." },
    { title: "Quản lý dinh dưỡng", desc: "Phối hợp công nghệ trộn dung dịch dinh dưỡng tự động, tối ưu hóa N-P-K." },
  ],
  en: [
    { title: "Greenhouses", desc: "AgriCoX substrates optimized for modern greenhouse systems with precise climate control." },
    { title: "Drip Irrigation", desc: "Cocopeat's porous structure distributes water evenly, saving 40-60% water." },
    { title: "IoT Sensors", desc: "Real-time monitoring of moisture, EC, pH. Automated nutrition management." },
    { title: "Nutrient Management", desc: "Automated nutrient solution mixing technology, optimizing N-P-K ratios." },
  ],
};

const agriIcons = [Sprout, Droplets, Wifi, BarChart3];
const qualityIcons = [Droplets, Thermometer, Droplets, ClipboardCheck];

export default async function TechnologyPage() {
  const { locale, t } = await getServerT();
  const processSteps = processStepsData[locale] || processStepsData.vi;
  const qualityCards = qualityData[locale] || qualityData.vi;
  const agriCards = agriTechData[locale] || agriTechData.vi;

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-green-400/10 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-green-200 text-sm mb-6">
            <Layers size={16} /> {t.tech.badge}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            {t.tech.title1}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-brown-300">
              {t.tech.title2}
            </span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            {t.tech.desc}
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="text-center mb-14">
            <h2 className="section-title">
              {t.tech.processTitle}{" "}
            </h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-300 via-green-500 to-brown-500 hidden md:block" />
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-300 via-green-500 to-brown-500 md:hidden" />

            <div className="space-y-8">
              {processSteps.map((step, i) => {
                const Icon = iconMap[step.icon] || Package;
                const isLeft = i % 2 === 0;
                return (
                  <div
                    key={step.step}
                    className={`relative flex items-start gap-6 ${
                      isLeft ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    {/* Dot */}
                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-lg z-10 mt-6" />

                    {/* Content */}
                    <div className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${isLeft ? "md:pr-8 md:text-right" : "md:pl-8"}`}>
                      <div className={`card p-6`}>
                        <div className={`flex items-center gap-3 mb-3 ${isLeft ? "md:flex-row-reverse" : ""}`}>
                          <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center shrink-0 shadow-lg shadow-green-600/20">
                            <Icon size={22} className="text-white" />
                          </div>
                          <div>
                            <div className="text-xs text-green-500 font-bold">
                              {locale === "en" ? `Step ${step.step}` : `Bước ${step.step}`}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {step.title}
                            </h3>
                          </div>
                        </div>
                        <p className={`text-sm text-gray-500 leading-relaxed ${isLeft ? "md:text-right" : ""}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Spacer for opposite side */}
                    <div className="hidden md:block md:w-[calc(50%-2rem)]" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Quality Control */}
      <section className="section bg-gray-soft">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title">
              {t.tech.qualityTitle}
            </h2>
            <p className="section-subtitle">
              {t.tech.qualityDesc}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {qualityCards.map((item, i) => {
              const QIcon = qualityIcons[i] || Droplets;
              return (
                <div key={i} className="card p-6 text-center group">
                  <div className="w-14 h-14 rounded-2xl gradient-green flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-600/20">
                    <QIcon size={26} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                  <div className="text-2xl font-extrabold gradient-text mb-2">{item.value}</div>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Agri Technology */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title">
              {locale === "en"
                ? <>Agricultural <span className="gradient-text">Technology</span></>
                : <>Ứng dụng công nghệ{" "}<span className="gradient-text">nông nghiệp</span></>}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {agriCards.map((item, i) => {
              const AIcon = agriIcons[i] || Sprout;
              return (
                <div key={i} className="flex gap-5 p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-green-200 transition-colors group">
                  <div className="w-14 h-14 rounded-2xl gradient-green flex items-center justify-center shrink-0 shadow-lg shadow-green-600/20 group-hover:shadow-green-600/30 transition-shadow">
                    <AIcon size={26} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section gradient-hero text-white text-center">
        <div className="container-custom">
          <Leaf size={48} className="text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            {locale === "en" ? "Need technical consulting?" : "Cần tư vấn kỹ thuật?"}
          </h2>
          <p className="text-green-200 text-lg mb-8 max-w-xl mx-auto">
            {locale === "en"
              ? "Our agricultural engineers are ready to help you find the optimal substrate for your project."
              : "Đội ngũ kỹ sư nông nghiệp GreenPeat sẵn sàng hỗ trợ bạn chọn giải pháp giá thể tối ưu cho dự án."}
          </p>
          <Link href="/lien-he" className="btn-accent !text-base !py-3.5 !px-8">
            {locale === "en" ? "Contact Us" : "Liên hệ tư vấn"} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
