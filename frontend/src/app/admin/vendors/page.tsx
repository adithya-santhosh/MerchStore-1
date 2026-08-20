"use client";

import { useState, useEffect } from "react";
import { getAllVendors, createVendorAccount } from "@/lib/api";
import { Store, Plus, X, Package, Mail, User } from "lucide-react";

interface Vendor {
  id: number;
  companyName: string;
  email: string;
  firstName: string;
  lastName: string;
  productCount: number;
  products: { id: number; name: string }[];
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await getAllVendors();
      setVendors(data.vendors);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createVendorAccount({ email, password, firstName, lastName, companyName });
      setSuccess(`Vendor account for "${companyName}" created successfully!`);
      setShowForm(false);
      setCompanyName(""); setEmail(""); setPassword(""); setFirstName(""); setLastName("");
      fetchVendors();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to create vendor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Vendor Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage supplier/vendor accounts and their product assignments.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? "Cancel" : "Add Vendor"}
        </button>
      </div>

      {/* Success / Error Banners */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-sm font-semibold px-4 py-3 rounded-xl">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 text-sm font-semibold px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-card/50 border border-border/70 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Store className="size-4 text-primary" />
            New Vendor Account
          </h3>
          <p className="text-xs text-muted-foreground">
            This will create a new user with the <strong>VENDOR</strong> role. Share the email and password with the supplier.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Company / Vendor Name *</label>
              <input required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. BlueMarket Supplies" className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact First Name *</label>
              <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact Last Name *</label>
              <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Login Email *</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vendor@bluemarket.com" className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Temporary Password *</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" minLength={8} className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
            {submitting ? "Creating..." : "Create Vendor Account"}
          </button>
        </form>
      )}

      {/* Vendor List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-20 border border-border/50 rounded-3xl bg-card/20">
          <Store className="size-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base font-bold text-foreground">No vendors yet</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add Vendor" to create your first supplier account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(vendor => (
            <div key={vendor.id} className="bg-card border border-border/70 rounded-2xl p-5 space-y-3 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Store className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{vendor.companyName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <User className="size-3" /> {vendor.firstName} {vendor.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="size-3" /> {vendor.email}
                  </p>
                </div>
              </div>
              <div className="border-t border-border/50 pt-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-semibold">
                  <Package className="size-3.5" />
                  {vendor.productCount} product{vendor.productCount !== 1 ? "s" : ""} assigned
                </p>
                {vendor.products.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {vendor.products.slice(0, 4).map(p => (
                      <span key={p.id} className="text-[10px] bg-muted/40 border border-border/50 px-2 py-0.5 rounded-full text-muted-foreground">{p.name}</span>
                    ))}
                    {vendor.products.length > 4 && (
                      <span className="text-[10px] bg-muted/40 border border-border/50 px-2 py-0.5 rounded-full text-muted-foreground">+{vendor.products.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
