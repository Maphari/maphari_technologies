import { createCx } from "@/lib/utils/cx";
import styles from "@/app/style/shared/utilities.module.css";
const cx = createCx(styles);

export function SkeletonLine({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return <div className={cx("skelLine")} style={{ width, height, marginBottom: 8 }} />;
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className={cx("skelCard")}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? "40%" : i % 2 === 0 ? "70%" : "55%"} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={cx("skelRow")}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={c === 0 ? "160px" : "80px"} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}
