"use client";
import { useState } from "react";
import { cx, styles } from "../style";

/* ─── Types ────────────────────────────────────────────────────────────────── */

type Props = { active: boolean };
type BrandTab = "Guidelines" | "Logos" | "Colors" | "Typography";

type GuidelineSection = {
  id: string;
  title: string;
  content: string;
  type: "principle" | "do" | "dont";
};

type LogoAsset = {
  id: string;
  name: string;
  variant: string;
  format: string;
  emoji: string;
  bgColor: string;
};

type ColorSwatch = {
  id: string;
  name: string;
  hex: string;
  usage: string;
  cssVar: string;
};

type TypographyItem = {
  id: string;
  fontFamily: string;
  weight: string;
  usage: string;
  sampleText: string;
  cssVar: string;
};

/* ─── Seed Data ────────────────────────────────────────────────────────────── */

const BRAND_TABS: BrandTab[] = ["Guidelines", "Logos", "Colors", "Typography"];

const PRINCIPLES: GuidelineSection[] = [
  {
    id: "p1",
    title: "Clarity over Cleverness",
    content:
      "Every piece of communication should be immediately understandable. Avoid jargon, over-designed layouts, and ambiguous language. If it takes more than three seconds to parse, simplify it.",
    type: "principle",
  },
  {
    id: "p2",
    title: "Precision & Intentionality",
    content:
      "Nothing ships by accident. Every color, word, and interaction is chosen deliberately. We measure twice and cut once, ensuring our brand communicates exactly what we intend.",
    type: "principle",
  },
  {
    id: "p3",
    title: "Elevate the Craft",
    content:
      "We are builders for builders. Our brand should reflect the technical sophistication and quality of the products we create. Pixel-perfect, performance-obsessed, detail-oriented.",
    type: "principle",
  },
  {
    id: "p4",
    title: "Inclusive by Default",
    content:
      "Accessible color contrasts, clear typography hierarchies, and culturally respectful imagery are non-negotiable. Design for the widest possible audience from the start.",
    type: "principle",
  },
];

const DOS: GuidelineSection[] = [
  { id: "do1", title: "", content: "Use the lime accent sparingly as a highlight, not a background fill.", type: "do" },
  { id: "do2", title: "", content: "Maintain minimum 16px body text for readability across all devices.", type: "do" },
  { id: "do3", title: "", content: "Pair Instrument Serif headings with Syne body text for hierarchy.", type: "do" },
  { id: "do4", title: "", content: "Keep generous whitespace between sections to let content breathe.", type: "do" },
  { id: "do5", title: "", content: "Use DM Mono for data labels, code snippets, and numerical values.", type: "do" },
];

const DONTS: GuidelineSection[] = [
  { id: "dont1", title: "", content: "Never place lime text on a white background (fails WCAG AA contrast).", type: "dont" },
  { id: "dont2", title: "", content: "Do not stretch, rotate, or apply effects to the logo mark.", type: "dont" },
  { id: "dont3", title: "", content: "Avoid using more than two typefaces in a single layout.", type: "dont" },
  { id: "dont4", title: "", content: "Do not mix brand green with brand purple in the same component.", type: "dont" },
  { id: "dont5", title: "", content: "Never use low-resolution or pixelated versions of brand assets.", type: "dont" },
];

const LOGO_ASSETS: LogoAsset[] = [
  { id: "l1", name: "Primary (Dark BG)", variant: "Full color on dark", format: "SVG, PNG @2x", emoji: "M", bgColor: "var(--s1)" },
  { id: "l2", name: "Primary (Light BG)", variant: "Full color on light", format: "SVG, PNG @2x", emoji: "M", bgColor: "var(--raw-white)" },
  { id: "l3", name: "Monochrome (Dark)", variant: "White on dark", format: "SVG, PNG @2x", emoji: "M", bgColor: "var(--s3)" },
  { id: "l4", name: "Monochrome (Light)", variant: "Dark on light", format: "SVG, PNG @2x", emoji: "M", bgColor: "var(--raw-light-2)" },
  { id: "l5", name: "Icon Only (Dark)", variant: "Mark on dark", format: "SVG, PNG, ICO", emoji: "M", bgColor: "var(--s2)" },
  { id: "l6", name: "Icon Only (Light)", variant: "Mark on light", format: "SVG, PNG, ICO", emoji: "M", bgColor: "var(--raw-light-1)" },
  { id: "l7", name: "Wordmark", variant: "Text only horizontal", format: "SVG, PNG @2x", emoji: "M", bgColor: "var(--s1)" },
  { id: "l8", name: "Favicon", variant: "16x16 / 32x32 / 48x48", format: "ICO, PNG", emoji: "M", bgColor: "var(--s2)" },
];

const COLOR_SWATCHES: ColorSwatch[] = [
  { id: "c1",  name: "Lime Primary",  hex: "#c8f135", usage: "Primary accent, CTAs, active indicators",         cssVar: "--lime" },
  { id: "c2",  name: "Lime Dark",     hex: "#6B8C1F", usage: "Muted accent for secondary elements",             cssVar: "--lime-d" },
  { id: "c3",  name: "Surface Dark",  hex: "#0d0d14", usage: "Card backgrounds, panels, modals",                cssVar: "--s1" },
  { id: "c4",  name: "Surface Light", hex: "#FAFAF8", usage: "Light theme backgrounds, contrast text",          cssVar: "--raw-white" },
  { id: "c5",  name: "Green",         hex: "#34d98b", usage: "Success states, positive metrics, approvals",     cssVar: "--green" },
  { id: "c6",  name: "Red",           hex: "#ff5f5f", usage: "Errors, destructive actions, overdue alerts",     cssVar: "--red" },
  { id: "c7",  name: "Amber",         hex: "#f5a623", usage: "Warnings, pending states, attention needed",      cssVar: "--amber" },
  { id: "c8",  name: "Purple",        hex: "#8b6fff", usage: "Design work, creative elements, version badges",  cssVar: "--purple" },
  { id: "c9",  name: "Muted",         hex: "#6b6b80", usage: "Secondary text, labels, placeholders",            cssVar: "--muted" },
  { id: "c10", name: "White",         hex: "#FFFFFF", usage: "Primary text on dark, icon fills, active labels", cssVar: "--text" },
];

const TYPOGRAPHY_ITEMS: TypographyItem[] = [
  {
    id: "t1",
    fontFamily: "'Instrument Serif', serif",
    weight: "400 (Regular)",
    usage: "Page titles, editorial headings, hero sections, brand moments",
    sampleText: "The quick brown fox jumps over the lazy dog",
    cssVar: "--font-instrument-serif",
  },
  {
    id: "t2",
    fontFamily: "'Syne', sans-serif",
    weight: "500 / 600 / 700 / 800",
    usage: "Section headings, navigation labels, button text, card titles",
    sampleText: "The quick brown fox jumps over the lazy dog",
    cssVar: "--font-syne",
  },
  {
    id: "t3",
    fontFamily: "'DM Mono', monospace",
    weight: "400 / 500",
    usage: "Data labels, code snippets, hex values, technical references",
    sampleText: "const brand = { accent: '#c8f135' };",
    cssVar: "--font-dm-mono",
  },
  {
    id: "t4",
    fontFamily: "'Inter', sans-serif",
    weight: "400 / 500 / 600 / 700",
    usage: "Body copy, form inputs, tooltips, system text fallback",
    sampleText: "The quick brown fox jumps over the lazy dog",
    cssVar: "--font-inter",
  },
];

/* ─── Stat helpers ─────────────────────────────────────────────────────────── */

const STATS = [
  { lbl: "Logo Variants", val: "8",  bar: "var(--accent)", sub: "SVG + PNG formats" },
  { lbl: "Colors",        val: "10", bar: "var(--purple)", sub: "Brand palette" },
  { lbl: "Type Faces",    val: "4",  bar: "var(--green)",  sub: "Serif, sans, mono" },
  { lbl: "Guidelines",    val: String(PRINCIPLES.length + DOS.length + DONTS.length), bar: "var(--amber)", sub: "Dos, donts & principles" },
];

/* ─── Component ────────────────────────────────────────────────────────────── */

export function ClientBrandPage({ active }: Props) {
  const [activeTab, setActiveTab] = useState<BrandTab>("Guidelines");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex).then(
      () => showToast(`Copied ${hex}`),
      () => showToast(`Failed to copy ${hex}`)
    );
  };

  const handleDownloadLogo = (name: string) => {
    showToast(`Downloaded ${name}`);
  };

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-brand">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Work</div>
          <div className={styles.pageTitle}>Brand Assets</div>
          <p className={styles.pageSub}>
            Access brand guidelines, logos, color palettes, and typography specs for consistent usage across all deliverables.
          </p>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={cx(styles.button, styles.buttonGhost)}
            onClick={() => showToast("Full brand kit download started")}
          >
            Download Brand Kit
          </button>
        </div>
      </div>

      {/* ── Page body ───────────────────────────────────────────────── */}
      <div className={styles.pageBody}>
        {/* Stats row */}
        <div className={styles.statGrid}>
          {STATS.map((s, i) => (
            <div key={s.lbl} className={styles.statCard} style={{ "--i": i } as React.CSSProperties}>
              <div className={styles.statBar} style={{ background: s.bar }} />
              <div className={styles.statLabel}>{s.lbl}</div>
              <div className={styles.statValue}>{s.val}</div>
              <div className={styles.statDelta}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={styles.filterBar}>
          {BRAND_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={cx(styles.filterTab, activeTab === tab && styles.filterTabActive)}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── TAB: Guidelines ─────────────────────────────────────── */}
        {activeTab === "Guidelines" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Brand principles */}
            <div>
              <div className={styles.sectionTitle}>Brand Principles</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginTop: 14 }}>
                {PRINCIPLES.map((p, i) => (
                  <div key={p.id} className={styles.guidelineCard} style={{ "--i": i } as React.CSSProperties}>
                    <div className={styles.guidelineCardTitle}>{p.title}</div>
                    <div className={styles.guidelineCardText}>{p.content}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Do's */}
            <div>
              <div className={styles.sectionTitle}>Do&apos;s</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
                {DOS.map((item, i) => (
                  <div key={item.id} className={styles.guidelineDo} style={{ "--i": i } as React.CSSProperties}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
                      <span className={cx(styles.guidelineIcon, styles.guidelineIconDo)}>&#10003;</span>
                      <span className={styles.guidelineText}>{item.content}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Don'ts */}
            <div>
              <div className={styles.sectionTitle}>Don&apos;ts</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
                {DONTS.map((item, i) => (
                  <div key={item.id} className={styles.guidelineDont} style={{ "--i": i } as React.CSSProperties}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
                      <span className={cx(styles.guidelineIcon, styles.guidelineIconDont)}>&#10005;</span>
                      <span className={styles.guidelineText}>{item.content}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tone of voice */}
            <div>
              <div className={styles.sectionTitle}>Tone of Voice</div>
              <div className={styles.guidelineCard} style={{ "--i": 0, marginTop: 12 } as React.CSSProperties}>
                <div className={styles.guidelineCardTitle}>Professional, Approachable, Confident</div>
                <div className={styles.guidelineCardText}>
                  Our brand voice strikes a balance between technical competence and human warmth. We speak as trusted
                  advisors who genuinely care about our clients&apos; success. Avoid corporate fluff and empty superlatives.
                  Be direct, be helpful, be honest. When in doubt, imagine explaining something to a smart colleague over
                  coffee: clear, respectful, and never condescending.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  {["Professional", "Approachable", "Confident", "Direct", "Warm"].map((trait) => (
                    <span key={trait} className={cx(styles.badge, styles.badgeAccent)}>{trait}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Logos ───────────────────────────────────────────── */}
        {activeTab === "Logos" && (
          <div>
            <div className={styles.sectionTitle}>Logo Variants</div>
            <div className={styles.logoGrid} style={{ marginTop: 14 }}>
              {LOGO_ASSETS.map((logo, i) => (
                <div key={logo.id} className={styles.logoCard} style={{ "--i": i } as React.CSSProperties}>
                  <div
                    className={styles.logoPreview}
                    style={{ background: logo.bgColor }}
                  >
                    <span
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: "2.2rem",
                        color: logo.bgColor === "var(--raw-white)" || logo.bgColor === "var(--raw-light-1)" || logo.bgColor === "var(--raw-light-2)"
                          ? "var(--raw-dark-1)"
                          : "var(--accent)",
                      }}
                    >
                      {logo.emoji}
                    </span>
                  </div>
                  <div className={styles.logoCardBody}>
                    <div className={styles.logoCardName}>{logo.name}</div>
                    <div className={styles.logoCardFormat}>{logo.format}</div>
                    <button
                      type="button"
                      className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}
                      onClick={() => handleDownloadLogo(logo.name)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Colors ──────────────────────────────────────────── */}
        {activeTab === "Colors" && (
          <div>
            <div className={styles.sectionTitle}>Color Palette</div>
            <div className={styles.swatchGrid} style={{ marginTop: 14 }}>
              {COLOR_SWATCHES.map((swatch, i) => (
                <div key={swatch.id} className={styles.swatchCard} style={{ "--i": i } as React.CSSProperties}>
                  <div
                    className={styles.swatchColor}
                    style={{ background: swatch.hex }}
                  />
                  <div className={styles.swatchInfo}>
                    <div className={styles.swatchName}>{swatch.name}</div>
                    <div className={styles.swatchHex}>{swatch.hex}</div>
                    <div className={styles.swatchUsage}>{swatch.usage}</div>
                    <button
                      type="button"
                      className={styles.swatchCopy}
                      onClick={() => handleCopyHex(swatch.hex)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Typography ──────────────────────────────────────── */}
        {activeTab === "Typography" && (
          <div>
            <div className={styles.sectionTitle}>Type Specimens</div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
              {TYPOGRAPHY_ITEMS.map((typeItem, i) => (
                <div key={typeItem.id} className={styles.typeSample} style={{ "--i": i } as React.CSSProperties}>
                  <div className={styles.typeSampleName}>{typeItem.fontFamily.replace(/'/g, "").split(",")[0]}</div>
                  <div className={styles.typeSampleMeta}>
                    Weight: {typeItem.weight} &middot; CSS: var({typeItem.cssVar})
                  </div>
                  <div className={styles.typeSamplePreview}>
                    <div style={{ fontFamily: typeItem.fontFamily, fontSize: "2rem", lineHeight: 1.3, marginBottom: 8 }}>
                      {typeItem.sampleText}
                    </div>
                    <div style={{ fontFamily: typeItem.fontFamily, fontSize: "1rem", lineHeight: 1.5, marginBottom: 6, color: "var(--muted)" }}>
                      {typeItem.sampleText}
                    </div>
                    <div style={{ fontFamily: typeItem.fontFamily, fontSize: "0.75rem", lineHeight: 1.5, color: "var(--muted2)" }}>
                      {typeItem.sampleText}
                    </div>
                  </div>
                  <div className={styles.typeSampleUsage}>{typeItem.usage}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 70,
            right: 28,
            background: "var(--surface)",
            border: "1px solid var(--accent)",
            padding: "14px 20px",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "fadeUp 0.3s ease",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              background: "var(--accent)",
              color: "var(--on-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              flexShrink: 0,
              borderRadius: "50%",
            }}
          >
            &#10003;
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{toast}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
