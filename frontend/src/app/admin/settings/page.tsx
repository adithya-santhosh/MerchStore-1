"use client";

import { useEffect, useState } from "react";
import { 
  Percent, 
  Truck, 
  Tag, 
  PlusCircle, 
  Trash2, 
  Save, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ToggleLeft, 
  ToggleRight,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCookie } from "@/hooks/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

interface SystemSettings {
  tax_rate: number;
  shipping_limit: number;
  shipping_cost: number;
}

export default function AdminSettingsPage() {
  // Tabs
  const [activeTab, setActiveTab] = useState<"general" | "coupons">("general");

  // Settings states
  const [settings, setSettings] = useState<SystemSettings>({
    tax_rate: 18,
    shipping_limit: 499,
    shipping_cost: 99
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Coupons states
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  
  // New coupon form
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "percent",
    value: "",
    minOrderAmount: "",
    maxUses: "",
    expiresAt: "",
    isActive: true
  });
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Load Settings and Coupons
  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // Convert tax rate fraction (e.g. 0.18) to percentage (18) for easier user editing
        setSettings({
          tax_rate: data.tax_rate * 100,
          shipping_limit: data.shipping_limit,
          shipping_cost: data.shipping_cost
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadCoupons = async () => {
    try {
      const token = getCookie("token");
      const headers: Record<string, string> = { "Cache-Control": "no-store" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/api/coupons`, {
        cache: "no-store",
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error("Failed to load coupons:", error);
    } finally {
      setCouponsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadCoupons();
  }, []);

  // Save general settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccess(false);

    try {
      const token = getCookie("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          tax_rate: settings.tax_rate / 100, // convert percentage back to decimal
          shipping_limit: settings.shipping_limit,
          shipping_cost: settings.shipping_cost
        })
      });

      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Add new coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponSaving(true);
    setCouponError("");

    if (!newCoupon.code.trim()) {
      setCouponError("Coupon code is required");
      setCouponSaving(false);
      return;
    }
    if (!newCoupon.value || Number(newCoupon.value) <= 0) {
      setCouponError("Coupon value must be a positive number");
      setCouponSaving(false);
      return;
    }

    try {
      const token = getCookie("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/api/coupons`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: newCoupon.code,
          type: newCoupon.type,
          value: Number(newCoupon.value),
          minOrderAmount: newCoupon.minOrderAmount ? Number(newCoupon.minOrderAmount) : null,
          maxUses: newCoupon.maxUses ? Number(newCoupon.maxUses) : null,
          expiresAt: newCoupon.expiresAt ? newCoupon.expiresAt : null,
          isActive: newCoupon.isActive
        })
      });

      if (res.ok) {
        setNewCoupon({
          code: "",
          type: "percent",
          value: "",
          minOrderAmount: "",
          maxUses: "",
          expiresAt: "",
          isActive: true
        });
        loadCoupons();
      } else {
        const data = await res.json();
        setCouponError(data.message || "Failed to create coupon");
      }
    } catch (error) {
      console.error("Failed to create coupon:", error);
      setCouponError("Network error. Failed to save coupon.");
    } finally {
      setCouponSaving(false);
    }
  };

  // Toggle Coupon active state
  const handleToggleCoupon = async (coupon: Coupon) => {
    try {
      const token = getCookie("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/api/coupons/${coupon.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ isActive: !coupon.isActive })
      });
      if (res.ok) {
        loadCoupons();
      }
    } catch (error) {
      console.error("Failed to toggle coupon state:", error);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const token = getCookie("token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/api/coupons/${id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        loadCoupons();
      }
    } catch (error) {
      console.error("Failed to delete coupon:", error);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-5 border-b border-border/50">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase mb-2">
            <Settings className="size-3.5" />
            System Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">Console Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Modify shipping thresholds, tax rates, and manage discount promo codes.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="inline-flex p-1 bg-card border border-border rounded-xl">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "general"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            General config
          </button>
          <button
            onClick={() => setActiveTab("coupons")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "coupons"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Coupon rules
          </button>
        </div>
      </div>

      {/* GENERAL CONFIG TAB */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-8 bg-card/25 border border-border/60 rounded-[2rem] p-6 shadow-sm">
            {settingsLoading ? (
              <div className="py-20 text-center text-xs text-muted-foreground">Loading configs...</div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Store Variables</h2>

                {/* Tax Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                      <Percent className="size-4 text-primary" />
                      Tax Rate (GST %)
                    </label>
                    <span className="text-[10px] text-muted-foreground">Standard value applied in subtotal</span>
                  </div>
                  <div className="flex items-center border border-border rounded-xl bg-background/50 overflow-hidden h-12 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, tax_rate: Math.max(0, settings.tax_rate - 1) })}
                      className="w-12 h-full text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-lg cursor-pointer transition-colors border-r border-border/40"
                    >
                      -
                    </button>
                    <div className="relative flex-grow h-full flex items-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={settings.tax_rate}
                        onChange={(e) => setSettings({ ...settings, tax_rate: Number(e.target.value.replace(/\D/g, '')) })}
                        className="w-full h-full bg-transparent border-none text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-0 px-8"
                      />
                      <span className="absolute right-4 font-bold text-sm text-muted-foreground">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, tax_rate: Math.min(100, settings.tax_rate + 1) })}
                      className="w-12 h-full text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-lg cursor-pointer transition-colors border-l border-border/40"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Shipping Limit */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                      <Truck className="size-4 text-primary" />
                      Free Shipping Limit
                    </label>
                    <span className="text-[10px] text-muted-foreground">Orders above this get free shipping</span>
                  </div>
                  <div className="flex items-center border border-border rounded-xl bg-background/50 overflow-hidden h-12 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, shipping_limit: Math.max(0, settings.shipping_limit - 50) })}
                      className="w-12 h-full text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-lg cursor-pointer transition-colors border-r border-border/40"
                    >
                      -
                    </button>
                    <div className="relative flex-grow h-full flex items-center">
                      <span className="absolute left-4 font-bold text-sm text-muted-foreground">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={settings.shipping_limit}
                        onChange={(e) => setSettings({ ...settings, shipping_limit: Number(e.target.value.replace(/\D/g, '')) })}
                        className="w-full h-full bg-transparent border-none text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-0 px-8"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, shipping_limit: settings.shipping_limit + 50 })}
                      className="w-12 h-full text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-lg cursor-pointer transition-colors border-l border-border/40"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Shipping Cost */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                      <Truck className="size-4 text-primary" />
                      Flat Shipping Charge
                    </label>
                    <span className="text-[10px] text-muted-foreground">Charge applied below the threshold</span>
                  </div>
                  <div className="flex items-center border border-border rounded-xl bg-background/50 overflow-hidden h-12 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, shipping_cost: Math.max(0, settings.shipping_cost - 10) })}
                      className="w-12 h-full text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-lg cursor-pointer transition-colors border-r border-border/40"
                    >
                      -
                    </button>
                    <div className="relative flex-grow h-full flex items-center">
                      <span className="absolute left-4 font-bold text-sm text-muted-foreground">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={settings.shipping_cost}
                        onChange={(e) => setSettings({ ...settings, shipping_cost: Number(e.target.value.replace(/\D/g, '')) })}
                        className="w-full h-full bg-transparent border-none text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-0 px-8"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, shipping_cost: settings.shipping_cost + 10 })}
                      className="w-12 h-full text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-lg cursor-pointer transition-colors border-l border-border/40"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Submit actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <Button
                    type="submit"
                    disabled={settingsSaving}
                    className="flex items-center gap-2 px-6 py-2 cursor-pointer shadow-md rounded-xl"
                  >
                    <Save className="size-4" />
                    {settingsSaving ? "Saving..." : "Save Settings"}
                  </Button>

                  {settingsSuccess && (
                    <div className="text-emerald-500 font-bold text-xs flex items-center gap-1.5 animate-in fade-in">
                      <Check className="size-4" /> Config saved successfully!
                    </div>
                  )}
                </div>

              </form>
            )}
          </div>

          {/* Info Banner */}
          <div className="md:col-span-4 rounded-3xl border border-border/80 bg-muted/10 p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              General Guidelines
            </h3>
            <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                <strong>Tax Calculations:</strong> Taxes are applied as a percentage (e.g. 18% GST) against the subtotal values in both checkout pages and drawers.
              </p>
              <p>
                <strong>Free Shipping:</strong> Shipping charges will automatically become zero if the subtotal reaches the specified threshold. Set flat charge to 0 to disable shipping fees entirely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COUPONS MANAGEMENT TAB */}
      {activeTab === "coupons" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Create Coupon Form */}
          <div className="lg:col-span-4 bg-card/25 border border-border/60 rounded-[2rem] p-5 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border/40 pb-3">
              <PlusCircle className="size-4.5 text-primary" />
              Add Coupon Rule
            </h2>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-semibold text-muted-foreground">
              {couponError && (
                <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{couponError}</span>
                </div>
              )}

              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER20"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground uppercase"
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Discount Type</label>
                <select
                  value={newCoupon.type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                  className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              {/* Value */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Discount Value</label>
                <input
                  type="number"
                  placeholder="e.g. 15"
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })}
                  className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Minimum Order */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Minimum Order Amount (₹) (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 999"
                  value={newCoupon.minOrderAmount}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })}
                  className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Max Uses */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Max Limit Uses (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={newCoupon.maxUses}
                  onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                  className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <label className="text-foreground font-bold">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={newCoupon.expiresAt}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                  className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Active state */}
              <div className="flex items-center gap-3 py-1 cursor-pointer" onClick={() => setNewCoupon({ ...newCoupon, isActive: !newCoupon.isActive })}>
                {newCoupon.isActive ? (
                  <ToggleRight className="size-8 text-primary shrink-0" />
                ) : (
                  <ToggleLeft className="size-8 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs text-foreground font-bold">Enable coupon immediately</span>
              </div>

              <Button
                type="submit"
                disabled={couponSaving}
                className="w-full py-5 text-xs font-bold rounded-xl cursor-pointer shadow mt-2"
              >
                {couponSaving ? "Saving..." : "Add Coupon Code"}
              </Button>
            </form>
          </div>

          {/* Coupons List Table */}
          <div className="lg:col-span-8 bg-card/25 border border-border/60 rounded-[2rem] p-5 shadow-sm space-y-4 overflow-hidden">
            <h2 className="text-base font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border/40 pb-3">
              <Tag className="size-4.5 text-primary" />
              Active Coupons
            </h2>

            {couponsLoading ? (
              <div className="py-20 text-center text-xs text-muted-foreground">Loading coupons list...</div>
            ) : coupons.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground bg-muted/5 border border-dashed border-border rounded-2xl">
                No coupon codes added yet. Use the left form to add your first promotion.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground uppercase font-black tracking-wider text-[10px]">
                      <th className="py-3 px-2">Code</th>
                      <th className="py-3 px-2">Discount</th>
                      <th className="py-3 px-2">Limits</th>
                      <th className="py-3 px-2">Uses</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b border-border/40 hover:bg-card/10 transition-colors">
                        <td className="py-3.5 px-2 font-black text-foreground">{coupon.code}</td>
                        <td className="py-3.5 px-2 font-semibold text-foreground">
                          {coupon.type === "percent" ? `${coupon.value}%` : `₹${coupon.value}`}
                        </td>
                        <td className="py-3.5 px-2 text-muted-foreground font-semibold">
                          {coupon.minOrderAmount ? `Min ₹${coupon.minOrderAmount}` : "None"}
                        </td>
                        <td className="py-3.5 px-2 text-muted-foreground font-semibold">
                          {coupon.usedCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : ""}
                        </td>
                        <td className="py-3.5 px-2">
                          <button
                            onClick={() => handleToggleCoupon(coupon)}
                            className="cursor-pointer"
                          >
                            {coupon.isActive ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 uppercase tracking-wide">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                                Inactive
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/5 transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
