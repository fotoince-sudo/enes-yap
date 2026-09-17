import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, MessageCircle, Paperclip, Phone, Send, Trash2, X } from "lucide-react";

import { emirChat, type EmirAttachment } from "@/lib/emir.functions";
import { uploadRequestFiles } from "@/lib/uploads";
import { downloadChatPdf } from "@/lib/chat-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string; at: string };

const GREETING = `Merhaba, ben Emir 👋

Enes Yapı'ya hoş geldiniz.

Tadilat, dekorasyon, yenileme veya yapısal bir işiniz varsa size yardımcı olabilirim.

Nasıl yardımcı olabilirim?`;

const SUGGESTIONS = [
  "Dairemi komple yenilemek istiyorum",
  "Banyo yenileme yapıyor musunuz?",
  "Keşif talebi oluşturabilir misiniz?",
];

const STORAGE_KEY = "emir-chat-v1";

type Stored = { sessionId: string | null; startedAt: string; messages: Msg[]; files: EmirAttachment[] };

function loadStored(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

const clock = (at: string) => {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
};

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [startedAt, setStartedAt] = useState<string>(() => new Date().toISOString());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [files, setFiles] = useState<EmirAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ask = useServerFn(emirChat);

  // Sohbet geçmişini bu tarayıcıdan geri yükle
  useEffect(() => {
    const stored = loadStored();
    if (stored) {
      setMessages(stored.messages);
      setSessionId(stored.sessionId ?? null);
      setFiles(Array.isArray(stored.files) ? stored.files : []);
      if (stored.startedAt) setStartedAt(stored.startedAt);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const payload: Stored = { sessionId, startedAt, messages, files };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* depolama dolu olabilir */
    }
  }, [hydrated, sessionId, startedAt, messages, files]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, loading]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: question, at: new Date().toISOString() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    const sent = files;
    try {
      const res = await ask({
        data: {
          sessionId,
          messages: next.slice(-24).map((m) => ({ role: m.role, content: m.content, at: m.at })),
          ...(sent.length ? { attachments: sent } : {}),
        },
      });
      if (res.sessionId) setSessionId(res.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, at: res.at ?? new Date().toISOString() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Şu anda cevap veremedim. 0533 399 25 40 numarasından bize ulaşabilirsiniz.",
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const pickFiles = async (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await uploadRequestFiles(Array.from(picked).slice(0, 5), "foto");
      setFiles((prev) => [...prev, ...uploaded].slice(0, 10));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${uploaded.length} fotoğraf alındı. Talebiniz oluşturulduğunda ekibimize iletilecek.`,
          at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Fotoğraf yüklenemedi.",
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const shown: Msg[] = [{ role: "assistant", content: GREETING, at: startedAt }, ...messages];

  const clearChat = () => {
    setMessages([]);
    setFiles([]);
    setSessionId(null);
    setStartedAt(new Date().toISOString());
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  };

  // Emir sohbetinden WhatsApp'a geçiş: konuşma özeti mesaja hazır olarak taşınır.
  const waText = messages.length
    ? [
        "Merhaba, sitenizde Emir ile görüşüyordum, WhatsApp'tan devam etmek istiyorum.",
        "",
        "Emir ile konuştuklarım:",
        ...messages.slice(-8).map((m) => `${m.role === "user" ? "Ben" : "Emir"}: ${m.content}`),
        files.length ? `(${files.length} fotoğraf sitede paylaşıldı.)` : "",
      ]
        .filter((l) => l !== undefined)
        .join("\n")
    : "Merhaba, Enes Yapı ile tadilat / yenileme işi için görüşmek istiyorum.";
  const waHref = `https://wa.me/905307641717?text=${encodeURIComponent(waText.slice(0, 1400))}`;

  const noteHandoff = () => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Sohbetimizi WhatsApp'a aktardım; oradaki mesaj kutusunda konuştuklarımızın özeti hazır. İstediğiniz zaman buradan da devam edebilirsiniz.",
        at: new Date().toISOString(),
      },
    ]);
  };

  return (
    <>
      {open ? (
        <div className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl border bg-card shadow-xl pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:h-[min(640px,80dvh)] sm:max-h-[80dvh] sm:w-96 sm:rounded-xl sm:pb-0">
          <div className="flex items-center justify-between gap-2 border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Emir · Enes Yapı</p>
              <p className="text-xs opacity-80">Dijital karşılama asistanı</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <a
                href={waHref}
                onClick={noteHandoff}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp'tan yazın"
                className="rounded-full p-2.5 hover:bg-white/10"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="tel:+905333992540" aria-label="Telefonla arayın" className="rounded-full p-2.5 hover:bg-white/10">
                <Phone className="h-5 w-5" />
              </a>
              <button aria-label="Sohbeti kapat" onClick={() => setOpen(false)} className="rounded-full p-2.5 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <span>{messages.length > 0 ? "Sohbet geçmişiniz bu cihazda saklanıyor." : "Sohbet geçmişi boş."}</span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => downloadChatPdf(shown, startedAt)}
                aria-label="Sohbeti PDF indir"
                className="flex items-center gap-1 rounded-full border px-2.5 py-1 hover:bg-accent"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </button>
              {messages.length > 0 ? (
                <button
                  type="button"
                  onClick={clearChat}
                  aria-label="Sohbet geçmişini sil"
                  className="flex items-center gap-1 rounded-full border px-2.5 py-1 hover:bg-accent"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Sil
                </button>
              ) : null}
            </div>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 [-webkit-overflow-scrolling:touch]">
            {shown.map((m, i) => (
              <div
                key={i}
                className={`max-w-[88%] rounded-lg px-3 py-2 text-[15px] leading-relaxed whitespace-pre-line ${
                  m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="space-y-2 [&_a]:underline [&_strong]:font-semibold">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
                {clock(m.at) ? (
                  <div className={`mt-1 text-[10px] ${m.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {clock(m.at)}
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? <div className="text-xs text-muted-foreground">Emir yazıyor…</div> : null}
            {uploading ? <div className="text-xs text-muted-foreground">Fotoğraflar yükleniyor…</div> : null}
            {messages.length === 0 ? (
              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-full border px-3.5 py-2.5 text-left text-[13px] text-muted-foreground hover:bg-accent sm:py-1.5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {files.length > 0 ? (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              Eklenen fotoğraflar: {files.map((f) => f.name).join(", ")}
            </div>
          ) : null}

          <div className="flex items-center gap-2 border-t px-3 pt-2 sm:hidden">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
            >
              <Paperclip className="h-4 w-4" />
              Fotoğraf ekle
            </button>
            <a
              href={waHref}
              onClick={noteHandoff}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent"
            >
              <MessageCircle className="h-4 w-4" />
              {messages.length > 0 ? "WhatsApp'a aktar" : "WhatsApp'tan yazın"}
            </a>
          </div>

          <form
            className="flex items-center gap-2 border-t p-3 sm:border-t-0"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void pickFiles(e.target.files)}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Fotoğraf ekle"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="hidden h-11 w-11 shrink-0 sm:inline-flex"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesajınızı yazın…"
              aria-label="Mesajınız"
              enterKeyHint="send"
              className="h-11 text-base sm:h-10 sm:text-sm"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Gönder" className="h-11 w-11 shrink-0 sm:h-10 sm:w-10">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Emir ile yazışmaya başla"
          className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground shadow-lg hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
          Emir'e sorun
        </button>
      )}
    </>
  );
}
