import shared from "@/app/style/shared/maphari-dashboard-shared.module.css";
import specific from "@/app/style/staff/maphari-staff-dashboard.module.css";
import { createCx } from "@/lib/utils/cx";

// Simple spread gives `specific` priority — correct for page-level classes.
// However, for layout-anchor classes that have compound CSS selectors as
// DESCENDANTS in the shared module (e.g. `.sidebar:not(.sidebarCollapsed) .navLabel`)
// we need BOTH hashes on the element so the shared descendant rules still fire.
const styles: Record<string, string> = { ...shared, ...specific };

const DUAL: ReadonlyArray<string> = [
  "sidebar",
  "sidebarCollapsed",
  "topbar",
  "main",
];

for (const key of DUAL) {
  const sharedCls   = (shared   as Record<string, string>)[key];
  const specificCls = (specific as Record<string, string>)[key];
  if (sharedCls && specificCls && sharedCls !== specificCls) {
    styles[key] = `${specificCls} ${sharedCls}`;
  }
}

const cx = createCx(styles);

export { styles, cx };
