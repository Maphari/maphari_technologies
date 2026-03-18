import type { ReactNode } from "react";
import { createCx } from "@/lib/utils/cx";
import styles from "@/app/style/shared/utilities.module.css";
const cx = createCx(styles);

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className={cx("tipWrap")}>
      {children}
      <span className={cx("tipBox")} role="tooltip">{label}</span>
    </span>
  );
}
