// ════════════════════════════════════════════════════════════════════════════
// video-room-modal.tsx — Reusable modal shown after an instant video room is
//                        created. Displays the join URL, optional passcode,
//                        and a "Join Now" button.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";

type VideoRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
  roomUrl: string;
  passcode?: string;
  isLoading: boolean;
};

export function VideoRoomModal({ isOpen, onClose, roomUrl, passcode, isLoading }: VideoRoomModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleCopy() {
    if (!roomUrl) return;
    void navigator.clipboard.writeText(roomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleJoin() {
    if (roomUrl) window.open(roomUrl, "_blank");
  }

  return (
    <div
      className={cx("modalOverlay")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cx("modalBox480")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-room-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cx("modalHeader")}>
          <div className={cx("flexRow", "gap8")}>
            <Ic n="video" sz={16} c="var(--lime)" />
            <span id="video-room-modal-title" className={cx("modalTitle")}>
              {isLoading ? "Starting Video Room…" : "Your Video Room is Ready"}
            </span>
          </div>
          <button
            type="button"
            className={cx("modalClose")}
            onClick={onClose}
            title="Close"
          >
            <Ic n="x" sz={15} c="var(--text)" />
          </button>
        </div>

        {/* Body */}
        <div className={cx("modalBody")}>
          {isLoading ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateTitle", "colorMuted")}>
                Creating your video room…
              </div>
            </div>
          ) : (
            <>
              {/* Room URL row */}
              <div className={cx("msguFieldGroup")}>
                <label className={cx("msguFieldLabel")}>Room Link</label>
                <div className={cx("flexRow", "gap8")}>
                  <input
                    className={cx("msguFieldInput")}
                    readOnly
                    value={roomUrl}
                    title="Room URL"
                  />
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={handleCopy}
                    title="Copy link"
                  >
                    {copied ? <Ic n="check" sz={14} c="var(--lime)" /> : <Ic n="copy" sz={14} c="var(--text)" />}
                  </button>
                </div>
              </div>

              {/* Passcode row (if present) */}
              {passcode && (
                <div className={cx("msguFieldGroup")}>
                  <label className={cx("msguFieldLabel")}>Passcode</label>
                  <input
                    className={cx("msguFieldInput")}
                    readOnly
                    value={passcode}
                    title="Passcode"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={cx("modalFooter")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={onClose}
          >
            Close
          </button>
          {!isLoading && (
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              onClick={handleJoin}
              disabled={!roomUrl}
            >
              Join Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
