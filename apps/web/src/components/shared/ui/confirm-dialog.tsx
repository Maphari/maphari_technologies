"use client";
import { useEffect, useRef } from "react";
import { createCx } from "@/lib/utils/cx";
import styles from "@/app/style/shared/utilities.module.css";
const cx = createCx(styles);

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelRef.current(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;
  return (
    <div className={cx("confirmOverlay")} onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className={cx("confirmBox")} onClick={e => e.stopPropagation()}>
        <div className={cx("confirmTitle")} id="confirm-title">{title}</div>
        {body && <div className={cx("confirmBody")}>{body}</div>}
        <div className={cx("confirmActions")}>
          <button autoFocus onClick={onCancel} className={cx("confirmCancelBtn")}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={cx("confirmConfirmBtn", danger ? "confirmConfirmBtnDanger" : "")}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
