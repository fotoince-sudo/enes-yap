import { QUOTE_STATUS, tl, trDate } from "@/lib/domain";

export type QuotePdfItem = {
  title: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  material_cost: number;
  labor_cost: number;
  line_total: number;
};

export type QuotePdfData = {
  quoteNo: number | string;
  title?: string | null;
  customerName?: string | null;
  status?: string | null;
  createdAt?: string | null;
  validUntil?: string | null;
  notes?: string | null;
  items: QuotePdfItem[];
  itemsTotal: number;
  materials: number;
  labor: number;
  extra: number;
  discount: number;
  vatRate: number;
  vat: number;
  grandTotal: number;
};

const COMPANY = {
  name: "Enes Yapı",
  claim: "Tadilat ve Yenileme Çözümleri",
  phone: "0533 399 25 40",
  address: "Manavkuyu Mah. Sakarya Cad. Bayraklı / İzmir",
};

const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const num = (value: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);

function buildHtml(data: QuotePdfData) {
  const rows = data.items.length
    ? data.items
        .map(
          (i, index) => `
        <tr>
          <td class="c">${index + 1}</td>
          <td><strong>${esc(i.title)}</strong>${i.description ? `<div class="muted">${esc(i.description)}</div>` : ""}</td>
          <td class="c">${num(Number(i.quantity ?? 0))}</td>
          <td class="c">${esc(i.unit)}</td>
          <td class="r">${tl(i.unit_price)}</td>
          <td class="r">${tl(i.material_cost)}</td>
          <td class="r">${tl(i.labor_cost)}</td>
          <td class="r"><strong>${tl(i.line_total)}</strong></td>
        </tr>`,
        )
        .join("")
    : `<tr><td colspan="8" class="c muted">Bu teklife henüz iş kalemi eklenmemiş.</td></tr>`;

  const statusLabel = data.status
    ? (QUOTE_STATUS as Record<string, string>)[data.status] ?? data.status
    : "—";

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8" />
<title>Enes-Yapi-Teklif-${esc(data.quoteNo)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, "Segoe UI", sans-serif; color: #1b2431; margin: 0; font-size: 11px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1b2431; padding-bottom: 10px; }
  h1 { margin: 0; font-size: 20px; letter-spacing: .5px; }
  .claim { font-size: 10px; color: #64748b; margin-top: 2px; }
  .company { text-align: right; font-size: 10px; color: #475569; line-height: 1.5; }
  h2 { font-size: 14px; margin: 18px 0 8px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px 28px; margin-top: 12px; }
  .meta div { font-size: 10.5px; }
  .meta span { color: #64748b; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { border: 1px solid #d7dee8; padding: 6px 7px; vertical-align: top; }
  th { background: #f1f5f9; font-size: 10px; text-align: left; }
  .c { text-align: center; }
  .r { text-align: right; white-space: nowrap; }
  .muted { color: #64748b; font-size: 9.5px; }
  .totals { margin-top: 14px; margin-left: auto; width: 62%; }
  .totals td { border: none; padding: 3px 0; }
  .totals tr.grand td { border-top: 1.5px solid #1b2431; padding-top: 7px; font-size: 13px; font-weight: 700; }
  .notes { margin-top: 16px; border: 1px solid #d7dee8; padding: 8px 10px; }
  footer { margin-top: 22px; font-size: 9.5px; color: #64748b; border-top: 1px solid #d7dee8; padding-top: 8px; }
  tr { page-break-inside: avoid; }
</style></head>
<body>
  <header>
    <div>
      <h1>${COMPANY.name}</h1>
      <div class="claim">${COMPANY.claim}</div>
    </div>
    <div class="company">
      ${COMPANY.address}<br />Tel / WhatsApp: ${COMPANY.phone}
    </div>
  </header>

  <h2>Teklif #${esc(data.quoteNo)}${data.title ? ` — ${esc(data.title)}` : ""}</h2>
  <div class="meta">
    <div><span>Müşteri:</span> <strong>${esc(data.customerName ?? "—")}</strong></div>
    <div><span>Teklif tarihi:</span> ${trDate(data.createdAt)}</div>
    <div><span>Geçerlilik:</span> ${trDate(data.validUntil)}</div>
    <div><span>Durum:</span> ${esc(statusLabel)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="c">#</th><th>İş kalemi</th><th class="c">Miktar</th><th class="c">Birim</th>
        <th class="r">Birim fiyat</th><th class="r">Malzeme</th><th class="r">İşçilik</th><th class="r">Toplam</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <table class="totals">
    <tr><td>Kalemler toplamı</td><td class="r">${tl(data.itemsTotal)}</td></tr>
    <tr><td>Malzeme</td><td class="r">${tl(data.materials)}</td></tr>
    <tr><td>İşçilik</td><td class="r">${tl(data.labor)}</td></tr>
    <tr><td>Ek gider</td><td class="r">${tl(data.extra)}</td></tr>
    <tr><td>İskonto</td><td class="r">&#8722;&nbsp;${tl(data.discount)}</td></tr>
    <tr><td>KDV (%${num(data.vatRate)})</td><td class="r">${tl(data.vat)}</td></tr>
    <tr class="grand"><td>Genel toplam</td><td class="r">${tl(data.grandTotal)}</td></tr>
  </table>

  ${data.notes ? `<div class="notes"><strong>Notlar</strong><div class="muted" style="margin-top:4px">${esc(data.notes).replace(/\n/g, "<br />")}</div></div>` : ""}

  <footer>
    Fiyatlar keşif sonrası belirlenmiştir; iş kapsamı değişirse teklif güncellenir.
    ${COMPANY.name} · ${COMPANY.phone} · ${COMPANY.address}
  </footer>
</body></html>`;
}

/** Teklifi yazdırma/PDF olarak kaydetme ekranında açar. */
export function downloadQuotePdf(data: QuotePdfData) {
  const html = buildHtml(data);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const cleanup = () => {
    window.setTimeout(() => frame.remove(), 1000);
  };

  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      cleanup();
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
