/**
 * Staff dashboard CSS module and cx utility.
 *
 * The cx function is created via the shared createCx factory,
 * bound to the staff-specific CSS module.
 */
import styles from "@/app/style/staff/maphari-staff-dashboard.module.css";
import { createCx } from "@/lib/utils/cx";

const cx = createCx(styles);

export { styles, cx };
