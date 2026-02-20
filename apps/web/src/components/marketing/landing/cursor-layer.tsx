import styles from "../../../app/style/landing-reference.module.css";

type CursorLayerProps = {
  cursorRef: React.RefObject<HTMLDivElement | null>;
  ringRef: React.RefObject<HTMLDivElement | null>;
};

export function CursorLayer({ cursorRef, ringRef }: CursorLayerProps) {
  return (
    <>
      <div className={styles.cursor} ref={cursorRef} aria-hidden="true" />
      <div className={styles.cursorRing} ref={ringRef} aria-hidden="true" />
    </>
  );
}
