"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  getAddressesApi,
  createAddressApi,
  updateAddressApi,
  deleteAddressApi,
  UserAddress,
  AddressInput,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { MapPin, Plus, Pencil, Trash2, Star, AlertCircle, X } from "lucide-react";

const emptyForm: AddressInput = {
  label: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
  isDefault: false,
};

export default function AddressBook() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressInput>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setAddresses(await getAddressesApi());
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load your addresses"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const startEdit = (address: UserAddress) => {
    setEditingId(address.id);
    setForm({
      label: address.label || "",
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setFormError("");
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingId) {
        await updateAddressApi(editingId, form);
      } else {
        await createAddressApi(form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to save address"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setBusyId(id);
    setError("");
    try {
      await deleteAddressApi(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete address"));
    } finally {
      setBusyId(null);
    }
  };

  const handleMakeDefault = async (id: number) => {
    setBusyId(id);
    setError("");
    try {
      await updateAddressApi(id, { isDefault: true });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update address"));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-card/35 border border-border/80 rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-6 w-40 bg-muted rounded-lg" />
        <div className="h-24 bg-muted/30 rounded-xl" />
        <div className="h-24 bg-muted/30 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-card/35 border border-border/80 rounded-2xl p-6 backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h2 className="text-lg font-bold">Saved Addresses</h2>
        {!showForm && (
          <Button
            type="button"
            onClick={startAdd}
            className="text-xs font-bold shadow-md rounded-xl cursor-pointer"
          >
            <Plus className="size-3.5" />
            Add Address
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
          <span className="text-xs font-semibold">{error}</span>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl border border-border bg-background/40 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              {editingId ? "Edit Address" : "New Address"}
            </h3>
            <button
              type="button"
              onClick={cancelForm}
              aria-label="Cancel"
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="size-4 shrink-0" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Label (optional)
              </label>
              <input
                type="text"
                value={form.label || ""}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Home, Work..."
                maxLength={50}
                className="w-full px-4 py-3 text-sm font-semibold bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Address Line 1
              </label>
              <input
                type="text"
                required
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                className="w-full px-4 py-3 text-sm font-semibold bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Address Line 2 (optional)
              </label>
              <input
                type="text"
                value={form.addressLine2 || ""}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                className="w-full px-4 py-3 text-sm font-semibold bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">City</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-3 text-sm font-semibold bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State</label>
              <input
                type="text"
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-4 py-3 text-sm font-semibold bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Postal Code
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="\d{6}"
                title="6-digit postal code"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="w-full px-4 py-3 text-sm font-semibold bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isDefault"
                checked={!!form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="size-4 rounded border-border accent-primary cursor-pointer"
              />
              <label htmlFor="isDefault" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                Set as default address
              </label>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="px-6 py-5 text-xs font-bold shadow-lg shadow-primary/10 rounded-xl uppercase tracking-wider cursor-pointer"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Address"}
            </Button>
          </div>
        </form>
      )}

      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="p-4 rounded-2xl border border-border/70 bg-background/40 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    {address.label || "Address"}
                  </span>
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary-bright uppercase tracking-wider">
                      <Star className="size-2.5 fill-current" />
                      Default
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {address.addressLine1}
                {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                <br />
                {address.city}, {address.state} - {address.postalCode}
              </p>

              <div className="flex items-center gap-3 pt-1 text-[11px] font-bold">
                <button
                  onClick={() => startEdit(address)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    onClick={() => handleMakeDefault(address.id)}
                    disabled={busyId === address.id}
                    className="flex items-center gap-1 text-muted-foreground hover:text-primary-bright transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Star className="size-3" />
                    Make default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={busyId === address.id}
                  className="flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors cursor-pointer disabled:opacity-50 ml-auto"
                >
                  <Trash2 className="size-3" />
                  {busyId === address.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="text-center py-10 border border-border/40 rounded-2xl bg-muted/5">
            <MapPin className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground">No saved addresses yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add one so you don&apos;t have to retype it at checkout.
            </p>
          </div>
        )
      )}
    </div>
  );
}
