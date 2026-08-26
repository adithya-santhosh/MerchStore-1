"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleCheck, AlertCircle, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailApi } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, setState] = useState<"verifying" | "success" | "already" | "error">(
    token ? "verifying" : "error"
  );
  const [message, setMessage] = useState(
    token ? "" : "This link is missing its confirmation token."
  );

  // React runs effects twice in dev StrictMode; without this the request fires
  // twice and the second response can overwrite the first.
  const startedRef = useRef(false);

  useEffect(() => {
    if (!token || startedRef.current) return;
    startedRef.current = true;

    verifyEmailApi(token)
      .then((res) => {
        setState(res.alreadyVerified ? "already" : "success");
        setMessage(res.message);
      })
      .catch((err: Error) => {
        setState("error");
        setMessage(err.message);
      });
  }, [token]);

  const icon = {
    verifying: <MailCheck className="size-6" />,
    success: <CircleCheck className="size-6" />,
    already: <CircleCheck className="size-6" />,
    error: <AlertCircle className="size-6" />,
  }[state];

  const iconWrapper = {
    verifying: "bg-primary text-primary-foreground",
    success: "bg-emerald-500 text-white",
    already: "bg-emerald-500 text-white",
    error: "bg-destructive/15 border border-destructive/30 text-destructive",
  }[state];

  const heading = {
    verifying: "Confirming your email…",
    success: "Email Confirmed",
    already: "Already Confirmed",
    error: "Confirmation Failed",
  }[state];

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 -z-10 size-80 rounded-full bg-primary/3 opacity-25 blur-3xl" />
      <div className="absolute bottom-10 right-10 -z-10 size-96 rounded-full bg-primary/2 opacity-25 blur-3xl" />

      <div className="w-full max-w-md bg-card/35 backdrop-blur-md border border-border/80 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Store
        </Link>

        <div className="text-center space-y-4">
          <div className={`size-12 rounded-2xl flex items-center justify-center mx-auto ${iconWrapper}`}>
            {icon}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">{heading}</h1>
            {message && (
              <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
            )}
          </div>
        </div>

        {state !== "verifying" && (
          <div className="space-y-2">
            <Button asChild className="w-full py-6 text-sm font-bold rounded-xl cursor-pointer">
              <Link href={state === "error" ? "/dashboard" : "/products"}>
                {state === "error" ? "Go to My Account" : "Start Shopping"}
              </Link>
            </Button>
            {state === "error" && (
              <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                You can send yourself a fresh confirmation link from your account page.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
