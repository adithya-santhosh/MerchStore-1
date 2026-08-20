import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { siteConfig } from "@/lib/site-config";

/**
 * Shared chrome for the legal/policy pages so they stay visually consistent and
 * all carry the same "last updated" date from site-config.
 */
export default function PolicyPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <header className="mb-10 pb-8 border-b border-border/60">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          {intro && (
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {intro}
            </p>
          )}
          <p className="mt-5 text-xs text-muted-foreground">
            Last updated: {siteConfig.policyLastUpdated}
          </p>
        </header>

        <div className="space-y-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

/** A titled section within a policy document. */
export function PolicySection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">{heading}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed [&_a]:text-primary [&_a]:font-semibold hover:[&_a]:underline [&_strong]:text-foreground [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}

/** Bulleted list with consistent spacing inside a PolicySection. */
export function PolicyList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-2 marker:text-primary/60">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
