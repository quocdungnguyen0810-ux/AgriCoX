import Link from "next/link";
import {
  MapPin,
  Leaf,
  Award,
  ArrowRight,
  Quote,
} from "lucide-react";
import { projects } from "@/data/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dự án tiêu biểu | GreenPeat AgriCoX",
  description: "Case study các dự án nông nghiệp sử dụng sản phẩm AgriCoX. Kết quả đạt được, phản hồi khách hàng.",
};

export default function ProjectsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute bottom-10 left-20 w-64 h-64 bg-brown-400/10 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-green-200 text-sm mb-6">
            <Award size={16} /> Dự án
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Dự án{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-brown-300">
              tiêu biểu
            </span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Những câu chuyện thành công từ khách hàng và đối tác của GreenPeat 
            trên khắp Việt Nam và quốc tế.
          </p>
        </div>
      </section>

      {/* Projects */}
      <section className="section">
        <div className="container-custom">
          <div className="space-y-8">
            {projects.map((project, i) => (
              <div
                key={project.id}
                className={`card overflow-hidden grid md:grid-cols-2 ${
                  i % 2 === 1 ? "md:direction-rtl" : ""
                }`}
              >
                {/* Image */}
                <div className={`aspect-[4/3] md:aspect-auto bg-gradient-to-br from-green-50 to-brown-50 flex items-center justify-center min-h-[300px] ${i % 2 === 1 ? "md:order-2" : ""}`}>
                  <div className="text-center p-8">
                    <Leaf size={64} className="text-green-300 mx-auto mb-3" />
                    <span className="text-gray-400">{project.cropType}</span>
                  </div>
                </div>

                {/* Content */}
                <div className={`p-8 md:p-10 flex flex-col justify-center ${i % 2 === 1 ? "md:order-1" : ""}`}>
                  <div className="flex items-center gap-2 text-sm text-green-600 font-semibold mb-3">
                    <MapPin size={16} />
                    {project.location}
                  </div>

                  <h2 className="text-2xl font-extrabold text-gray-800 mb-4">
                    {project.name}
                  </h2>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-xl bg-green-50">
                      <div className="text-xs text-gray-400">Loại cây</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {project.cropType}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-brown-50">
                      <div className="text-xs text-gray-400">Quy mô</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {project.scale}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-1">
                      Sản phẩm sử dụng
                    </div>
                    <div className="text-sm font-medium text-green-700">
                      {project.productsUsed}
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="text-xs text-gray-400 mb-1">Kết quả</div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {project.results}
                    </p>
                  </div>

                  {/* Feedback */}
                  <div className="p-4 rounded-xl bg-gray-50 border-l-4 border-green-500">
                    <Quote size={16} className="text-green-400 mb-2" />
                    <p className="text-sm text-gray-600 italic leading-relaxed">
                      {project.feedback}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-gray-soft">
        <div className="container-custom text-center">
          <h2 className="section-title">
            Bạn muốn trở thành câu chuyện{" "}
            <span className="gradient-text">thành công</span> tiếp theo?
          </h2>
          <p className="section-subtitle">
            Liên hệ với chúng tôi để được tư vấn giải pháp giá thể 
            phù hợp nhất cho dự án của bạn.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dat-hang" className="btn-primary">
              Nhận tư vấn miễn phí <ArrowRight size={18} />
            </Link>
            <Link href="/san-pham" className="btn-secondary">
              Xem sản phẩm
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
