"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ShoppingCart,
  Phone,
  Mail,
  Leaf,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/gioi-thieu", label: "Giới thiệu" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/cong-nghe", label: "Công nghệ" },
  { href: "/du-an", label: "Dự án" },
  { href: "/dat-hang", label: "Đặt hàng" },
  { href: "/lien-he", label: "Liên hệ" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, setIsOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top bar */}
      <div className="bg-green-700 text-white text-sm hidden md:block">
        <div className="container-custom flex justify-between items-center py-2">
          <div className="flex items-center gap-6">
            <a href="tel:+842751234567" className="flex items-center gap-1.5 hover:text-green-200 transition-colors">
              <Phone size={14} /> +84 275 123 4567
            </a>
            <a href="mailto:info@greenpeat.vn" className="flex items-center gap-1.5 hover:text-green-200 transition-colors">
              <Mail size={14} /> info@greenpeat.vn
            </a>
          </div>
          <div className="flex items-center gap-1 text-green-200">
            <Leaf size={14} />
            <span>Nông nghiệp bền vững – Xuất khẩu toàn cầu</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "glass shadow-lg shadow-green-900/5"
            : "bg-white/95 backdrop-blur-sm"
        }`}
      >
        <div className="container-custom flex items-center justify-between h-18 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl gradient-green flex items-center justify-center shadow-lg shadow-green-600/20 group-hover:shadow-green-600/40 transition-shadow">
              <Leaf className="text-white" size={24} />
            </div>
            <div className="leading-tight">
              <div className="text-lg md:text-xl font-extrabold text-green-700 tracking-tight">
                Green<span className="text-brown-500">Peat</span>
              </div>
              <div className="text-[10px] md:text-xs text-brown-400 font-semibold tracking-widest uppercase">
                AgriCoX Brand
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 rounded-lg hover:bg-green-50 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2.5 rounded-xl hover:bg-green-50 transition-colors"
              aria-label="Giỏ hàng báo giá"
            >
              <ShoppingCart size={22} className="text-green-700" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-orange-accent text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                  {itemCount}
                </span>
              )}
            </button>

            {/* CTA */}
            <Link href="/dat-hang" className="hidden md:inline-flex btn-primary text-sm !py-2.5 !px-5">
              Nhận báo giá
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-green-50 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 animate-fade-in-up">
            <nav className="container-custom py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 px-4">
                <Link
                  href="/dat-hang"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full text-center"
                >
                  Nhận báo giá
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
