"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  ShoppingCart,
  Leaf,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { SessionProvider } from "next-auth/react";

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/customers", label: "Khách hàng", icon: Users },
  { href: "/admin/quotes", label: "Báo giá", icon: FileText },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
];

function AdminSidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 bg-gradient-to-b from-green-900 to-green-950 text-white transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-64"
      } hidden lg:flex flex-col`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-green-800/50">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shrink-0">
            <Leaf size={18} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold tracking-tight">
              Green<span className="text-brown-300">Peat</span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-green-800 transition-colors"
        >
          <ChevronRight
            size={16}
            className={`transition-transform ${collapsed ? "" : "rotate-180"}`}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-green-700/60 text-white"
                  : "text-green-300 hover:bg-green-800/50 hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-green-800/50">
        {!collapsed && session?.user && (
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-semibold">{session.user.name}</div>
            <div className="text-xs text-green-400">{session.user.role}</div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-green-300 hover:bg-red-600/20 hover:text-red-300 transition-all w-full"
          title={collapsed ? "Đăng xuất" : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}

function AdminHeader({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const currentPage = sidebarItems.find(
    (i) => pathname === i.href || (i.href !== "/admin" && pathname.startsWith(i.href))
  );

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">
            {currentPage?.label || "Dashboard"}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-gray-100 relative">
          <Bell size={20} className="text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50">
          <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
            {session?.user?.name?.charAt(0) || "A"}
          </div>
          <div className="text-sm">
            <div className="font-semibold text-gray-700">{session?.user?.name}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      <div className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-green-900 to-green-950 text-white z-50 lg:hidden">
        <div className="h-16 flex items-center justify-between px-4 border-b border-green-800/50">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            <span className="text-base font-bold">
              Green<span className="text-brown-300">Peat</span>
            </span>
          </Link>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-green-800">
            <X size={20} />
          </button>
        </div>
        <nav className="py-4 px-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-green-700/60 text-white"
                    : "text-green-300 hover:bg-green-800/50 hover:text-white"
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div
        className={`transition-all duration-300 ${
          collapsed ? "lg:ml-[72px]" : "lg:ml-64"
        }`}
      >
        <AdminHeader onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SessionProvider>
  );
}
