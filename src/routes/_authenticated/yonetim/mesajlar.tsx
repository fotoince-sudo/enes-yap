import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState, useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { sendWhatsappReply } from "@/lib/whatsapp.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/yonetim/mesajlar")({
  component: MessagesPanel,
  head: () => ({
    meta: [{ title: "WhatsApp Mesajları | Enes Yapı Yönetim" }],
  }),
});

type WaMessage = {
  id: string;
  direction: "in" | "out";
  wa_message_id: string | null;
  contact_phone: string;
  contact_name: string | null;
  body: string | null;
  status: string;
  status_error: string | null;
  provider_timestamp: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  received: "Alındı",
  pending: "Gönderiliyor",
  accepted: "Kabul edildi",
  sent: "Gönderildi",
  delivered: "İletildi",
  read: "Okundu",
  failed: "Başarısız",
};

/** Giden mesajlar için WhatsApp tarzı durum işaretleri (okundu = mavi). */
function StatusTicks({ status }: { status: string }) {
  if (status === "failed") return <span className="text-destructive" title="Başarısız">✕</span>;
  if (status === "pending") return <span title="Gönderiliyor">⋯</span>;
  if (status === "received") return null;
  const label = STATUS_LABEL[status] ?? status;
  if (status === "read") {
    return (
      <span className="text-sky-500" title={label}>
        ✓✓
      </span>
    );
  }
  const marks = status === "delivered" || status === "sent" ? "✓✓" : "✓";
  return <span title={label}>{marks}</span>;
}

function formatPhone(digits: string) {
  if (digits.startsWith("90") && digits.length === 12) {
    return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return `+${digits}`;
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function MessagesPanel() {
  const queryClient = useQueryClient();
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const messagesQuery = useQuery({
    queryKey: ["wa-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select(
          "id, direction, wa_message_id, contact_phone, contact_name, body, status, status_error, provider_timestamp, created_at",
        )
        .order("created_at", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as WaMessage[];
    },
    refetchInterval: 20000,
  });

  const messages = messagesQuery.data ?? [];

  const conversations = useMemo(() => {
    const map = new Map<string, { phone: string; name: string | null; last: WaMessage; count: number }>();
    for (const m of messages) {
      const prev = map.get(m.contact_phone);
      map.set(m.contact_phone, {
        phone: m.contact_phone,
        name: m.contact_name ?? prev?.name ?? null,
        last: m,
        count: (prev?.count ?? 0) + 1,
      });
    }
    return [...map.values()].sort((a, b) => (a.last.created_at < b.last.created_at ? 1 : -1));
  }, [messages]);

  const selected = useMemo(
    () => (selectedPhone ? messages.filter((m) => m.contact_phone === selectedPhone) : []),
    [messages, selectedPhone],
  );
  const selectedConversation = conversations.find((c) => c.phone === selectedPhone) ?? null;

  const send = useServerFn(sendWhatsappReply);
  const sendMutation = useMutation({
    mutationFn: async (input: { phone: string; body: string }) => await send({ data: input }),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["wa-messages"] });
    },
  });

  useEffect(() => {
    if (selected.length && threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ block: "end" });
    }
  }, [selected.length, selectedPhone]);

  const submit = () => {
    const body = draft.trim();
    if (!body || !selectedPhone || sendMutation.isPending) return;
    sendMutation.mutate({ phone: selectedPhone, body });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp Mesajları</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Müşterilerinizden gelen WhatsApp mesajları burada toplanır; panelden yanıt verebilirsiniz. Liste her 20
          saniyede yenilenir.
        </p>
      </div>

      {messagesQuery.isError ? (
        <p className="text-sm text-destructive">
          Mesajlar yüklenemedi: {(messagesQuery.error as Error)?.message ?? "bilinmeyen hata"}
        </p>
      ) : null}

      {sendMutation.data && !sendMutation.data.ok && sendMutation.data.error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {sendMutation.data.error}
        </div>
      ) : null}

      {messagesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : conversations.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Henüz mesaj yok. WhatsApp Business bağlantısı tamamlandığında numaranıza gelen mesajlar otomatik olarak burada
          görünür.
        </div>
      ) : (
        <div className={cn("grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]", selectedPhone && "hidden lg:grid")}>
          {/* Sohbet listesi */}
          <div className="rounded-lg border bg-card">
            <p className="border-b px-4 py-3 text-sm font-medium">Sohbetler ({conversations.length})</p>
            <ul className="max-h-[60vh] divide-y overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.phone}>
                  <button
                    type="button"
                    onClick={() => setSelectedPhone(c.phone)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-accent",
                      selectedPhone === c.phone && "bg-accent",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {c.name || formatPhone(c.phone)}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatTime(c.last.created_at)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {c.last.direction === "in" ? "" : "Siz: "}
                        {c.last.body ?? ""}
                      </span>
                      {c.last.status === "failed" ? (
                        <span className="shrink-0 rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] text-destructive">
                          Hata
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Sohbet */}
          <div className="flex min-h-[60vh] flex-col rounded-lg border bg-card">
            {selectedPhone && selectedConversation ? (
              <>
                <div className="flex items-center gap-2 border-b px-4 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="lg:hidden"
                    onClick={() => setSelectedPhone(null)}
                    aria-label="Sohbet listesine dön"
                  >
                    ←
                  </Button>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {selectedConversation.name || formatPhone(selectedPhone)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{formatPhone(selectedPhone)}</p>
                  </div>
                  <a
                    href={`https://wa.me/${selectedPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto shrink-0 text-xs text-primary underline-offset-2 hover:underline"
                  >
                    WhatsApp'ta aç
                  </a>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                  {selected.map((m) => (
                    <div
                      key={m.id}
                      className={cn("flex", m.direction === "in" ? "justify-start" : "justify-end")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm sm:max-w-[70%]",
                          m.direction === "in"
                            ? "rounded-bl-md bg-muted text-foreground"
                            : "rounded-br-md bg-primary text-primary-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p
                          className={cn(
                            "mt-1 text-right text-[10px]",
                            m.direction === "in" ? "text-muted-foreground" : "text-primary-foreground/70",
                          )}
                        >
                          {formatTime(m.provider_timestamp ?? m.created_at)}
                          {m.direction === "out" ? ` · ${STATUS_LABEL[m.status] ?? m.status}` : ""}
                        </p>
                        {m.status_error ? (
                          <p className="mt-1 text-[10px] text-destructive">{m.status_error}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <div ref={threadEndRef} />
                </div>

                <div className="flex gap-2 border-t p-3">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                      }
                    }}
                    placeholder="Yanıt yazın…"
                    aria-label="Yanıt mesajı"
                  />
                  <Button size="sm" onClick={submit} disabled={sendMutation.isPending || !draft.trim()}>
                    {sendMutation.isPending ? "Gönderiliyor…" : "Gönder"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                Soldan bir sohbet seçin.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedPhone && conversations.length > 0 ? (
        <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setSelectedPhone(null)}>
          ← Sohbet listesine dön
        </Button>
      ) : null}
    </div>
  );
}
