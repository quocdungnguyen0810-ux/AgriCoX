import Link from "next/link";
import {
  Leaf,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ArrowUp,
} from "lucide-react";
import { companyInfo } from "@/data/content";

const footerLinks = {
  products: [
    { href: "/san-pham/cocopeat-growbag-agricox", label: "Cocopeat Growbag" },
    { href: "/san-pham/dat-mun-dua-xu-ly", label: "Đất mụn dừa xử lý" },
    { href: "/san-pham/cocopeat-block-5kg", label: "Cocopeat Block" },
    { href: "/san-pham/cocopeat-loose-bulk", label: "Loose / Bulk" },
  ],
  company: [
    { href: "/gioi-thieu", label: "Về GreenPeat" },
    { href: "/cong-nghe", label: "Công nghệ" },
    { href: "/du-an", label: "Dự án tiêu biểu" },
    { href: "/lien-he", label: "Liên hệ" },
  ],
  services: [
    { href: "/dat-hang", label: "Đặt hàng" },
    { href: "/dat-hang", label: "Yêu cầu báo giá" },
    { href: "/lien-he", label: "Tư vấn kỹ thuật" },
    { href: "/lien-he", label: "Hỗ trợ xuất khẩu" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 gradient-warm" />
      <div className="absolute top-20 right-10 w-64 h-64 bg-green-800/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-brown-700/20 rounded-full blur-3xl" />

      <div className="container-custom relative z-10">
        {/* Main footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 py-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-5 group">
              <div className="w-11 h-11 rounded-xl gradient-green flex items-center justify-center shadow-lg">
                <Leaf className="text-white" size={22} />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight">
                  Green<span className="text-brown-300">Peat</span>
                </div>
                <div className="text-[10px] text-green-400 font-semibold tracking-widest uppercase">
                  AgriCoX Brand
                </div>
              </div>
            </Link>
            <p className="text-green-300 text-sm leading-relaxed mb-5">
              {companyInfo.slogan}
            </p>
            <div className="space-y-3 text-sm">
              <a
                href={`tel:${companyInfo.phone}`}
                className="flex items-center gap-2.5 text-green-300 hover:text-white transition-colors"
              >
                <Phone size={16} /> {companyInfo.phone}
              </a>
              <a
                href={`mailto:${companyInfo.email}`}
                className="flex items-center gap-2.5 text-green-300 hover:text-white transition-colors"
              >
                <Mail size={16} /> {companyInfo.email}
              </a>
              <div className="flex items-start gap-2.5 text-green-300">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>{companyInfo.address}</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5">
              Sản phẩm
            </h3>
            <ul className="space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-green-300 hover:text-white text-sm transition-colors hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5">
              Công ty
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-green-300 hover:text-white text-sm transition-colors hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5">
              Dịch vụ
            </h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-green-300 hover:text-white text-sm transition-colors hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              <a
                href={companyInfo.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-green-800 hover:bg-green-700 flex items-center justify-center transition-colors"
              >
                <ExternalLink size={18} />
              </a>
              <a
                href={`https://zalo.me/${companyInfo.zalo?.replace(/\s/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-green-800 hover:bg-green-700 flex items-center justify-center transition-colors text-xs font-bold"
              >
                Zalo
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-green-800 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-green-400">
          <p>© 2024 GreenPeat. Bảo lưu mọi quyền.</p>
          <a
            href="#top"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <ArrowUp size={16} /> Về đầu trang
          </a>
        </div>
      </div>
    </footer>
  );
}
