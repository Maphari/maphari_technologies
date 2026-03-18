"use client";
import { useRef, useEffect, useState, useCallback } from "react";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  height?: number;
  className?: string;
}

export function SignaturePad({ onSave, onClear, height = 160, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokesRef = useRef<ImageData[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);

  // Setup canvas context with device pixel ratio for crisp retina rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.offsetWidth;
    const cssHeight = canvas.offsetHeight;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.scale(dpr, dpr);
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--s1").trim() || "#ffffff";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#0d0d0f";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as MouseEvent).clientX - rect.left,
      y: (e as MouseEvent).clientY - rect.top,
    };
  };

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    setIsEmpty(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    strokesRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.beginPath();
    const pos = getPos(e, canvas);
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, []);

  const endDraw = useCallback(() => {
    drawing.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", endDraw);
    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", endDraw);
      canvas.removeEventListener("mouseleave", endDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", endDraw);
    };
  }, [startDraw, draw, endDraw]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = [];
    setIsEmpty(true);
    onClear?.();
  };

  const handleUndo = () => {
    const last = strokesRef.current.pop();
    if (last && canvasRef.current) {
      const c = canvasRef.current.getContext("2d");
      c?.putImageData(last, 0, 0);
    }
    if (strokesRef.current.length === 0) setIsEmpty(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height,
          border: "1px solid var(--b2)",
          borderRadius: "var(--r-sm)",
          cursor: "crosshair",
          touchAction: "none",
          background: "var(--s1, #fff)",
          display: "block",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={handleUndo}
          disabled={isEmpty}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--b2)",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: isEmpty ? "not-allowed" : "pointer",
            fontSize: "0.78rem",
            opacity: isEmpty ? 0.5 : 1,
          }}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--b2)",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.78rem",
          }}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isEmpty}
          style={{
            padding: "6px 16px",
            borderRadius: "var(--r-sm)",
            border: "none",
            background: isEmpty ? "var(--s3)" : "var(--accent, #c8f135)",
            color: isEmpty ? "var(--text-muted)" : "#000",
            cursor: isEmpty ? "not-allowed" : "pointer",
            fontSize: "0.78rem",
            fontWeight: 600,
          }}
        >
          Apply Signature
        </button>
      </div>
    </div>
  );
}
