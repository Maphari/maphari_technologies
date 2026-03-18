import shared from "@/app/style/shared/maphari-dashboard-shared.module.css";
import core from "@/app/style/client/core.module.css";
import pagesA from "@/app/style/client/pages-a.module.css";
import pagesB from "@/app/style/client/pages-b.module.css";
import pagesC from "@/app/style/client/pages-c.module.css";
import pagesD from "@/app/style/client/pages-d.module.css";
import pagesHome from "@/app/style/client/pages-home.module.css";
import pagesMisc from "@/app/style/client/pages-misc.module.css";
import { createCx } from "@/lib/utils/cx";

const styles = {
  ...core,
  ...pagesA,
  ...pagesB,
  ...pagesC,
  ...pagesD,
  ...pagesHome,
  ...pagesMisc,
  ...shared, // must be last — shared base styles always win over per-file overrides
};
const cx = createCx(styles);

export { styles, cx };
