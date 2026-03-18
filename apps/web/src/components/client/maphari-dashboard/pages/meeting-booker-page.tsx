"use client";

import { useState } from "react";
import { cx } from "../style";

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00"];

export function MeetingBookerPage() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Communication · Meetings</div>
          <h1 className={cx("pageTitle")}>Book a Call</h1>
          <p className={cx("pageSub")}>
            Schedule a meeting with your project team or account manager.
          </p>
        </div>
      </div>

      <div className={cx("grid2", "mb16")}>
        <div className={cx("card", "p20")}>
          <div className={cx("fw700", "mb12")}>Schedule a Meeting</div>
          <div className={cx("flexCol", "gap12")}>
            <div>
              <div className={cx("text11", "colorMuted", "mb4")}>Meeting Type</div>
              <select className={cx("input", "wFull")}>
                <option>Project Check-in</option>
                <option>Feedback Session</option>
                <option>Strategy Call</option>
                <option>Emergency Escalation</option>
              </select>
            </div>
            <div>
              <div className={cx("text11", "colorMuted", "mb4")}>Team Member</div>
              <select className={cx("input", "wFull")}>
                <option value="">— Select team member —</option>
                <option>Account Manager</option>
                <option>Lead Designer</option>
                <option>Lead Developer</option>
              </select>
            </div>
            <div>
              <div className={cx("text11", "colorMuted", "mb4")}>Date</div>
              <input type="date" className={cx("input", "wFull")} />
            </div>
            <div>
              <div className={cx("text11", "colorMuted", "mb4")}>Time Slot</div>
              <div className={cx("flexRow", "flexWrap", "gap6", "mb12")}>
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={cx("btnSm", selectedSlot === slot ? "btnAccent" : "btnGhost")}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={cx("text11", "colorMuted", "mb4")}>Notes</div>
              <textarea
                rows={2}
                placeholder="Any specific topics to discuss..."
                className={cx("input", "wFull", "resizeV")}
              />
            </div>
            <button
              type="button"
              className={cx("btnSm", "btnAccent", "wFull")}
            >
              Request Meeting
            </button>
          </div>
        </div>

        <div className={cx("card", "p20")}>
          <div className={cx("fw700", "mb12")}>Upcoming Meetings</div>
          <div className={cx("listGroup")}>
            {([] as { date: string; type: string; member: string }[]).map((meeting) => (
              <div key={meeting.date} className={cx("listRow")}>
                <div>
                  <div className={cx("fw600")}>{meeting.date}</div>
                  <div className={cx("text11", "colorMuted")}>{meeting.type}</div>
                  <div className={cx("text11", "colorMuted")}>{meeting.member}</div>
                </div>
                <span
                  className={cx("text11", "colorAccent", "pointer")}
                >
                  Reschedule
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Past Meetings</span>
        </div>
        <div className={cx("listGroup")}>
          {([] as { date: string; type: string; member: string }[]).map((meeting) => (
            <div key={meeting.date} className={cx("listRow")}>
              <div>
                <div className={cx("fw600")}>{meeting.date}</div>
                <div className={cx("text11", "colorMuted")}>
                  {meeting.type} · {meeting.member}
                </div>
              </div>
              <span className={cx("text11", "colorAccent")}>View Notes →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
