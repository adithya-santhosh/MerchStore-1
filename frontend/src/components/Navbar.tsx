"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  ShoppingBag,
  User,
  Search,
  Sparkles,
  Shield,
  Tag,
  Car,
  LogOut,
  Heart,
  Package,
  Layers,
} from "lucide-react";
import { getNavigationMetadata, NavMetadata } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import CartSidebar from "./CartSidebar";
import SearchOverlay from "./SearchOverlay";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";

interface NavItem {
  label: string;
  href: string;
}

/**
 * Where a subcategory link in the mega menu should go.
 *
 * Car accessories have a route per subcategory; merchandise subcategories do
 * not, so they filter the catalogue instead. Both menu copies previously sent
 * every merchandise child to /products/merchandise, which made "Apparel",
 * "Caps", "Keychains" and "Collectibles" four labels for one identical page.
 * The name is passed rather than the slug because the search API matches either
 * and the name is what the destination heading renders.
 */
function subCategoryHref(
  parentSlug: string,
  sub: { slug: string; name: string }
): string {
  return parentSlug === "car-accessories"
    ? `/products/car-accessories/${sub.slug}`
    : `/products?subCategory=${encodeURIComponent(sub.name)}`;
}

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navMetadata, setNavMetadata] = useState<NavMetadata | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<
    "category" | "brand" | "vehicle" | null
  >(null);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [isMobileBrandsOpen, setIsMobileBrandsOpen] = useState(false);
  const [isMobileVehiclesOpen, setIsMobileVehiclesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { itemsCount, setSidebarOpen } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount } = useWishlist();

  // Global keyboard shortcut: Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    getNavigationMetadata()
      .then(setNavMetadata)
      .catch((err) =>
        console.error("Failed to load navigation metadata:", err)
      );
  }, []);

  // Simple nav links
  const navItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
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

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to determine if link is active
  const isActive = (item: NavItem) => {
    if (item.href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(item.href);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <>
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
                  Merch
                  <span className="text-primary font-black">Store</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navItems.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 hover:bg-muted hover:text-foreground ${
                      active
                        ? "bg-primary/5 text-primary-bright"
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

            {/* Desktop Right Actions (Search, User, Cart, Admin) */}
            <div className="hidden md:flex items-center gap-2">
              {/* Search — opens global search overlay */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search products (Ctrl+K)"
                className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <Search className="size-5" />
              </button>

              {/* Wishlist */}
              {user && (
                <Link
                  href="/dashboard?tab=wishlist"
                  aria-label="My Wishlist"
                  className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                >
                  <Heart className="size-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-sm">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Shopping Cart"
                className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <ShoppingBag className="size-5" />
                {itemsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-sm">
                    {itemsCount}
                  </span>
                )}
              </button>

              {/* User avatar / Login */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 pr-2.5 rounded-full border border-border/60 hover:border-primary/40 hover:bg-muted transition-all cursor-pointer"
                    aria-label="User menu"
                  >
                    <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black">
                      {getUserInitials()}
                    </div>
                    <span className="text-xs font-semibold text-foreground hidden lg:inline max-w-[80px] truncate">
                      {user.firstName}
                    </span>
                    <ChevronDown
                      className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* User dropdown menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-popover p-2 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                      {/* User info header */}
                      <div className="px-3 py-2 mb-1 border-b border-border/50">
                        <p className="text-sm font-bold text-foreground">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Dashboard link */}
                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary-bright hover:bg-muted transition-colors"
                      >
                        <User className="size-4" />
                        My Dashboard
                      </Link>

                      {/* Admin link */}
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin/products"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary-bright hover:bg-muted transition-colors"
                        >
                          <Shield className="size-4" />
                          Admin Console
                        </Link>
                      )}

                      {/* Vendor link */}
                      {(user.role === "VENDOR" || user.role === "vendor") && (
                        <Link
                          href="/vendor/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary-bright hover:bg-muted transition-colors"
                        >
                          <Package className="size-4" />
                          Vendor Portal
                        </Link>
                      )}

                      {/* Logout */}
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors cursor-pointer"
                      >
                        <LogOut className="size-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  aria-label="User Account"
                  className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                >
                  <User className="size-5" />
                </Link>
              )}
            </div>

            {/* Mobile Menu Buttons */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Shopping Cart"
                className="relative p-2 text-muted-foreground rounded-full hover:bg-muted cursor-pointer"
              >
                <ShoppingBag className="size-5" />
                {itemsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {itemsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? (
                  <X className="size-6" />
                ) : (
                  <Menu className="size-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Sub-Navbar (Desktop Only) */}
        <div
          className="hidden md:block border-t border-border/40 bg-background/25 relative"
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center gap-8 h-10 text-xs font-bold uppercase tracking-wider text-foreground/80">
              <button
                onMouseEnter={() => setActiveDropdown("category")}
                className={`flex items-center gap-1.5 py-2 transition-colors cursor-pointer ${
                  activeDropdown === "category"
                    ? "text-primary-bright"
                    : "hover:text-foreground"
                }`}
              >
                <Layers className="size-4" /> Shop by Category
              </button>
              <button
                onMouseEnter={() => setActiveDropdown("brand")}
                className={`flex items-center gap-1.5 py-2 transition-colors cursor-pointer ${
                  activeDropdown === "brand"
                    ? "text-primary-bright"
                    : "hover:text-foreground"
                }`}
              >
                <Tag className="size-4" /> Shop by Brand
              </button>
              <button
                onMouseEnter={() => setActiveDropdown("vehicle")}
                className={`flex items-center gap-1.5 py-2 transition-colors cursor-pointer ${
                  activeDropdown === "vehicle"
                    ? "text-primary-bright"
                    : "hover:text-foreground"
                }`}
              >
                <Car className="size-4" /> Shop by Vehicle
              </button>
            </div>
          </div>

          {/* Desktop Absolute Dropdown Panels */}
          {activeDropdown && navMetadata && (
            <div className="absolute left-0 right-0 top-full bg-popover/98 backdrop-blur-xl border-b border-border shadow-2xl z-40 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Category Panel */}
                {activeDropdown === "category" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {navMetadata.categories.map((cat) => (
                      <div key={cat.id} className="space-y-4">
                        <h3 className="text-sm font-black text-foreground tracking-wider uppercase flex items-center gap-1.5 pb-2 border-b border-border/50">
                          <Layers className="size-4 text-primary" />
                          {cat.name}
                        </h3>
                        <ul className="space-y-2.5">
                          {cat.children.map((sub) => (
                            <li key={sub.id}>
                              <Link
                                href={subCategoryHref(cat.slug, sub)}
                                onClick={() => setActiveDropdown(null)}
                                className="group/sub flex flex-col gap-0.5 normal-case"
                              >
                                <span className="text-sm font-semibold text-foreground/90 hover:text-primary-bright transition-colors">
                                  {sub.name}
                                </span>
                                {sub.description && (
                                  <span className="text-xs text-muted-foreground/80 leading-normal max-w-[200px]">
                                    {sub.description}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Brand Panel */}
                {activeDropdown === "brand" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {navMetadata.brands.map((brand) => (
                      <Link
                        key={brand.id}
                        href={`/products?brand=${brand.slug}`}
                        onClick={() => setActiveDropdown(null)}
                        className="group p-4 rounded-2xl border border-border bg-card/20 hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
                      >
                        <div className="size-11 rounded-xl bg-muted/60 flex items-center justify-center text-foreground font-black tracking-tighter text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          {brand.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")}
                        </div>
                        <span className="text-sm font-bold text-foreground group-hover:text-primary-bright transition-colors normal-case">
                          {brand.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Vehicle Panel */}
                {activeDropdown === "vehicle" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(
                      navMetadata.vehicles.reduce(
                        (acc, v) => {
                          if (!acc[v.make]) acc[v.make] = [];
                          acc[v.make].push(v);
                          return acc;
                        },
                        {} as Record<string, typeof navMetadata.vehicles>
                      )
                    ).map(([make, models]) => (
                      <div
                        key={make}
                        className="p-4 rounded-2xl border border-border bg-card/10 space-y-3"
                      >
                        <h4 className="text-sm font-black text-foreground tracking-wider uppercase flex items-center gap-1.5 pb-2 border-b border-border/50">
                          <Car className="size-4 text-primary" />
                          {make}
                        </h4>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {models.map((model) => (
                            <Link
                              key={model.id}
                              href={`/products?vehicle=${encodeURIComponent(
                                model.model
                              )}`}
                              onClick={() => setActiveDropdown(null)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-muted/30 hover:border-primary hover:bg-primary/5 hover:text-primary-bright transition-all normal-case cursor-pointer"
                            >
                              {model.model}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Drawer (Slide down) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/80 bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-5 duration-200">
            <div className="px-4 pt-2 pb-6 space-y-3 max-h-[80vh] overflow-y-auto">
              {/* Main nav links */}
              {navItems.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-xl text-base font-medium transition-all ${
                      active
                        ? "bg-primary/5 text-primary-bright pl-4 border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Seeded Navigation Options (Mobile Accordions) */}
              {navMetadata && (
                <div className="pt-2 border-t border-border/40 space-y-2">
                  {/* Shop by Category Accordion */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsMobileCategoriesOpen(!isMobileCategoriesOpen);
                        setIsMobileBrandsOpen(false);
                        setIsMobileVehiclesOpen(false);
                      }}
                      className="flex justify-between items-center w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="size-4" /> Shop Categories
                      </span>
                      <ChevronDown
                        className={`size-4 transition-transform duration-200 ${
                          isMobileCategoriesOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isMobileCategoriesOpen && (
                      <div className="pl-6 space-y-3 pt-1 pb-2">
                        {navMetadata.categories.map((cat) => (
                          <div key={cat.id} className="space-y-1">
                            <div className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                              {cat.name}
                            </div>
                            <div className="pl-3 space-y-1">
                              {cat.children.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={subCategoryHref(cat.slug, sub)}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="block py-1 text-xs text-muted-foreground hover:text-primary-bright"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Shop by Brand Accordion */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsMobileBrandsOpen(!isMobileBrandsOpen);
                        setIsMobileCategoriesOpen(false);
                        setIsMobileVehiclesOpen(false);
                      }}
                      className="flex justify-between items-center w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Tag className="size-4" /> Shop Brands
                      </span>
                      <ChevronDown
                        className={`size-4 transition-transform duration-200 ${
                          isMobileBrandsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isMobileBrandsOpen && (
                      <div className="pl-6 pt-1 pb-2 flex flex-wrap gap-2">
                        {navMetadata.brands.map((brand) => (
                          <Link
                            key={brand.id}
                            href={`/products?brand=${brand.slug}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary-bright hover:border-primary bg-card/45"
                          >
                            {brand.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Shop by Vehicle Accordion */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsMobileVehiclesOpen(!isMobileVehiclesOpen);
                        setIsMobileCategoriesOpen(false);
                        setIsMobileBrandsOpen(false);
                      }}
                      className="flex justify-between items-center w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Car className="size-4" /> Shop Vehicles
                      </span>
                      <ChevronDown
                        className={`size-4 transition-transform duration-200 ${
                          isMobileVehiclesOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isMobileVehiclesOpen && (
                      <div className="pl-6 pt-1 pb-2 space-y-3">
                        {Object.entries(
                          navMetadata.vehicles.reduce(
                            (acc, v) => {
                              if (!acc[v.make]) acc[v.make] = [];
                              acc[v.make].push(v);
                              return acc;
                            },
                            {} as Record<
                              string,
                              typeof navMetadata.vehicles
                            >
                          )
                        ).map(([make, models]) => (
                          <div key={make} className="space-y-1">
                            <div className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                              {make}
                            </div>
                            <div className="pl-3 flex flex-wrap gap-1.5">
                              {models.map((model) => (
                                <Link
                                  key={model.id}
                                  href={`/products?vehicle=${encodeURIComponent(
                                    model.model
                                  )}`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="px-2 py-1 rounded border border-border text-[10px] font-semibold text-muted-foreground hover:text-primary-bright hover:border-primary"
                                >
                                  {model.model}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile bottom actions */}
              <div className="pt-4 border-t border-border/60 flex flex-col gap-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground">
                      <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black">
                        {getUserInitials()}
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-primary-bright rounded-xl hover:bg-muted transition-colors"
                    >
                      <User className="size-5" />
                      <span className="text-sm font-medium text-foreground">
                        My Dashboard
                      </span>
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin/products"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-primary-bright rounded-xl hover:bg-muted transition-colors"
                      >
                        <Shield className="size-5" />
                        <span className="text-sm font-medium">
                          Admin Console
                        </span>
                      </Link>
                    )}
                    {(user.role === "VENDOR" || user.role === "vendor") && (
                      <Link
                        href="/vendor/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-primary-bright rounded-xl hover:bg-muted transition-colors"
                      >
                        <Package className="size-5" />
                        <span className="text-sm font-medium">
                          Vendor Portal
                        </span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 text-destructive hover:bg-destructive/5 rounded-xl transition-colors w-full text-left cursor-pointer text-sm font-bold"
                    >
                      <LogOut className="size-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
                  >
                    <User className="size-5" />
                    <span className="text-sm font-medium">
                      Login / Sign Up
                    </span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors w-full text-left cursor-pointer"
                >
                  <Search className="size-5" />
                  <span className="text-sm font-medium">Search Store</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      <CartSidebar />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}