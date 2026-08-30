"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import type { ApiFieldError } from "@/lib/errors";
import { productFieldLabel } from "@/lib/product-fields";

interface FormErrorSummaryProps {
  /** Field-level failures from a 422, if the last save produced any. */
  fieldErrors: ApiFieldError[];
  /** Shown when the failure carried no field detail — a network error, a 500. */
  message: string | null;
}

/**
 * The failed-save summary for the admin product forms.
 *
 * It scrolls itself into view because the confirm dialog closes on failure and
 * the admin is usually scrolled to the bottom of a long form by then, so a
 * panel at the top would otherwise go unnoticed and the save would look as
 * though it silently did nothing.
 */
export default function FormErrorSummary({ fieldErrors, message }: FormErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = fieldErrors.length > 0 || Boolean(message);

  useEffect(() => {
    if (visible) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [visible, fieldErrors, message]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      role="alert"
      className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 space-y-2"
    >
      <p className="flex items-center gap-2 text-sm font-bold text-destructive">
        <AlertTriangle className="size-4 shrink-0" />
        {fieldErrors.length > 0
          ? `Please fix ${fieldErrors.length} field${fieldErrors.length === 1 ? "" : "s"} before saving`
          : "This product could not be saved"}
      </p>

      {fieldErrors.length > 0 ? (
        <ul className="space-y-1 pl-6 list-disc marker:text-destructive/60">
          {fieldErrors.map((error, idx) => (
            <li key={`${error.field}-${idx}`} className="text-xs text-foreground">
              <span className="font-semibold">{productFieldLabel(error.field)}</span>
              {" — "}
              {error.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-foreground">{message}</p>
      )}
    </div>
  );
}
