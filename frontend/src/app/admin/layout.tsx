"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  ShoppingBag,
  Users,
  Settings,
  ArrowLeft,
  Sparkles,
  Search,
  Bell,
  Store,
  User,
  Mail,
} from "lucide-react";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems: SidebarItem[] = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Product Catalog", href: "/admin/products", icon: FolderKanban },
    { label: "Add Product", href: "/admin/products/new", icon: PlusCircle },
    { label: "Orders Manager", href: "/admin/orders", icon: ShoppingBag },
    { label: "Customers List", href: "/admin/customers", icon: Users },
    { label: "Vendor Accounts", href: "/admin/vendors", icon: Store },
    { label: "Contact Messages", href: "/admin/messages", icon: Mail },
    { label: "Settings Panel", href: "/admin/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard" || pathname === "/admin";
    }
    if (href === "/admin/products") {
      return pathname === "/admin/products" || (pathname.startsWith("/admin/products/") && pathname !== "/admin/products/new");
    }
    return pathname === href;
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col md:flex-row text-foreground">
      
      {/* 1. Left Sidebar Panel (Desktop) */}
      <aside className="w-full md:w-64 bg-card/40 border-b md:border-b-0 md:border-r border-border/80 flex flex-col shrink-0">
        
        {/* Branding header */}
        <div className="h-16 sm:h-20 flex items-center px-6 border-b border-border/60">
          <Link href="/admin/products" className="flex items-center gap-2 group">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30">
              <Sparkles className="size-4" />
            </div>
            <span className="font-bold tracking-tight text-sm sm:text-base">
              Merch<span className="text-primary-bright font-black">Admin</span>
            </span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-grow p-4 space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-primary/10 text-primary-bright border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to main store button */}
        <div className="p-4 border-t border-border/60">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Exit Console
          </Link>
        </div>

      </aside>

      {/* 2. Right Workspace window */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Top Header Workspace Bar */}
        <header className="h-16 sm:h-20 border-b border-border/60 bg-card/20 backdrop-blur-sm px-6 flex justify-between items-center shrink-0">
          
          {/* Header Search bar */}
          <div className="relative max-w-xs w-full hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search dashboard..."
              className="w-full rounded-xl border border-input bg-background/50 pl-10 pr-4 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="sm:hidden" /> {/* Spacer for mobile */}

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            
            {/* Notification alert bell */}
            <button
              aria-label="Notifications"
              className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
            >
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 rounded-full bg-primary" />
            </button>

            {/* Profile Avatar indicator */}
            <div className="flex items-center gap-3 border-l border-border/60 pl-4">
              <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground">
                <User className="size-4" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-foreground leading-none">Admin Owner</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-1">Super User</p>
              </div>
            </div>

          </div>

        </header>

        {/* Workspace content window */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </div>

      </div>

    </div>
  );
}