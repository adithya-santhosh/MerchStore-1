"use client";

import { useState, useMemo } from "react";
import { Car, CheckCircle2, XCircle } from "lucide-react";

interface CompatibleWith {
  id?: number;
  make: string;
  model: string;
  yearFrom: number;
  yearTo?: number | null;
  bodyType?: string | null;
  engineType?: string | null;
  notes?: string | null;
}

interface VehicleCompatibilityProps {
  compatibleWith: CompatibleWith[] | undefined;
}

export default function VehicleCompatibility({ compatibleWith }: VehicleCompatibilityProps) {
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [checkResult, setCheckResult] = useState<"compatible" | "incompatible" | null>(null);

  // Every hook must run on every render. These previously sat below the
  // "no compatibility data" early return, so the hook count changed between a
  // product that had fitment data and one that didn't — React's
  // "Rendered fewer hooks than expected" crash. They now handle the empty case
  // themselves, and the early return moved below them.
  const makes = useMemo(() => {
    if (!compatibleWith?.length) return [];
    const uniqueMakes = new Set(compatibleWith.map(cw => cw.make));
    return Array.from(uniqueMakes).sort();
  }, [compatibleWith]);

  const models = useMemo(() => {
    if (!compatibleWith?.length || !selectedMake) return [];
    const uniqueModels = new Set(
      compatibleWith
        .filter(cw => cw.make === selectedMake)
        .map(cw => cw.model)
    );
    return Array.from(uniqueModels).sort();
  }, [compatibleWith, selectedMake]);

  if (!compatibleWith || compatibleWith.length === 0) {
    return null;
  }

  // Just generic years for now from 1990 to 2026 for simplicity
  const years = Array.from({ length: 37 }, (_, i) => (2026 - i).toString());

  const handleCheck = () => {
    if (!selectedMake || !selectedModel || !selectedYear) return;

    const yearNum = parseInt(selectedYear, 10);
    const isCompatible = compatibleWith.some(cw => {
      if (cw.make !== selectedMake || cw.model !== selectedModel) return false;
      const toYear = cw.yearTo || 2099;
      return yearNum >= cw.yearFrom && yearNum <= toYear;
    });

    setCheckResult(isCompatible ? "compatible" : "incompatible");
  };

  return (
    <div className="space-y-4 bg-primary/5 border border-primary/20 rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Car className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Will this fit my car?</h3>
          <p className="text-xs text-muted-foreground">Select your vehicle to confirm compatibility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={selectedMake}
          onChange={(e) => {
            setSelectedMake(e.target.value);
            setSelectedModel("");
            setCheckResult(null);
          }}
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
        >
          <option value="">Make</option>
          {makes.map(make => (
            <option key={make} value={make}>{make}</option>
          ))}
        </select>

        <select
          value={selectedModel}
          onChange={(e) => {
            setSelectedModel(e.target.value);
            setCheckResult(null);
          }}
          disabled={!selectedMake}
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground disabled:opacity-50"
        >
          <option value="">Model</option>
          {models.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => {
            setSelectedYear(e.target.value);
            setCheckResult(null);
          }}
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
        >
          <option value="">Year</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleCheck}
        disabled={!selectedMake || !selectedModel || !selectedYear}
        className="w-full bg-foreground text-background font-bold py-2.5 rounded-xl text-sm hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Check Compatibility
      </button>

      {checkResult && (
        <div className={`mt-4 flex items-start gap-3 p-4 rounded-xl ${
          checkResult === "compatible" 
            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600" 
            : "bg-rose-500/10 border border-rose-500/30 text-rose-600"
        }`}>
          {checkResult === "compatible" ? (
            <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="size-5 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-sm font-bold">
              {checkResult === "compatible" ? "Yes, it fits!" : "This does not fit your vehicle."}
            </h4>
            <p className="text-xs opacity-90 mt-1">
              {checkResult === "compatible" 
                ? `This product is guaranteed to fit your ${selectedYear} ${selectedMake} ${selectedModel}.` 
                : `We could not find compatibility data for your ${selectedYear} ${selectedMake} ${selectedModel}.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
