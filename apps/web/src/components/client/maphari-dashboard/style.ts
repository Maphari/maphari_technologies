import shared from "@/app/style/shared/maphari-dashboard-shared.module.css";
import specific from "@/app/style/client/maphari-client-dashboard.module.css";
import { createCx } from "@/lib/utils/cx";

const styles = { ...shared, ...specific };
const cx = createCx(styles);

export { styles, cx };
