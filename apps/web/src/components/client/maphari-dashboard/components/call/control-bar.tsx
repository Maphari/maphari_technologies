"use client";
import { useTrackToggle, useParticipants, useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Ic } from "../../ui";
import styles from "@/app/style/client/call-ui.module.css";

interface ControlBarProps {
  onEndCall: () => void;
  chatOpen: boolean;
  onChatToggle: () => void;
  transcriptOpen: boolean;
  onTranscriptToggle: () => void;
  notesOpen: boolean;
  onNotesToggle: () => void;
  participantsOpen: boolean;
  onParticipantsToggle: () => void;
}

export function ControlBar({
  onEndCall,
  chatOpen,
  onChatToggle,
  transcriptOpen,
  onTranscriptToggle,
  notesOpen,
  onNotesToggle,
  participantsOpen,
  onParticipantsToggle,
}: ControlBarProps) {
  const { toggle: toggleMic, enabled: micEnabled } = useTrackToggle({ source: Track.Source.Microphone });
  const { toggle: toggleCam, enabled: camEnabled } = useTrackToggle({ source: Track.Source.Camera });
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const participants = useParticipants();

  function handleScreenShare() {
    void localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
  }

  return (
    <div className={styles.callControls}>
      <div className={styles.callControlSection}>
        <div className={styles.callControlGroup}>
        <button
          type="button"
          className={`${styles.callCtrlBtn} ${!micEnabled ? styles.callCtrlBtnDanger : ""}`}
          onClick={() => void toggleMic()}
          title={micEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          <span className={styles.callCtrlBtnInner}>
            <Ic n={micEnabled ? "mic" : "mic-off"} sz={22} c={micEnabled ? "#e8e5e0" : "#f87171"} />
          </span>
        </button>

        <button
          type="button"
          className={`${styles.callCtrlBtn} ${!camEnabled ? styles.callCtrlBtnDanger : ""}`}
          onClick={() => void toggleCam()}
          title={camEnabled ? "Turn off camera" : "Turn on camera"}
        >
          <span className={styles.callCtrlBtnInner}>
            <Ic n={camEnabled ? "video" : "video-off"} sz={22} c={camEnabled ? "#e8e5e0" : "#f87171"} />
          </span>
        </button>

        <button
          type="button"
          className={`${styles.callCtrlBtn} ${isScreenShareEnabled ? styles.callCtrlBtnActive : ""}`}
          onClick={handleScreenShare}
          title={isScreenShareEnabled ? "Stop sharing screen" : "Share screen"}
        >
          <span className={styles.callCtrlBtnInner}>
            <Ic n="monitor" sz={22} c={isScreenShareEnabled ? "#b5ff4d" : "#e8e5e0"} />
          </span>
        </button>
        </div>
      </div>

      <div className={`${styles.callControlSection} ${styles.callControlSectionSplit}`}>
        <div className={styles.callControlGroup}>
        <button
          type="button"
          className={`${styles.callCtrlBtn} ${participantsOpen ? styles.callCtrlBtnActive : ""}`}
          onClick={onParticipantsToggle}
          title="Participants"
        >
          <span className={styles.callCtrlBtnInner}>
            <Ic n="users" sz={22} c={participantsOpen ? "#b5ff4d" : "#e8e5e0"} />
          </span>
          {participants.length > 0 && (
            <span className={styles.callCtrlBadge}>{participants.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`${styles.callCtrlBtn} ${chatOpen ? styles.callCtrlBtnActive : ""}`}
          onClick={onChatToggle}
          title="Chat"
        >
          <span className={styles.callCtrlBtnInner}>
            <Ic n="message" sz={22} c={chatOpen ? "#b5ff4d" : "#e8e5e0"} />
          </span>
        </button>

        <button
          type="button"
          className={`${styles.callCtrlBtn} ${transcriptOpen ? styles.callCtrlBtnActive : ""}`}
          onClick={onTranscriptToggle}
          title="Transcript"
        >
          <span className={styles.callCtrlBtnInner}>
            <Ic n="file-text" sz={22} c={transcriptOpen ? "#b5ff4d" : "#e8e5e0"} />
          </span>
        </button>

        <button
          type="button"
          className={`${styles.callCtrlBtn} ${styles.callCtrlBtnFlushRight} ${notesOpen ? styles.callCtrlBtnActive : ""}`}
          onClick={onNotesToggle}
          title="Notes"
        >
          <span className={styles.callCtrlBtnInner}>
            <Ic n="edit" sz={22} c={notesOpen ? "#b5ff4d" : "#e8e5e0"} />
          </span>
        </button>
        </div>
      </div>

      <div className={styles.callLeaveSection}>
        <button
          type="button"
          className={`${styles.callLeaveBtn} ${styles.callCtrlBtnDanger}`}
          onClick={onEndCall}
          title="Leave call"
        >
          <Ic n="phone-off" sz={22} c="#f87171" />
        </button>
      </div>
    </div>
  );
}
