import shared from "@/app/style/shared/maphari-dashboard-shared.module.css";
import core from "@/app/style/admin/core.module.css";
import pagesA from "@/app/style/admin/pages-a.module.css";
import pagesB from "@/app/style/admin/pages-b.module.css";
import pagesC from "@/app/style/admin/pages-c.module.css";
import pagesClm from "@/app/style/admin/pages-clm.module.css";
import pagesAnalytics from "@/app/style/admin/pages-analytics.module.css";
import pagesMisc from "@/app/style/admin/pages-misc.module.css";
import { createCx } from "@/lib/utils/cx";

const styles = {
  ...shared,
  ...core,
  ...pagesA,
  ...pagesB,
  ...pagesC,
  ...pagesClm,
  ...pagesAnalytics,
  ...pagesMisc,
};
const cx = createCx(styles);

export { styles, cx };
