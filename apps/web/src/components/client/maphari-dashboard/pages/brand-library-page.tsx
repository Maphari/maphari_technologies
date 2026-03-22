"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { usePageToast } from "../hooks/use-page-toast";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "@/lib/auth/session";
import {
  loadPortalBrandAssetsWithRefresh,
  createPortalBrandAssetWithRefresh,
  deletePortalBrandAssetWithRefresh,
  type PortalBrandAsset,
} from "@/lib/api/portal/brand";
import {
  createPortalUploadUrlWithRefresh,
  confirmPortalUploadWithRefresh,
  getPortalFileDownloadUrlWithRefresh,
} from "@/lib/api/portal";

// ── Types & Constants ─────────────────────────────────────────────────────────

type BLTab = "All" | "Logos" | "Colors" | "Typography" | "Guidelines" | "Downloads";
const TABS: BLTab[] = ["All", "Logos", "Colors", "Typography", "Guidelines", "Downloads"];

const TAB_COLOR: Record<BLTab, string> = {
  All:        "var(--muted)",
  Logos:      "var(--lime)",
  Colors:     "var(--amber)",
  Typography: "var(--purple)",
  Guidelines: "var(--green)",
  Downloads:  "var(--accent)",
};

// ── Font format labels ────────────────────────────────────────────────────────

const FONT_FORMAT: Record<string, string> = {
  "font/ttf":              "TTF",
  "font/otf":              "OTF",
  "font/woff":             "WOFF",
  "font/woff2":            "WOFF2",
  "application/x-font-ttf":  "TTF",
  "application/x-font-otf":  "OTF",
  "application/font-woff":    "WOFF",
  "application/font-woff2":   "WOFF2",
};

const GUIDELINES_RULES = [
  { good: true,  rule: "Always use the approved colour variants",          detail: "Only use hex values from the defined primary and secondary palette." },
  { good: true,  rule: "Maintain minimum clear space around the logo",    detail: "Keep clear space of at least 1× the logo height on all four sides." },
  { good: true,  rule: "Syne & DM Mono are the exclusive typefaces",      detail: "Do not substitute with Arial, Helvetica, or any other font." },
  { good: false, rule: "Never stretch or distort the logo",               detail: "Always maintain original aspect ratio. Use SVG for best results." },
  { good: false, rule: "Never place the logo on a low-contrast background", detail: "Ensure a minimum contrast ratio of 4.5:1 for accessibility." },
  { good: false, rule: "Never use the logo at sizes below 24px height",   detail: "Use the icon mark variant for small sizes (below 32px height)." },
];

// ── Helpers ───────────────────────────────────────────────────────────────────


function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div className={cx("flexRow", "flexCenter", "gap10", "mb14")}>
      <div className={cx("bar3x16", "noShrink", "dynBgColor")} style={{ "--bg-color": color } as React.CSSProperties} />
      <span className={cx("text13", "fw600", "colorText")}>{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BrandLibraryPage() {
  const { session } = useProjectLayer();
  const toast = usePageToast();

  const [activeTab, setActiveTab] = useState<BLTab>("All");
  const [assets, setAssets] = useState<PortalBrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Color modal
  const [showColorModal, setShowColorModal] = useState(false);
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#C8F135");
  const [colorVariant, setColorVariant] = useState("PRIMARY");
  const [savingColor, setSavingColor] = useState(false);

  // Font modal
  const [showFontModal, setShowFontModal] = useState(false);
  const [fontName, setFontName] = useState("");
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [savingFont, setSavingFont] = useState(false);
  const fontModalInputRef = useRef<HTMLInputElement>(null);

  // Hex copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const guidelineInputRef = useRef<HTMLInputElement>(null);

  // ── Load brand assets ─────────────────────────────────────────────────────
  const loadAssets = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const r = await loadPortalBrandAssetsWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      setAssets(r.data ?? []);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load brand assets");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => { void loadAssets(); }, [loadAssets]);

  // ── Derived slices ────────────────────────────────────────────────────────
  const logos      = assets.filter((a) => a.type === "LOGO");
  const colors     = assets.filter((a) => a.type === "COLOR");
  const fonts      = assets.filter((a) => a.type === "FONT");
  const guidelines = assets.filter((a) => a.type === "GUIDELINE");
  const totalSize  = assets.reduce((s, a) => s + (a.sizeBytes ?? 0), 0);

  // ── Upload file via presigned URL ─────────────────────────────────────────
  async function handleFileUpload(file: File, type: "LOGO" | "FONT" | "GUIDELINE") {
    if (!session) return;
    setUploading(true);
    try {
      const urlRes = await createPortalUploadUrlWithRefresh(session, {
        fileName:  file.name,
        mimeType:  file.type,
        sizeBytes: file.size,
        category:  type.toLowerCase(),
      });
      if (urlRes.nextSession) saveSession(urlRes.nextSession);
      if (!urlRes.data) { toast("error", "Upload failed — could not get upload URL."); return; }

      const { uploadUrl, fileId, key } = urlRes.data;
      const putRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!putRes.ok) { toast("error", "Upload failed — storage error."); return; }

      const confirmRes = await confirmPortalUploadWithRefresh(session, fileId);
      if (confirmRes.nextSession) saveSession(confirmRes.nextSession);

      const name = file.name.replace(/\.[^.]+$/, "");
      const createRes = await createPortalBrandAssetWithRefresh(session, {
        type, name, fileId, storageKey: key, mimeType: file.type, sizeBytes: file.size,
      });
      if (createRes.nextSession) saveSession(createRes.nextSession);
      if (createRes.data) {
        setAssets((prev) => [createRes.data!, ...prev]);
        toast("success", `${type === "LOGO" ? "Logo" : type === "FONT" ? "Font" : "Guideline"} uploaded.`);
      }
    } catch {
      toast("error", "Upload error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  // ── Delete asset ──────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!session) return;
    const r = await deletePortalBrandAssetWithRefresh(session, id);
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      toast("success", "Asset deleted.");
    } else {
      toast("error", "Could not delete asset.");
    }
  }

  // ── Add color ─────────────────────────────────────────────────────────────
  async function handleAddColor() {
    if (!session || !colorName.trim()) return;
    setSavingColor(true);
    const r = await createPortalBrandAssetWithRefresh(session, {
      type: "COLOR", name: colorName.trim(), value: colorHex, variant: colorVariant,
    });
    if (r.nextSession) saveSession(r.nextSession);
    setSavingColor(false);
    if (r.data) {
      setAssets((prev) => [...prev, r.data!]);
      setShowColorModal(false);
      setColorName("");
      setColorHex("#C8F135");
      toast("success", "Colour added.");
    } else {
      toast("error", "Could not add colour.");
    }
  }

  // ── Add font (modal flow) ─────────────────────────────────────────────────
  async function handleAddFont() {
    if (!session || !fontName.trim() || !fontFile) return;
    setSavingFont(true);
    try {
      const urlRes = await createPortalUploadUrlWithRefresh(session, {
        fileName:  fontFile.name,
        mimeType:  fontFile.type || "font/ttf",
        sizeBytes: fontFile.size,
        category:  "font",
      });
      if (urlRes.nextSession) saveSession(urlRes.nextSession);
      if (!urlRes.data) { toast("error", "Upload failed — could not get upload URL."); return; }

      const putRes = await fetch(urlRes.data.uploadUrl, { method: "PUT", body: fontFile, headers: { "Content-Type": fontFile.type || "font/ttf" } });
      if (!putRes.ok) { toast("error", "Upload failed — storage error."); return; }

      const confirmRes = await confirmPortalUploadWithRefresh(session, urlRes.data.fileId);
      if (confirmRes.nextSession) saveSession(confirmRes.nextSession);

      const createRes = await createPortalBrandAssetWithRefresh(session, {
        type: "FONT", name: fontName.trim(),
        fileId: urlRes.data.fileId, storageKey: urlRes.data.key,
        mimeType: fontFile.type, sizeBytes: fontFile.size,
      });
      if (createRes.nextSession) saveSession(createRes.nextSession);
      if (createRes.data) {
        setAssets((prev) => [...prev, createRes.data!]);
        setShowFontModal(false);
        setFontName("");
        setFontFile(null);
        toast("success", "Font added.");
      } else {
        toast("error", "Could not save font.");
      }
    } catch {
      toast("error", "Upload error. Please try again.");
    } finally {
      setSavingFont(false);
    }
  }

  // ── Download asset ────────────────────────────────────────────────────────
  async function handleDownload(asset: PortalBrandAsset) {
    if (!session || !asset.fileId) return;
    const r = await getPortalFileDownloadUrlWithRefresh(session, asset.fileId);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data?.downloadUrl) {
      window.open(r.data.downloadUrl, "_blank", "noopener,noreferrer");
    } else {
      toast("error", "Could not get download link.");
    }
  }

  // ── Copy hex ──────────────────────────────────────────────────────────────
  function copyHex(id: string, hex: string) {
    void navigator.clipboard.writeText(hex);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const showLogos      = activeTab === "All" || activeTab === "Logos";
  const showColors     = activeTab === "All" || activeTab === "Colors";
  const showTypography = activeTab === "All" || activeTab === "Typography";
  const showGuidelines = activeTab === "All" || activeTab === "Guidelines";
  const showDownloads  = activeTab === "Downloads";

  return (
    <div className={cx("blRoot")}>
      {/* Header */}
      <div className={cx("blHeader")}>
        <div>
          <div className={cx("pageTitle")}>Brand Library</div>
          <div className={cx("pageSub")}>Manage logos, colours, typography, and brand guidelines</div>
        </div>
        <div className={cx("flexRow", "gap8", "flexWrap")}>
          {showLogos && (
            <>
              <input ref={logoInputRef} type="file" accept="image/*,.svg" title="Upload logo file" className={cx("dNone")}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f, "LOGO"); e.target.value = ""; }} />
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => logoInputRef.current?.click()} disabled={uploading}>
                <Ic n="upload" sz={13} /> Upload Logo
              </button>
            </>
          )}
          {showColors && (
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowColorModal(true)}>
              <Ic n="plus" sz={13} /> Add Colour
            </button>
          )}
          {showTypography && (
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowFontModal(true)}>
              <Ic n="plus" sz={13} /> Add Font
            </button>
          )}
          {showGuidelines && (
            <>
              <input ref={guidelineInputRef} type="file" accept=".pdf,image/*" title="Upload guideline file" className={cx("dNone")}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f, "GUIDELINE"); e.target.value = ""; }} />
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => guidelineInputRef.current?.click()} disabled={uploading}>
                <Ic n="upload" sz={13} /> Upload Guideline
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={cx("flexRow", "gap12", "mb4")}>
        {[
          { label: "Total Assets",  value: String(assets.length),                                ic: "layers" },
          { label: "Logos",         value: String(logos.length),                                 ic: "image"  },
          { label: "Colours",       value: String(colors.length),                                ic: "layers" },
          { label: "Storage Used",  value: totalSize > 0 ? formatBytes(totalSize) : "—",         ic: "file"   },
        ].map(({ label, value, ic }) => (
          <div key={label} className={cx("statCard", "statCardAccent", "flex1", "minW0")}>
            <div className={cx("flexRow", "flexCenter", "gap8", "mb6")}>
              <Ic n={ic} sz={14} c="var(--lime)" />
              <span className={cx("text11", "colorMuted")}>{label}</span>
            </div>
            <div className={cx("fontMono", "blStatValue")}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tab strip */}
      <div className={cx("pillTabs", "mt16", "mb20")}>
        {TABS.map((tab) => (
          <button key={tab} type="button"
            className={cx("pillTab", activeTab === tab ? "pillTabActive" : "")}
            onClick={() => setActiveTab(tab)}
          >{tab}</button>
        ))}
      </div>

      {uploading && (
        <div className={cx("blUploadingBanner")}>
          <Ic n="loader" sz={14} c="var(--lime)" /> Uploading asset…
        </div>
      )}

      {loading ? (
        <div className={cx("skeletonBlock", "h200")} />
      ) : error ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      ) : (
        <div className={cx("flexCol", "gap28")}>

          {/* Logos */}
          {showLogos && (
            <section>
              <SectionHeader label="Logos" color={TAB_COLOR.Logos} />
              {logos.length === 0 ? (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="image" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>No logos uploaded</div>
                  <div className={cx("emptyStateSub")}>Upload your logo files (SVG, PNG, WebP) using the button above.</div>
                </div>
              ) : (
                <div className={cx("cardGrid3")}>
                  {logos.map((asset) => (
                    <div key={asset.id} className={cx("card", "p16")}>
                      <div className={cx("blLogoPreview")}>
                        <Ic n="image" sz={28} c="var(--muted2)" />
                      </div>
                      <div className={cx("text13", "fw600", "mb2")}>{asset.name}</div>
                      <div className={cx("text11", "colorFg2", "mb10")}>
                        {asset.mimeType ?? "Image"}{asset.sizeBytes ? ` · ${formatBytes(asset.sizeBytes)}` : ""}
                      </div>
                      <div className={cx("flexRow", "gap6")}>
                        {asset.fileId && (
                          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void handleDownload(asset)}>
                            <Ic n="download" sz={11} /> Download
                          </button>
                        )}
                        <button type="button" className={cx("btnSm", "btnGhost")} title="Delete" onClick={() => void handleDelete(asset.id)}>
                          <Ic n="trash" sz={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Colors */}
          {showColors && (
            <section>
              <SectionHeader label="Colours" color={TAB_COLOR.Colors} />
              {colors.length === 0 ? (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="layers" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>No colours added yet</div>
                  <div className={cx("emptyStateSub")}>Use the "Add Colour" button above to add your brand colours.</div>
                </div>
              ) : (
              <div className={cx("blColorsGrid")}>
                {colors.map((asset) => {
                  const hex = asset.value ?? "#888";
                  const copied = copiedId === asset.id;
                  return (
                    <div key={asset.id} className={cx("card", "p0", "overflowHidden", "cursorPointer")}
                      onClick={() => copyHex(asset.id, hex)} title="Click to copy">
                      <div className={cx("blColorSwatch", "dynBgColor")} style={{ "--bg-color": hex } as React.CSSProperties}>
                        {copied && (
                          <div className={cx("absInsetOverlay")}>
                            Copied!
                          </div>
                        )}
                      </div>
                      <div className={cx("py8_px", "px10_px")}>
                        <div className={cx("text11", "fw600")}>{asset.name}</div>
                        <div className={cx("text10", "fontMono", "colorFg2")}>{hex}</div>
                        {asset.variant && <div className={cx("text10", "colorFg2")}>{asset.variant}</div>}
                      </div>
                      <button type="button" className={cx("btnSm", "btnGhost", "blColorDeleteBtn")} title="Delete"
                        onClick={(e) => { e.stopPropagation(); void handleDelete(asset.id); }}>
                        <Ic n="trash" sz={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
              )}
            </section>
          )}

          {/* Typography */}
          {showTypography && (
            <section>
              <SectionHeader label="Typography" color={TAB_COLOR.Typography} />
              {fonts.length === 0 ? (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>No fonts added yet</div>
                  <div className={cx("emptyStateSub")}>Use "Add Font" above to upload your brand typefaces (.ttf, .otf, .woff, .woff2).</div>
                </div>
              ) : (
                <div className={cx("flexCol", "gap10")}>
                  {fonts.map((asset) => {
                    const fmt = FONT_FORMAT[asset.mimeType ?? ""] ?? asset.mimeType?.split("/").pop()?.toUpperCase() ?? "FONT";
                    return (
                      <div key={asset.id} className={cx("card", "p16")}>
                        <div className={cx("fontCardRow")}>
                          <div className={cx("fontCardMeta")}>
                            <div className={cx("fontCardIcon")}>
                              <Ic n="file" sz={16} c="var(--purple)" />
                            </div>
                            <div>
                              <div className={cx("text13", "fontCardName")}>{asset.name}</div>
                              <div className={cx("text10", "fontMono", "fontCardInfo")}>
                                {fmt}{asset.sizeBytes ? ` · ${formatBytes(asset.sizeBytes)}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className={cx("fontCardActions")}>
                            {asset.fileId && (
                              <button type="button" className={cx("btnSm", "btnGhost")} title="Download" onClick={() => void handleDownload(asset)}>
                                <Ic n="download" sz={11} /> Download
                              </button>
                            )}
                            <button type="button" className={cx("btnSm", "btnGhost")} title="Delete" onClick={() => void handleDelete(asset.id)}>
                              <Ic n="trash" sz={11} />
                            </button>
                          </div>
                        </div>
                        <div className={cx("fontCardPreview")}>
                          {asset.name} — Aa Bb Cc 0123
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Guidelines */}
          {showGuidelines && (
            <section>
              <SectionHeader label="Brand Guidelines" color={TAB_COLOR.Guidelines} />
              {guidelines.length > 0 ? (
                <div className={cx("cardGrid3", "mb16")}>
                  {guidelines.map((asset) => (
                    <div key={asset.id} className={cx("card", "p14")}>
                      <div className={cx("flexRow", "flexCenter", "gap8", "mb6")}>
                        <Ic n="file" sz={16} c="var(--green)" />
                        <span className={cx("text12", "fw600")}>{asset.name}</span>
                      </div>
                      <div className={cx("text10", "colorFg2")}>
                        {asset.mimeType ?? "Document"}{asset.sizeBytes ? ` · ${formatBytes(asset.sizeBytes)}` : ""}
                      </div>
                      <div className={cx("flexRow", "gap6", "mt10")}>
                        {asset.fileId && (
                          <button type="button" className={cx("btnSm", "btnGhost")} title="Download" onClick={() => void handleDownload(asset)}>
                            <Ic n="download" sz={11} />
                          </button>
                        )}
                        <button type="button" className={cx("btnSm", "btnGhost")} title="Delete" onClick={() => void handleDelete(asset.id)}>
                          <Ic n="trash" sz={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cx("emptyState", "mb16")}>
                  <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>No guidelines uploaded</div>
                  <div className={cx("emptyStateSub")}>Upload PDF or image guideline documents using the button above.</div>
                </div>
              )}
              <div className={cx("text11", "fw600", "mb10", "colorText")}>Usage Rules</div>
              <div className={cx("flexCol", "gap8")}>
                {GUIDELINES_RULES.map((g, i) => (
                  <div key={i} className={cx("card", "p14", "flexAlignStart", "gap12")}>
                    <div className={cx("statusDot20", "dynBgColor")} style={{ "--bg-color": g.good ? "var(--green)" : "var(--red)" } as React.CSSProperties}>
                      <Ic n={g.good ? "check" : "x"} sz={11} c="#fff" />
                    </div>
                    <div>
                      <div className={cx("text12", "fw600", "mb2")}>{g.rule}</div>
                      <div className={cx("text11", "colorFg2")}>{g.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Downloads */}
          {showDownloads && (
            <section>
              <SectionHeader label="Downloads" color={TAB_COLOR.Downloads} />
              {assets.filter((a) => a.fileId).length === 0 ? (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="download" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>No downloadable assets</div>
                  <div className={cx("emptyStateSub")}>Upload logos, fonts, or guidelines to see them here.</div>
                </div>
              ) : (
                <div className={cx("flexCol", "gap10")}>
                  {assets.filter((a) => a.fileId).map((asset) => (
                    <div key={asset.id} className={cx("card", "p14", "flexRow", "gap14")}>
                      <div className={cx("iconSquare36")}>
                        <Ic n={asset.type === "LOGO" ? "image" : "file"} sz={16} c="var(--lime)" />
                      </div>
                      <div className={cx("flex1", "minW0")}>
                        <div className={cx("text13", "fw600")}>{asset.name}</div>
                        <div className={cx("text11", "colorFg2")}>
                          {asset.type} · {asset.mimeType ?? "file"}{asset.sizeBytes ? ` · ${formatBytes(asset.sizeBytes)}` : ""}
                        </div>
                      </div>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void handleDownload(asset)}>
                        <Ic n="download" sz={13} /> Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* All tab — no assets at all */}
          {activeTab === "All" && assets.length === 0 && !loading && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="layers" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No brand assets yet</div>
              <div className={cx("emptyStateSub")}>Upload logos, add colours, or upload font files to build your brand library.</div>
            </div>
          )}

        </div>
      )}

      {/* Add Color Modal */}
      {showColorModal && (
        <div className={cx("modalBackdrop")}
          onClick={(e) => { if (e.target === e.currentTarget) setShowColorModal(false); }}>
          <div className={cx("modal", "maxW360")}>
            <div className={cx("modalHeader")}>
              <div className={cx("modalTitle")}>Add Brand Colour</div>
              <button type="button" className={cx("modalClose")} title="Close" onClick={() => setShowColorModal(false)}>
                <Ic n="x" sz={16} />
              </button>
            </div>
            <div className={cx("modalBody")}>
              <div className={cx("mb12")}>
                <label className={cx("formLabel")}>Colour name</label>
                <input type="text" className={cx("inputSm", "wFull")} placeholder="e.g. Brand Teal"
                  value={colorName} onChange={(e) => setColorName(e.target.value)} />
              </div>
              <div className={cx("mb12")}>
                <label className={cx("formLabel")}>Hex value</label>
                <div className={cx("flexRow", "flexCenter", "gap8")}>
                  <input type="color" title="Pick colour" value={colorHex} onChange={(e) => setColorHex(e.target.value)}
                    className={cx("iconBtn40x34")} />
                  <input type="text" title="Hex colour value" className={cx("inputSm", "fontMono", "flex1")} value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)} />
                </div>
              </div>
              <div className={cx("mb20")}>
                <label className={cx("formLabel")}>Variant</label>
                <select title="Colour variant" className={cx("inputSm", "wFull")} value={colorVariant}
                  onChange={(e) => setColorVariant(e.target.value)}>
                  {["PRIMARY", "SECONDARY", "DARK", "LIGHT"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className={cx("flexRow", "gap8", "justifyEnd")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowColorModal(false)}>Cancel</button>
                <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void handleAddColor()}
                  disabled={savingColor || !colorName.trim()}>
                  {savingColor ? "Saving…" : "Add Colour"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Font Modal */}
      {showFontModal && (
        <div className={cx("modalBackdrop")}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFontModal(false); }}>
          <div className={cx("modal", "maxW400")}>
            <div className={cx("modalHeader")}>
              <div className={cx("modalTitle")}>Add Brand Font</div>
              <button type="button" className={cx("modalClose")} title="Close" onClick={() => setShowFontModal(false)}>
                <Ic n="x" sz={16} />
              </button>
            </div>
            <div className={cx("modalBody")}>
              <div>
                <label className={cx("formLabel")}>Font name</label>
                <input type="text" className={cx("inputSm", "wFull")} placeholder="e.g. Gilroy Bold"
                  value={fontName} onChange={(e) => setFontName(e.target.value)} />
              </div>
              <div>
                <label className={cx("formLabel")}>Font file (.ttf, .otf, .woff, .woff2)</label>
                <input ref={fontModalInputRef} type="file" accept=".ttf,.otf,.woff,.woff2"
                  title="Select font file" className={cx("srOnly")}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFontFile(f); if (!fontName.trim()) setFontName(f.name.replace(/\.[^.]+$/, "")); } }} />
                <button type="button"
                  className={cx("fontDropZone", fontFile ? "fontDropZoneSelected" : "")}
                  onClick={() => fontModalInputRef.current?.click()}>
                  <Ic n="upload" sz={18} c={fontFile ? "var(--lime)" : "var(--muted2)"} />
                  <span className={cx("text12", fontFile ? "fontDropZoneLabelSelected" : "fontDropZoneLabel")}>
                    {fontFile ? fontFile.name : "Click to select a font file"}
                  </span>
                  {fontFile && (
                    <span className={cx("text10", "fontMono", "fontDropZoneSize")}>
                      {formatBytes(fontFile.size)}
                    </span>
                  )}
                </button>
              </div>
              <div className={cx("modalFooter")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => { setShowFontModal(false); setFontName(""); setFontFile(null); }}>Cancel</button>
                <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void handleAddFont()}
                  disabled={savingFont || !fontName.trim() || !fontFile}>
                  {savingFont ? "Uploading…" : "Add Font"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
