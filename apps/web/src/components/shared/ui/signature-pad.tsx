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
    ctx.strokeStyle = "#0d0d0f";
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
    const pos = getPos(e, canvas);
    ctx.beginPath();
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
    setIsEmpty(true);
    onClear?.();
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
          background: "#fff",
          display: "block",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
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
