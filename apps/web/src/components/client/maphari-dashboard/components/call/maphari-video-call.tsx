"use client";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRoomContext, useLocalParticipant, useParticipants, RoomAudioRenderer } from "@livekit/components-react";
import type { AuthSession } from "@/lib/auth/session";
import { createPortalMessageWithRefresh } from "@/lib/api/portal/messages";
import { Ic } from "../../ui";
import { RecordingBadge } from "./recording-badge";
import { AgentIndicator } from "./agent-indicator";
import { ParticipantGrid } from "./participant-grid";
import { SelfView } from "./self-view";
import { ControlBar } from "./control-bar";
import { ChatPanel } from "./chat-panel";
import { TranscriptPanel } from "./transcript-panel";
import { NotesPanel } from "./notes-panel";
import { ActionItemToast } from "./action-item-toast";
import styles from "@/app/style/client/call-ui.module.css";

interface MaphariVideoCallProps {
  roomName: string;
  onClose: () => void;
  conversationId?: string | null;
  session?: AuthSession | null;
}

function ParticipantsSidebar({ onClose }: { onClose: () => void }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    function applyDefaultPosition() {
      if (typeof window === "undefined" || isMinimized) return;
      const rect = panelRef.current?.getBoundingClientRect();
      const width = rect?.width ?? 260;
      const height = rect?.height ?? 320;
      const margin = 16;
      const topOffset = window.innerWidth <= 720 ? 96 : 84;
      setPosition((current) => {
        if (!current) {
          return { x: margin, y: topOffset };
        }
        const maxX = Math.max(margin, window.innerWidth - width - margin);
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
  }, [isMinimized]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isMinimized) return;
    const rect = panelRef.current?.getBoundingClientRect();
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
    const rect = panelRef.current?.getBoundingClientRect();
    if (!drag || drag.pointerId !== event.pointerId || !rect || isMinimized) return;
    const margin = 16;
    const topOffset = window.innerWidth <= 720 ? 96 : 84;
    const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxY = Math.max(topOffset, window.innerHeight - rect.height - margin);
    setPosition({
      x: Math.min(Math.max(event.clientX - drag.offsetX, margin), maxX),
      y: Math.min(Math.max(event.clientY - drag.offsetY, topOffset), maxY),
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  if (isMinimized) {
    return (
      <div className={styles.participantsSidebarMini}>
        <div>
          <div className={styles.participantsSidebarMiniTitle}>Participants</div>
          <div className={styles.participantsSidebarMiniMeta}>{participants.length} in call</div>
        </div>
        <button
          type="button"
          className={styles.callPanelClose}
          onClick={() => setIsMinimized(false)}
          aria-label="Expand participants"
        >
          <Ic n="chevron-up" sz={14} c="currentColor" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={styles.participantsSidebar}
      style={position ? { left: position.x, top: position.y } : undefined}
    >
      <div
        className={styles.participantsSidebarHead}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span className={styles.participantsSidebarTitle}>Participants ({participants.length})</span>
        <div className={styles.participantsSidebarActions}>
          <button
            type="button"
            className={styles.callPanelClose}
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize participants"
          >
            <Ic n="minus" sz={14} c="currentColor" />
          </button>
          <button type="button" className={styles.callPanelClose} onClick={onClose} aria-label="Close participants">
            <Ic n="x" sz={12} c="currentColor" />
          </button>
        </div>
      </div>
      {participants.map(p => {
        const isLocal = p.identity === localParticipant.identity;
        const isAgent = p.identity?.startsWith("agent-") ?? false;
        const displayName = isAgent ? "Maphari AI" : (p.name ?? p.identity ?? "Unknown");
        const initial = isAgent ? "AI" : (displayName[0]?.toUpperCase() ?? "?");
        return (
          <div key={p.identity} className={styles.participantItem}>
            <div className={styles.participantAvatar}>{initial}</div>
            <div>
              <div className={styles.participantName}>{displayName}</div>
              {isLocal && <div className={styles.participantLocal}>You</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MaphariVideoCall({ roomName, onClose, conversationId, session }: MaphariVideoCallProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  const [chatOpen, setChatOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);

  function openOnly(panel: "chat" | "transcript" | "notes" | "participants") {
    setChatOpen(panel === "chat");
    setTranscriptOpen(panel === "transcript");
    setNotesOpen(panel === "notes");
    setParticipantsOpen(panel === "participants");
  }

  function handleChatToggle() {
    if (chatOpen) setChatOpen(false);
    else openOnly("chat");
  }

  function handleTranscriptToggle() {
    if (transcriptOpen) setTranscriptOpen(false);
    else openOnly("transcript");
  }

  function handleNotesToggle() {
    if (notesOpen) setNotesOpen(false);
    else openOnly("notes");
  }

  function handleParticipantsToggle() {
    if (participantsOpen) setParticipantsOpen(false);
    else openOnly("participants");
  }

  function handleEndCall() {
    void room.disconnect();
    onClose();
  }

  async function handleSaveNotes(noteText: string) {
    if (!session || !conversationId) return;
    await createPortalMessageWithRefresh(session, {
      conversationId,
      content: "Meeting Notes:\n" + noteText,
    });
  }

  const participantName = localParticipant.name ?? localParticipant.identity ?? "You";
  const participantCount = participants.length;
  const connectionLabel = String(room.state ?? "connected").toLowerCase();
  const workspaceItems = [
    "Confirm the meeting goal and any deadline-sensitive blockers.",
    "Capture concrete owners for every action before leaving the call.",
    "Save notes to the conversation thread for shared visibility.",
  ];

  return (
    <div className={styles.callShell}>
      <RecordingBadge />

      <div className={styles.callHeader}>
        <div className={styles.callBrandMark}>M</div>
        <div className={styles.callHeaderMeta}>
          <div className={styles.callHeaderTitle}>{roomName}</div>
          <div className={styles.callHeaderSub}>Live collaboration workspace for client meetings</div>
        </div>
        <div className={styles.callHeaderBadges}>
          <span className={styles.callHeaderBadge}>{connectionLabel}</span>
          <span className={styles.callHeaderBadge}>{participantCount} participants</span>
          <AgentIndicator />
        </div>
        <div className={styles.callHeaderActions}>
          <button type="button" className={styles.callHeaderAction} onClick={handleParticipantsToggle}>People</button>
        </div>
      </div>

      <div className={styles.callBody}>
        <div className={styles.callGrid}>
          <div className={styles.callStageTopRow}>
            <div className={styles.callStageLabel}>Meeting stage</div>
          </div>
          <ParticipantGrid />
        </div>
        <aside className={styles.callWorkspaceRail}>
          <div className={styles.callWorkspaceCard}>
            <div className={styles.callWorkspaceTitle}>Workspace</div>
            <div className={styles.callWorkspaceActions}>
              <button type="button" className={`${styles.callWorkspaceBtn} ${chatOpen ? styles.callWorkspaceBtnActive : ""}`} onClick={handleChatToggle}>Chat</button>
              <button type="button" className={`${styles.callWorkspaceBtn} ${transcriptOpen ? styles.callWorkspaceBtnActive : ""}`} onClick={handleTranscriptToggle}>Transcript</button>
              <button type="button" className={`${styles.callWorkspaceBtn} ${notesOpen ? styles.callWorkspaceBtnActive : ""}`} onClick={handleNotesToggle}>Notes</button>
            </div>
          </div>
          <div className={styles.callWorkspaceCard}>
            <div className={styles.callWorkspaceTitle}>Call details</div>
            <div className={styles.callDetailRow}><span>Room</span><strong>{roomName}</strong></div>
            <div className={styles.callDetailRow}><span>You</span><strong>{participantName}</strong></div>
            <div className={styles.callDetailRow}><span>Saved notes</span><strong>{conversationId ? "Thread linked" : "Local only"}</strong></div>
            <div className={styles.callWorkspaceInlineActions}>
              <button type="button" className={styles.callWorkspaceBtn} onClick={() => void navigator.clipboard.writeText(window.location.href)}>Copy link</button>
              <button type="button" className={styles.callWorkspaceBtn} onClick={handleParticipantsToggle}>View people</button>
            </div>
          </div>
          <div className={styles.callWorkspaceCard}>
            <div className={styles.callWorkspaceTitle}>Meeting focus</div>
            <div className={styles.callWorkspaceList}>
              {workspaceItems.map((item) => (
                <div key={item} className={styles.callWorkspaceItem}>
                  <span className={styles.callWorkspaceDot} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {participantsOpen && (
        <ParticipantsSidebar onClose={() => setParticipantsOpen(false)} />
      )}

      <SelfView />

      <ControlBar
        onEndCall={handleEndCall}
        chatOpen={chatOpen}
        onChatToggle={handleChatToggle}
        transcriptOpen={transcriptOpen}
        onTranscriptToggle={handleTranscriptToggle}
        notesOpen={notesOpen}
        onNotesToggle={handleNotesToggle}
        participantsOpen={participantsOpen}
        onParticipantsToggle={handleParticipantsToggle}
      />

      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        participantName={participantName}
      />

      <TranscriptPanel
        open={transcriptOpen}
        onClose={() => setTranscriptOpen(false)}
      />

      <NotesPanel
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        onSave={handleSaveNotes}
      />

      <ActionItemToast />
      <RoomAudioRenderer />
    </div>
  );
}
