/**
 * Client dashboard CSS module and cx utility.
 *
 * The cx function is created via the shared createCx factory,
 * bound to the client-specific CSS module.
 */
import styles from "../../../app/style/client/maphari-client-dashboard.module.css";
import { createCx } from "@/lib/utils/cx";

const cx = createCx(styles);

export { styles, cx };
