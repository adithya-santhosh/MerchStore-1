import Link from "next/link";

export default function ComingSoonBlock({ section }: { section: string }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/30 px-6 py-14 text-center max-w-xl mx-auto">
      <p className="text-xs font-semibold tracking-wide text-primary-bright uppercase">Coming soon</p>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">{section}</h2>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        This section opens when the accessories are in stock. Calendars and stickers are available in merchandise.
      </p>
      <Link
        href="/products/merchandise"
        className="inline-flex mt-6 text-sm font-semibold text-primary-bright hover:text-primary-bright/80"
      >
        Shop merchandise
      </Link>
    </div>
  );
}
