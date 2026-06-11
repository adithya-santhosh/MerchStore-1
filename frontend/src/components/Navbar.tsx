"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ShoppingBag, User, Search, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
  dropdownItems?: { label: string; href: string; description: string }[];
}

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Nav configuration
  
  const navItems: NavItem[] = [
    { label: "Home", href: "/" },
    {
      label: "Products",
      href: "/products",
      hasDropdown: true,
      dropdownItems: [
        {
          label: "Car Accessories",
          href: "/products/car-accessories",
          description: "Engineered off-road armor, lighting, and overland storage systems.",
        },
        {
          label: "Merchandise",
          href: "/products/merchandise",
          description: "Limited apparel, caps, keychains, and street fashion gear.",
        },
      ],
    },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ]; 


  // Scrolled effect for glassmorphism transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Helper to determine if link is active
  const isActive = (item: NavItem) => {
    if (item.href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(item.href);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-border/80 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.1)]"
          : "bg-background/40 backdrop-blur-sm border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-transform duration-300 group-hover:rotate-12">
                <Sparkles className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                Merch<span className="text-primary font-black">Store</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const active = isActive(item);
              if (item.hasDropdown) {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setIsProductsDropdownOpen(true)}
                    onMouseLeave={() => setIsProductsDropdownOpen(false)}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 hover:bg-muted hover:text-foreground ${
                        active
                          ? "bg-primary/5 text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        className={`size-4 transition-transform duration-300 ${
                          isProductsDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Link>

                    {/* Products Dropdown Panel */}
                    {isProductsDropdownOpen && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-80">
                        <div className="rounded-2xl border border-border bg-popover p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid gap-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pb-2 border-b border-border/50">
                            Shop Categories
                          </div>
                          {item.dropdownItems?.map((subItem) => (
                            <Link
                              key={subItem.label}
                              href={subItem.href}
                              onClick={() => setIsProductsDropdownOpen(false)}
                              className="group/item flex flex-col gap-1 p-3 rounded-xl hover:bg-muted transition-colors duration-200"
                            >
                              <span className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors">
                                {subItem.label}
                              </span>
                              <span className="text-xs text-muted-foreground leading-normal">
                                {subItem.description}
                              </span>
                            </Link>
                          ))}
                        </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 hover:bg-muted hover:text-foreground ${
                    active
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions (Search, Cart, User, Admin, Checkout CTA) */}
          <div className="hidden md:flex items-center gap-3">
            <button
              aria-label="Search items"
              className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
            >
              <Search className="size-5" />
            </button>
            <button
              aria-label="User Account"
              className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
            >
              <User className="size-5" />
            </button>
            <button
              aria-label="Shopping Cart"
              className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
            >
              <ShoppingBag className="size-5" />
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-sm">
                0
              </span>
            </button>
            <Link
              href="/admin/products"
              aria-label="Admin Panel"
              className="p-2 text-muted-foreground hover:text-primary rounded-full hover:bg-muted transition-colors cursor-pointer"
            >
              <Shield className="size-5" />
            </Link>
            <Button size="sm" className="ml-2 shadow-md cursor-pointer">
              Shop Now
            </Button>
          </div>

          {/* Mobile Menu Buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              aria-label="Shopping Cart"
              className="relative p-2 text-muted-foreground rounded-full hover:bg-muted cursor-pointer"
            >
              <ShoppingBag className="size-5" />
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                0
              </span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer (Slide down) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/80 bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-5 duration-200">
          <div className="px-4 pt-2 pb-6 space-y-3">
            {navItems.map((item) => {
              const active = isActive(item);
              if (item.hasDropdown) {
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </div>
                    {item.dropdownItems?.map((subItem) => (
                      <Link
                        key={subItem.label}
                        href={subItem.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex flex-col gap-0.5 pl-6 pr-3 py-2 rounded-xl hover:bg-muted transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {subItem.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {subItem.description}
                        </span>
                      </Link>
                    ))}
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-xl text-base font-medium transition-all ${
                    active
                      ? "bg-primary/5 text-primary pl-4 border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            
            <div className="pt-4 border-t border-border/60 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
              >
                <User className="size-5" />
                <span className="text-sm font-medium">My Account</span>
              </Link>
              <Link
                href="/admin/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-primary rounded-xl hover:bg-muted transition-colors"
              >
                <Shield className="size-5" />
                <span className="text-sm font-medium">Admin Console</span>
              </Link>
              <button className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors w-full text-left cursor-pointer">
                <Search className="size-5" />
                <span className="text-sm font-medium">Search Store</span>
              </button>
              <Button onClick={() => setIsMobileMenuOpen(false)} className="w-full mt-2 cursor-pointer shadow-lg">
                Shop Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}