import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Paperclip, Phone, Send, X } from "lucide-react";

import { emirChat, type EmirAttachment } from "@/lib/emir.functions";
import { uploadRequestFiles } from "@/lib/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING = `Merhaba, ben Emir 👋

Enes Yapı'ya hoş geldiniz.

Tadilat, dekorasyon, yenileme veya yapısal bir işiniz varsa size yardımcı olabilirim.

Nasıl yardımcı olabilirim?`;

const SUGGESTIONS = [
  "Dairemi komple yenilemek istiyorum",
  "Banyo yenileme yapıyor musunuz?",
  "Keşif talebi oluşturabilir misiniz?",
];

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [files, setFiles] = useState<EmirAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ask = useServerFn(emirChat);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, loading]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);
    const sent = files;
    try {
      const res = await ask({
        data: {
          sessionId,
          messages: next.slice(-24),
          ...(sent.length ? { attachments: sent } : {}),
        },
      });
      if (res.sessionId) setSessionId(res.sessionId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Şu anda cevap veremedim. 0533 399 25 40 numarasından bize ulaşabilirsiniz." },
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
        { role: "assistant", content: `${uploaded.length} fotoğraf alındı. Talebiniz oluşturulduğunda ekibimize iletilecek.` },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: e instanceof Error ? e.message : "Fotoğraf yüklenemedi." },
      ]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const shown: Msg[] = [{ role: "assistant", content: GREETING }, ...messages];

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
                href="https://wa.me/905333992540"
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
              </div>
            ))}
            {loading ? <div className="text-xs text-muted-foreground">Emir yazıyor…</div> : null}
            {uploading ? <div className="text-xs text-muted-foreground">Fotoğraflar yükleniyor…</div> : null}
            {messages.length === 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
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

          <form
            className="flex items-center gap-2 border-t p-3"
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
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesajınızı yazın…"
              aria-label="Mesajınız"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Gönder">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Emir ile yazışmaya başla"
          className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
          Emir'e sorun
        </button>
      )}
    </>
  );
}
