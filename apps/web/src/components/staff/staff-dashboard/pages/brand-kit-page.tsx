// ════════════════════════════════════════════════════════════════════════════
// brand-kit-page.tsx — Staff Brand Kit (read-only asset access)
// Data : loadPortalBrandAssetsWithRefresh → GET /brand-assets
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadPortalBrandAssetsWithRefresh, type PortalBrandAsset } from "../../../../lib/api/portal/brand";

// ── Props ─────────────────────────────────────────────────────────────────────

type BrandKitPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Page component ────────────────────────────────────────────────────────────

export function BrandKitPage({ isActive, session }: BrandKitPageProps) {
  const [assets,  setAssets]  = useState<PortalBrandAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    async function load() {
      const r = await loadPortalBrandAssetsWithRefresh(session!);
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      setAssets(r.data ?? []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const totalAssets = assets.length;
  const categories  = [...new Set(assets.map((a) => a.type))];
  const totalCats   = categories.length;
  const latestUpdated = assets.length > 0
    ? [...assets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0].updatedAt
    : null;
  const totalBytes = assets.reduce((s, a) => s + (a.sizeBytes ?? 0), 0);
  const totalSize  = totalBytes > 0 ? `${Math.round(totalBytes / 1024)}KB` : "0KB";
  const latestLabel = latestUpdated
    ? new Date(latestUpdated).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
    : "--";

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-brand-kit">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Knowledge</div>
        <h1 className={cx("pageTitleText")}>Brand Kit</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Read-only brand asset access and guidelines</p>
      </div>

      {/* ── Summary stats ───────────────────────────────────────────────── */}
      <div className={cx("bkStatGrid")}>
        <div className={cx("bkStatCard")}>
          <div className={cx("bkStatCardTop")}>
            <div className={cx("bkStatLabel")}>Total Assets</div>
            <div className={cx("bkStatValue", loading ? "colorMuted2" : undefined)}>{loading ? "—" : totalAssets}</div>
          </div>
          <div className={cx("bkStatCardDivider")} />
          <div className={cx("bkStatCardBottom")}>
            <span className={cx("bkStatDot")} />
            <span className={cx("bkStatMeta")}>{totalAssets === 0 ? "no assets uploaded yet" : `${totalAssets} file${totalAssets !== 1 ? "s" : ""}`}</span>
          </div>
        </div>
        <div className={cx("bkStatCard")}>
          <div className={cx("bkStatCardTop")}>
            <div className={cx("bkStatLabel")}>Categories</div>
            <div className={cx("bkStatValue", loading ? "colorMuted2" : undefined)}>{loading ? "—" : totalCats}</div>
          </div>
          <div className={cx("bkStatCardDivider")} />
          <div className={cx("bkStatCardBottom")}>
            <span className={cx("bkStatDot")} />
            <span className={cx("bkStatMeta")}>{totalCats === 0 ? "no asset groups" : categories.join(", ")}</span>
          </div>
        </div>
        <div className={cx("bkStatCard")}>
          <div className={cx("bkStatCardTop")}>
            <div className={cx("bkStatLabel")}>Latest Update</div>
            <div className={cx("bkStatValue", loading ? "colorMuted2" : undefined)}>{loading ? "—" : latestLabel}</div>
          </div>
          <div className={cx("bkStatCardDivider")} />
          <div className={cx("bkStatCardBottom")}>
            <span className={cx("bkStatDot")} />
            <span className={cx("bkStatMeta")}>{latestUpdated ? "last asset change" : "awaiting first upload"}</span>
          </div>
        </div>
        <div className={cx("bkStatCard")}>
          <div className={cx("bkStatCardTop")}>
            <div className={cx("bkStatLabel")}>Total Size</div>
            <div className={cx("bkStatValue", loading ? "colorMuted2" : undefined)}>{loading ? "—" : totalSize}</div>
          </div>
          <div className={cx("bkStatCardDivider")} />
          <div className={cx("bkStatCardBottom")}>
            <span className={cx("bkStatDot")} />
            <span className={cx("bkStatMeta")}>{totalBytes === 0 ? "no storage used" : "across all assets"}</span>
          </div>
        </div>
      </div>

      {/* ── Asset list or empty state ────────────────────────────────────── */}
      {!loading && assets.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="palette" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No brand assets</div>
          <div className={cx("emptyStateSub")}>Brand assets will appear here once they are uploaded by an admin.</div>
        </div>
      ) : !loading ? (
        <div className={cx("bkAssetList")}>
          {assets.map((a) => (
            <div key={a.id} className={cx("bkAssetRow")}>
              <div className={cx("bkAssetIcon")}><Ic n="file" sz={16} c="var(--muted2)" /></div>
              <div className={cx("bkAssetInfo")}>
                <div className={cx("bkAssetName")}>{a.name}</div>
                <div className={cx("bkAssetMeta")}>{a.type}{a.variant ? ` · ${a.variant}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
