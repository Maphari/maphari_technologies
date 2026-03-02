"use client";

import { cx } from "../style";

const brandAssets = [
  { name: "Primary Logo (SVG)", category: "Logo", format: "SVG", size: "24KB", updatedAt: "Jan 2026" },
  { name: "Primary Logo (PNG @2x)", category: "Logo", format: "PNG", size: "142KB", updatedAt: "Jan 2026" },
  { name: "Logo Mark (Icon only)", category: "Logo", format: "SVG", size: "8KB", updatedAt: "Jan 2026" },
  { name: "Brand Colour Palette", category: "Colour", format: "PDF", size: "1.2MB", updatedAt: "Dec 2025" },
  { name: "Typography Scale", category: "Typography", format: "PDF", size: "680KB", updatedAt: "Dec 2025" },
  { name: "Icon Library (Phosphor subset)", category: "Icons", format: "ZIP", size: "4.8MB", updatedAt: "Nov 2025" },
  { name: "Social Media Templates", category: "Templates", format: "FIG", size: "12MB", updatedAt: "Feb 2026" },
  { name: "Presentation Template", category: "Templates", format: "PPTX", size: "8.4MB", updatedAt: "Jan 2026" },
  { name: "Email Signature Template", category: "Templates", format: "HTML", size: "12KB", updatedAt: "Sep 2025" },
  { name: "Brand Guidelines v3.2", category: "Guidelines", format: "PDF", size: "18MB", updatedAt: "Feb 2026" },
];

export function BrandKitPage({ isActive }: { isActive: boolean }) {
  const categories = [...new Set(brandAssets.map((a) => a.category))];

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-brand-kit">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Knowledge</div>
        <h1 className={cx("pageTitleText")}>Brand Kit</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Read-only brand asset access and guidelines</p>
      </div>

      {categories.map((cat) => (
        <div key={cat} className={cx("card", "mb16")}>
          <div className={cx("sectionLabel", "mb8")} style={{ padding: "16px 20px 0" }}>{cat}</div>
          <div className={cx("tableWrap")}>
            <table className={cx("table")}>
              <thead><tr><th>Asset</th><th>Format</th><th>Size</th><th>Updated</th><th>Action</th></tr></thead>
              <tbody>
                {brandAssets.filter((a) => a.category === cat).map((asset) => (
                  <tr key={asset.name}>
                    <td className={cx("fw600")}>{asset.name}</td>
                    <td><span className={cx("badge")}>{asset.format}</span></td>
                    <td className={cx("fontMono", "text12", "colorMuted")}>{asset.size}</td>
                    <td className={cx("text12", "colorMuted")}>{asset.updatedAt}</td>
                    <td><button type="button" className={cx("button", "buttonGhost", "buttonSmall")}>Download</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
