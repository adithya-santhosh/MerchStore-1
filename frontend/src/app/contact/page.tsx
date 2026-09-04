"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { submitContactMessageApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await submitContactMessageApi({ name, email, message });
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send your message. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Have questions about your order or customized drops? Get in touch.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Business details — these are what customers (and payment
              gateways) look for to confirm a real business is behind the site */}
          <aside className="lg:col-span-2 space-y-6 bg-card/40 border border-border rounded-3xl p-7">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Reach Us Directly
              </h2>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                We reply to most messages within one business day.
              </p>
            </div>

            <div className="space-y-5 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Email</p>
                  <a
                    href={`mailto:${siteConfig.supportEmail}`}
                    className="text-xs text-muted-foreground hover:text-primary-bright transition-colors break-all"
                  >
                    {siteConfig.supportEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Phone</p>
                  <a
                    href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`}
                    className="text-xs text-muted-foreground hover:text-primary-bright transition-colors"
                  >
                    {siteConfig.supportPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Support Hours</p>
                  <p className="text-xs text-muted-foreground">{siteConfig.supportHours}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Registered Address</p>
                  <address className="text-xs text-muted-foreground not-italic leading-relaxed">
                    {siteConfig.legalName}
                    <br />
                    {siteConfig.address.line1}
                    <br />
                    {siteConfig.address.line2}
                    <br />
                    {siteConfig.address.city}, {siteConfig.address.state}{" "}
                    {siteConfig.address.postalCode}
                    <br />
                    {siteConfig.address.country}
                  </address>
                  {siteConfig.gstin && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      GSTIN: {siteConfig.gstin}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Message form */}
          {submitted ? (
            <div className="lg:col-span-3 flex flex-col items-center justify-center text-center gap-4 bg-card border border-border rounded-3xl p-8 shadow-sm min-h-[420px]">
              <CheckCircle2 className="size-12 text-primary-bright" />
              <div>
                <h2 className="text-lg font-bold text-foreground">Message sent</h2>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
                  Thanks for reaching out — we reply to most messages within one
                  business day.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => setSubmitted(false)}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-3 space-y-6 bg-card border border-border rounded-3xl p-8 shadow-sm"
            >
              {error && (
                <div
                  role="alert"
                  className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-start gap-2"
                >
                  <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Your Name"
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="you@example.com"
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  placeholder="What can we help you with?"
                  disabled={submitting}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full shadow-md cursor-pointer py-6 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send Message"}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                You can also write to us directly at {siteConfig.supportEmail}.
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
