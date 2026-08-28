"use client";

import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

// Matches the plain inputs on the auth screens, with extra right padding so
// the text never runs under the reveal toggle.
const passwordInputClass =
  "w-full bg-background border border-input rounded-xl pl-10 pr-11 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-semibold";

/**
 * Password field with a show/hide toggle, styled to match the auth screens.
 *
 * The toggle is `type="button"` so it never submits the surrounding form, and
 * it stays in the tab order so keyboard-only users can reveal what they typed.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(passwordInputClass, className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <Icon className="size-4" />
      </button>
    </div>
  );
}
