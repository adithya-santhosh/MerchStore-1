import { cookies } from "next/headers";
import { getContactMessagesApi } from "@/lib/api";
import { Mail, MessageSquareText } from "lucide-react";

export default async function AdminMessagesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const messages = await getContactMessagesApi(token);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Contact Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submissions from the storefront&apos;s Contact Us form, newest first.
        </p>
      </div>

      {messages.length > 0 ? (
        <div className="bg-card/40 border border-border/85 rounded-3xl overflow-hidden shadow-sm divide-y divide-border/60">
          {messages.map((msg) => (
            <div key={msg.id} className="p-6 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-foreground text-sm">{msg.name}</p>
                  <a
                    href={`mailto:${msg.email}`}
                    className="text-xs text-muted-foreground hover:text-primary-bright transition-colors"
                  >
                    {msg.email}
                  </a>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {formatDate(msg.createdAt)}
                </span>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-background/50 border border-border/60 rounded-xl p-4">
                {msg.message}
              </p>
              <a
                href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: your message to MerchStore`)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-bright hover:underline"
              >
                <Mail className="size-3.5" />
                Reply by email
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-border/80 rounded-3xl bg-card/20 max-w-md mx-auto space-y-4">
          <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/40 mx-auto">
            <MessageSquareText className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">No Messages Yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              Submissions from the Contact Us page will show up here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
