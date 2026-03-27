/**
 * Invoice PDF generator — client-side only (browser).
 *
 * Uses jsPDF to produce a clean, branded invoice document that clients
 * can save, print, or forward. Called from InvoicePreview.
 *
 * Design:
 *  ┌────────────────────────────────────────────────────────────┐
 *  │  MAPHARI TECHNOLOGIES        Invoice #INV-0042             │
 *  │  hello@maphari.co.za                                       │
 *  ├────────────────────────────────────────────────────────────┤
 *  │  Bill To · Meta details grid                               │
 *  ├────────────────────────────────────────────────────────────┤
 *  │  Line items table (desc / qty / rate / amount)             │
 *  ├────────────────────────────────────────────────────────────┤
 *  │  Subtotal / VAT (15%) / Total                              │
 *  │  Status pill + footer                                      │
 *  └────────────────────────────────────────────────────────────┘
 */

// ── Types (mirror the Invoice type in invoices-page.tsx) ──────────────────────

export interface InvoiceLineItem {
  desc: string;
  qty: number;
  rate: string;
  total: string;
  totalRaw: number;
}

export interface InvoicePdfData {
  id: string;
  ref: string;
  date: string;
  due: string;
  paidDate?: string;
  amount: string;
  amountRaw: number;
  status: string;
  items: InvoiceLineItem[];
  category: string;
  project?: string;
  contact?: string;
  notes?: string;
}

// ── Colours (design system) ───────────────────────────────────────────────────

const LIME   = [200, 241, 53]  as const; // #c8f135
const DARK   = [10,  10,  10]  as const; // near-black bg
const LIGHT  = [240, 240, 240] as const; // light grey
const MUTED  = [140, 140, 140] as const; // muted text
const WHITE  = [255, 255, 255] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtZar(n: number): string {
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clip(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates and downloads an invoice PDF.
 * Import dynamically to keep jsPDF out of the initial bundle:
 *   const { downloadInvoicePdf } = await import("@/lib/pdf/invoice");
 */
export async function downloadInvoicePdf(inv: InvoicePdfData): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  const W   = doc.internal.pageSize.getWidth();
  const H   = doc.internal.pageSize.getHeight();
  const PAD = 48;
  let y     = 0;

  // ── Background fill ──────────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");

  // ── Header bar ───────────────────────────────────────────────────────────
  const HEADER_H = 80;
  doc.setFillColor(...LIME);
  doc.rect(0, 0, W, HEADER_H, "F");

  // Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text("MAPHARI TECHNOLOGIES", PAD, 30);

  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text("hello@maphari.co.za  ·  maphari.co.za", PAD, 44);

  // Invoice number (right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...DARK);
  doc.text("INVOICE", W - PAD, 28, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`#${inv.id}`, W - PAD, 44, { align: "right" });

  // ── Status pill (top-right of header) ────────────────────────────────────
  const pillColors: Record<string, [number, number, number]> = {
    Paid:        [34, 197, 94],
    Outstanding: [245, 158, 11],
    Overdue:     [239, 68, 68],
  };
  const pillColor = pillColors[inv.status] ?? MUTED;
  const pillLabel = inv.status.toUpperCase();
  const pillW = 70;
  const pillH = 16;
  doc.setFillColor(...pillColor);
  doc.roundedRect(W - PAD - pillW, 55, pillW, pillH, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(pillLabel, W - PAD - pillW / 2, 65, { align: "center" });

  y = HEADER_H + 32;

  // ── Metadata grid ─────────────────────────────────────────────────────────
  const meta: Array<[string, string]> = [
    ["Reference",   inv.ref],
    ["Issue Date",  inv.date],
    ["Due Date",    inv.due],
    ...(inv.project ? [["Project", inv.project] as [string, string]] : []),
    ["Category",    inv.category],
    ...(inv.contact ? [["Bill To", inv.contact] as [string, string]] : []),
    ...(inv.paidDate ? [["Paid On", inv.paidDate] as [string, string]] : []),
  ];

  const colW  = (W - PAD * 2) / 2;
  const rowH  = 22;
  let metaY   = y;

  meta.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x   = PAD + col * colW;
    const my  = metaY + row * rowH;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x, my);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...LIGHT);
    doc.text(clip(value, 38), x, my + 11);
  });

  const metaRows = Math.ceil(meta.length / 2);
  y = metaY + metaRows * rowH + 24;

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.5);
  doc.line(PAD, y, W - PAD, y);
  y += 20;

  // ── Line items table ──────────────────────────────────────────────────────
  const COL = {
    desc:  PAD,
    qty:   PAD + 270,
    rate:  PAD + 330,
    total: W - PAD,
  };

  // Table header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("DESCRIPTION",     COL.desc,  y);
  doc.text("QTY",             COL.qty,   y, { align: "right" });
  doc.text("RATE",            COL.rate,  y, { align: "right" });
  doc.text("AMOUNT",          COL.total, y, { align: "right" });
  y += 6;

  doc.setDrawColor(60, 60, 60);
  doc.line(PAD, y, W - PAD, y);
  y += 14;

  // Item rows
  const ITEM_H = 22;
  inv.items.forEach((item, idx) => {
    // Zebra stripe
    if (idx % 2 === 0) {
      doc.setFillColor(20, 20, 20);
      doc.rect(PAD - 4, y - 13, W - PAD * 2 + 8, ITEM_H, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...LIGHT);
    doc.text(clip(item.desc, 42), COL.desc, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(String(item.qty), COL.qty,   y, { align: "right" });
    doc.text(item.rate,        COL.rate,  y, { align: "right" });
    doc.text(item.total,       COL.total, y, { align: "right" });

    y += ITEM_H;
  });

  y += 4;
  doc.setDrawColor(60, 60, 60);
  doc.line(PAD, y, W - PAD, y);
  y += 20;

  // ── Totals ────────────────────────────────────────────────────────────────
  const vat   = Math.round(inv.amountRaw * 0.15);
  const total = inv.amountRaw + vat;

  const totals: Array<[string, string, boolean]> = [
    ["Subtotal",          fmtZar(inv.amountRaw), false],
    ["VAT (15%)",         fmtZar(vat),           false],
    ["Total Due",         fmtZar(total),         true],
  ];

  totals.forEach(([label, value, highlight]) => {
    const labelX = W - PAD - 180;

    if (highlight) {
      doc.setFillColor(...LIME);
      doc.rect(labelX - 8, y - 14, W - labelX + 16, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...DARK);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
    }

    doc.text(label, labelX, y);
    doc.text(value, W - PAD, y, { align: "right" });

    y += 22;
  });

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (inv.notes) {
    y += 12;
    doc.setDrawColor(...MUTED);
    doc.line(PAD, y, W - PAD, y);
    y += 16;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("NOTES", PAD, y);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...LIGHT);

    const noteLines = doc.splitTextToSize(inv.notes, W - PAD * 2);
    doc.text(noteLines, PAD, y);
    y += noteLines.length * 12 + 8;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = H - 36;
  doc.setDrawColor(40, 40, 40);
  doc.line(PAD, footerY, W - PAD, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("Maphari Technologies (Pty) Ltd  ·  South Africa", PAD, footerY + 16);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`,
    W - PAD,
    footerY + 16,
    { align: "right" }
  );

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(`maphari-invoice-${inv.id}.pdf`);
}
