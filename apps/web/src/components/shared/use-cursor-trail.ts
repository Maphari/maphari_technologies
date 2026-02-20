import { RefObject, useEffect } from "react";

type CursorTrailOptions = {
  cursorOffset: number;
  ringOffset: number;
  easing: number;
};

export function useCursorTrail(
  cursorRef: RefObject<HTMLDivElement | null>,
  ringRef: RefObject<HTMLDivElement | null>,
  options: CursorTrailOptions
) {
  useEffect(() => {
    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    let frameId: number;

    const moveCursor = (event: MouseEvent) => {
      mx = event.clientX;
      my = event.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mx - options.cursorOffset}px, ${my - options.cursorOffset}px)`;
      }
    };

    const animateRing = () => {
      rx += (mx - rx) * options.easing;
      ry += (my - ry) * options.easing;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rx - options.ringOffset}px, ${ry - options.ringOffset}px)`;
      }
      frameId = requestAnimationFrame(animateRing);
    };

    document.addEventListener("mousemove", moveCursor);
    animateRing();

    return () => {
      document.removeEventListener("mousemove", moveCursor);
      cancelAnimationFrame(frameId);
    };
  }, [cursorRef, ringRef, options.cursorOffset, options.easing, options.ringOffset]);
}
