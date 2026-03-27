"use client";
import { VideoTrack, useParticipantInfo, useIsMuted } from "@livekit/components-react";
import type { TrackReferenceOrPlaceholder, TrackReference } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Ic } from "../../ui";
import styles from "@/app/style/client/call-ui.module.css";

interface ParticipantTileProps {
  trackRef: TrackReferenceOrPlaceholder;
}

function isTrackRef(t: TrackReferenceOrPlaceholder): t is TrackReference {
  return t.publication !== undefined && t.publication.track !== undefined;
}

export function ParticipantTile({ trackRef }: ParticipantTileProps) {
  const { name, identity } = useParticipantInfo({ participant: trackRef.participant });
  const micTrackRef: TrackReferenceOrPlaceholder = {
    participant: trackRef.participant,
    source: Track.Source.Microphone,
  };
  const isMuted = useIsMuted(micTrackRef);

  const isAgent = identity?.startsWith("agent-") ?? false;
  const displayName = isAgent ? "Maphari AI" : (name ?? identity ?? "?");
  const initial = isAgent ? "AI" : (displayName[0]?.toUpperCase() ?? "?");

  return (
    <div className={styles.callTile}>
      {isTrackRef(trackRef) ? (
        <VideoTrack trackRef={trackRef} className={styles.callTileVideo} />
      ) : (
        <div className={styles.callTileAvatar}>{initial}</div>
      )}

      <div className={styles.callTileName}>{displayName}</div>

      {isMuted && (
        <div className={styles.callTileMuted}>
          <Ic n="mic-off" sz={12} c="#f87171" />
        </div>
      )}
    </div>
  );
}
