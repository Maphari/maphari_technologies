import shared from "@/app/style/shared/maphari-dashboard-shared.module.css";
import core from "@/app/style/staff/core.module.css";
import pagesA from "@/app/style/staff/pages-a.module.css";
import pagesB from "@/app/style/staff/pages-b.module.css";
import pagesC from "@/app/style/staff/pages-c.module.css";
import pagesD from "@/app/style/staff/pages-d.module.css";
import pagesE from "@/app/style/staff/pages-e.module.css";
import pagesF from "@/app/style/staff/pages-f.module.css";
import pagesG from "@/app/style/staff/pages-g.module.css";
import pagesH from "@/app/style/staff/pages-h.module.css";
import { createCx } from "@/lib/utils/cx";

// Source order: shared first, then core (wins for overrides),
// then page-specific files (win for page classes).
export const styles: Record<string, string> = {
  ...shared,
  ...core,
  ...pagesA,
  ...pagesB,
  ...pagesC,
  ...pagesD,
  ...pagesE,
  ...pagesF,
  ...pagesG,
  ...pagesH,
};

export const cx = createCx(styles);
