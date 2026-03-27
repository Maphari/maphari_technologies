"use client";
import { useTracks, useLocalParticipant } from "@livekit/components-react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { Track } from "livekit-client";
import { ParticipantTile } from "./participant-tile";
import styles from "@/app/style/client/call-ui.module.css";

export function ParticipantGrid() {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: false }
  ) as TrackReferenceOrPlaceholder[];

  const remoteTracks = tracks.filter(
    t => t.participant.identity !== localParticipant.identity
  );

  const screenShareTrack = remoteTracks.find(
    t => t.source === Track.Source.ScreenShare
  );

  const cameraTracks = remoteTracks.filter(
    t => t.source === Track.Source.Camera
  );

  const count = remoteTracks.length;
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;

  if (screenShareTrack) {
    return (
      <div
        className={styles.callGridInner}
        style={{ "--cols": "1" } as React.CSSProperties}
      >
        <ParticipantTile
          key={`screen-${screenShareTrack.participant.identity}`}
          trackRef={screenShareTrack}
        />
        {cameraTracks.map(t => (
          <ParticipantTile
            key={t.participant.identity}
            trackRef={t}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={styles.callGridInner}
      style={{ "--cols": String(cols) } as React.CSSProperties}
    >
      {remoteTracks.map(t => (
        <ParticipantTile
          key={t.participant.identity}
          trackRef={t}
        />
      ))}
      {remoteTracks.length === 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "rgba(232,229,224,0.3)",
            fontSize: "0.85rem",
            gridColumn: "1 / -1",
          }}
        >
          Waiting for others to join...
        </div>
      )}
    </div>
  );
}
