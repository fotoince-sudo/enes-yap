export type ChatPdfMessage = { role: "user" | "assistant"; content: string; at?: string | null };

const COMPANY = {
  name: "Enes Yapı",
  claim: "Tadilat ve Yenileme Çözümleri",
  phone: "0530 764 17 17",
  address: "Manavkuyu Mah. Sakarya Cad. Bayraklı / İzmir",
};

const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmt = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
};

function buildHtml(messages: ChatPdfMessage[], startedAt?: string | null) {
  const rows = messages
    .map(
      (m) => `
      <div class="msg ${m.role}">
        <div class="who">${m.role === "user" ? "Siz" : "Emir · Enes Yapı"}${
          fmt(m.at) ? ` <span class="time">${esc(fmt(m.at))}</span>` : ""
        }</div>
        <div class="body">${esc(m.content).replace(/\n/g, "<br />")}</div>
      </div>`,
    )
    .join("");

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8" />
<title>Enes-Yapi-Emir-Sohbet</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, "Segoe UI", sans-serif; color: #1b2431; margin: 0; font-size: 11.5px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1b2431; padding-bottom: 10px; }
  h1 { margin: 0; font-size: 20px; letter-spacing: .5px; }
  .claim { font-size: 10px; color: #64748b; margin-top: 2px; }
  .company { text-align: right; font-size: 10px; color: #475569; line-height: 1.5; }
  h2 { font-size: 14px; margin: 18px 0 4px; }
  .meta { font-size: 10.5px; color: #64748b; margin-bottom: 12px; }
  .msg { border: 1px solid #d7dee8; border-radius: 6px; padding: 7px 9px; margin-bottom: 7px; page-break-inside: avoid; }
  .msg.user { background: #f1f5f9; }
  .who { font-size: 9.5px; font-weight: 700; color: #334155; margin-bottom: 3px; }
  .time { font-weight: 400; color: #94a3b8; }
  .body { line-height: 1.55; }
  footer { margin-top: 20px; font-size: 9.5px; color: #64748b; border-top: 1px solid #d7dee8; padding-top: 8px; }
</style></head>
<body>
  <header>
    <div>
      <h1>${COMPANY.name}</h1>
      <div class="claim">${COMPANY.claim}</div>
    </div>
    <div class="company">${COMPANY.address}<br />Tel / WhatsApp: ${COMPANY.phone}</div>
  </header>

  <h2>Emir ile sohbet kaydı</h2>
  <div class="meta">
    ${startedAt && fmt(startedAt) ? `Başlangıç: ${esc(fmt(startedAt))} · ` : ""}${messages.length} mesaj ·
    Döküm tarihi: ${esc(fmt(new Date().toISOString()))}
  </div>

  ${rows || '<div class="meta">Bu sohbette henüz mesaj yok.</div>'}

  <footer>
    Bu döküm bilgilendirme amaçlıdır; fiyat, süre ve kapsam keşif sonrası netleşir.
    ${COMPANY.name} · ${COMPANY.phone}
  </footer>
</body></html>`;
}

/** Sohbet dökümünü yazdırma / PDF olarak kaydetme ekranında açar. */
export function downloadChatPdf(messages: ChatPdfMessage[], startedAt?: string | null) {
  const html = buildHtml(messages, startedAt);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      window.setTimeout(() => frame.remove(), 1000);
    }
  };

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    throw new Error("PDF oluşturulamadı.");
  }
  doc.open();
  doc.write(html);
  doc.close();
}
