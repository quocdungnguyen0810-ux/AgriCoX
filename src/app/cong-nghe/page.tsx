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
import { processSteps } from "@/data/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Công nghệ xử lý mụn dừa | GreenPeat AgriCoX",
  description: "Quy trình xử lý mụn dừa 8 bước đạt chuẩn xuất khẩu. Công nghệ kiểm soát chất lượng EC, pH. Ứng dụng công nghệ nông nghiệp cao.",
};

const iconMap: Record<string, React.ElementType> = {
  Truck, Filter, Droplets, Timer, Layers, ClipboardCheck, Package, Ship,
};

export default function TechnologyPage() {
  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-green-400/10 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-green-200 text-sm mb-6">
            <Layers size={16} /> Công nghệ
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Công nghệ xử lý{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-brown-300">
              mụn dừa
            </span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Quy trình 8 bước nghiêm ngặt đảm bảo chất lượng đạt chuẩn xuất khẩu quốc tế.
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="text-center mb-14">
            <h2 className="section-title">
              Quy trình sản xuất{" "}
              <span className="gradient-text">8 bước</span>
            </h2>
            <p className="section-subtitle">
              Mỗi sản phẩm AgriCoX đều trải qua quy trình xử lý toàn diện,
              đảm bảo chất lượng đồng nhất cho mọi lô hàng.
            </p>
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
                      <div className={`card p-6 ${isLeft ? "" : ""}`}>
                        <div className={`flex items-center gap-3 mb-3 ${isLeft ? "md:flex-row-reverse" : ""}`}>
                          <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center shrink-0 shadow-lg shadow-green-600/20">
                            <Icon size={22} className="text-white" />
                          </div>
                          <div>
                            <div className="text-xs text-green-500 font-bold">
                              Bước {step.step}
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
              Kiểm soát{" "}
              <span className="gradient-text">chất lượng</span>
            </h2>
            <p className="section-subtitle">
              Hệ thống kiểm tra chất lượng toàn diện tại mỗi công đoạn sản xuất.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Droplets,
                title: "Kiểm tra EC",
                desc: "Đo điện dẫn (EC) bằng thiết bị chuyên dụng, đảm bảo < 0.5 mS/cm cho sản phẩm xuất khẩu.",
                value: "< 0.5 mS/cm",
              },
              {
                icon: Thermometer,
                title: "Kiểm tra pH",
                desc: "Đo pH bằng pH meter kỹ thuật số, đảm bảo mức 5.5 – 6.5 tối ưu cho cây trồng.",
                value: "5.5 – 6.5",
              },
              {
                icon: Droplets,
                title: "Kiểm tra độ ẩm",
                desc: "Đo độ ẩm bằng cân sấy, đảm bảo < 20% để bảo quản và vận chuyển tối ưu.",
                value: "< 20%",
              },
              {
                icon: ClipboardCheck,
                title: "Lấy mẫu & báo cáo",
                desc: "Mỗi lô hàng được lấy mẫu phân tích, cấp chứng nhận chất lượng kèm theo.",
                value: "100% lô hàng",
              },
            ].map((item, i) => (
              <div key={i} className="card p-6 text-center group">
                <div className="w-14 h-14 rounded-2xl gradient-green flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-600/20">
                  <item.icon size={26} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                <div className="text-2xl font-extrabold gradient-text mb-2">
                  {item.value}
                </div>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agri Technology */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title">
              Ứng dụng công nghệ{" "}
              <span className="gradient-text">nông nghiệp</span>
            </h2>
            <p className="section-subtitle">
              GreenPeat không chỉ cung cấp giá thể – mà còn đồng hành với 
              giải pháp công nghệ nông nghiệp toàn diện.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Sprout,
                title: "Nhà kính & nhà màng",
                desc: "Giá thể AgriCoX được thiết kế tối ưu cho hệ thống nhà kính hiện đại, hỗ trợ kiểm soát môi trường trồng trọt chính xác.",
              },
              {
                icon: Droplets,
                title: "Tưới nhỏ giọt",
                desc: "Cocopeat có cấu trúc xốp đặc biệt, phân phối nước đều trong hệ thống tưới nhỏ giọt, tiết kiệm 40-60% nước.",
              },
              {
                icon: Wifi,
                title: "Cảm biến IoT",
                desc: "Tích hợp cảm biến theo dõi độ ẩm, EC, pH trong giá thể theo thời gian thực. Quản lý dinh dưỡng tự động.",
              },
              {
                icon: BarChart3,
                title: "Quản lý dinh dưỡng",
                desc: "Phối hợp công nghệ trộn dung dịch dinh dưỡng tự động, tối ưu hóa tỷ lệ N-P-K cho từng loại cây trồng trên giá thể.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-green-200 transition-colors group">
                <div className="w-14 h-14 rounded-2xl gradient-green flex items-center justify-center shrink-0 shadow-lg shadow-green-600/20 group-hover:shadow-green-600/30 transition-shadow">
                  <item.icon size={26} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section gradient-hero text-white text-center">
        <div className="container-custom">
          <Leaf size={48} className="text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Cần tư vấn kỹ thuật?
          </h2>
          <p className="text-green-200 text-lg mb-8 max-w-xl mx-auto">
            Đội ngũ kỹ sư nông nghiệp GreenPeat sẵn sàng hỗ trợ bạn 
            chọn giải pháp giá thể tối ưu cho dự án.
          </p>
          <Link href="/lien-he" className="btn-accent !text-base !py-3.5 !px-8">
            Liên hệ tư vấn <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
