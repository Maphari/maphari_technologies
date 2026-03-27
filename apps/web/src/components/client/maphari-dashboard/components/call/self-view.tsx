"use client";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { VideoTrack, useIsMuted, useLocalParticipant, useTracks } from "@livekit/components-react";
import type { TrackReference } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Ic } from "../../ui";
import styles from "@/app/style/client/call-ui.module.css";

export function SelfView() {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const selfViewRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const isMuted = useIsMuted({
    participant: localParticipant,
    source: Track.Source.Microphone,
  });

  const localCameraTrack = tracks.find(
    t => t.participant.identity === localParticipant.identity
  );

  const initial = (localParticipant.name ?? localParticipant.identity ?? "?")[0]?.toUpperCase() ?? "?";

  const asTrackRef = localCameraTrack as TrackReference | undefined;
  const hasVideo =
    asTrackRef !== undefined &&
    asTrackRef.publication !== undefined &&
    asTrackRef.publication.track !== undefined;

  useEffect(() => {
    function applyDefaultPosition() {
      if (typeof window === "undefined") return;
      const rect = selfViewRef.current?.getBoundingClientRect();
      const width = rect?.width ?? 180;
      const height = rect?.height ?? 100;
      const margin = window.innerWidth <= 720 ? 12 : 24;
      const topOffset = window.innerWidth <= 720 ? 124 : 96;
      const workspaceRailWidth = window.innerWidth > 1100 ? 332 : 0;
      const nextX = Math.max(margin, window.innerWidth - workspaceRailWidth - width - margin);
      const nextY = topOffset;

      setPosition((current) => {
        if (!current || !hasDragged) return { x: nextX, y: nextY };
        const maxX = Math.max(margin, window.innerWidth - workspaceRailWidth - width - margin);
        const maxY = Math.max(topOffset, window.innerHeight - height - margin);
        return {
          x: Math.min(Math.max(current.x, margin), maxX),
          y: Math.min(Math.max(current.y, topOffset), maxY),
        };
      });
    }

    applyDefaultPosition();
    window.addEventListener("resize", applyDefaultPosition);
    return () => window.removeEventListener("resize", applyDefaultPosition);
  }, [hasDragged]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = selfViewRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const rect = selfViewRef.current?.getBoundingClientRect();
    if (!drag || drag.pointerId !== event.pointerId || !rect) return;

    const margin = window.innerWidth <= 720 ? 12 : 24;
    const topOffset = window.innerWidth <= 720 ? 124 : 96;
    const workspaceRailWidth = window.innerWidth > 1100 ? 332 : 0;
    const nextX = event.clientX - drag.offsetX;
    const nextY = event.clientY - drag.offsetY;
    const maxX = Math.max(margin, window.innerWidth - workspaceRailWidth - rect.width - margin);
    const maxY = Math.max(topOffset, window.innerHeight - rect.height - margin);

    setHasDragged(true);
    setPosition({
      x: Math.min(Math.max(nextX, margin), maxX),
      y: Math.min(Math.max(nextY, topOffset), maxY),
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      ref={selfViewRef}
      className={styles.callSelfView}
      style={position ? { left: position.x, top: position.y } : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {hasVideo && asTrackRef ? (
        <VideoTrack
          trackRef={asTrackRef}
          className={styles.callSelfVideo}
        />
      ) : (
        <div className={styles.callSelfAvatar}>
          {initial}
        </div>
      )}
      <div className={styles.callSelfLabel}>You</div>
      {isMuted && (
        <div className={styles.callSelfMuted} aria-label="You are muted">
          <Ic n="mic-off" sz={12} c="#f87171" />
        </div>
      )}
    </div>
  );
}
