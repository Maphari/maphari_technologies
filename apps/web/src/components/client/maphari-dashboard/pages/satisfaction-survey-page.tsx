"use client";

import { useState } from "react";
import { cx } from "../style";

const questions = [
  { id: "q1", text: "How likely are you to recommend Maphari to a colleague?", type: "nps" as const },
  { id: "q2", text: "How satisfied are you with the quality of work delivered?", type: "rating" as const },
  { id: "q3", text: "How would you rate the communication from your project team?", type: "rating" as const },
  { id: "q4", text: "How satisfied are you with the timeliness of deliveries?", type: "rating" as const },
];

const history = [
  { date: "Jan 2026", nps: 8, quality: 4, communication: 5, timeliness: 4 },
  { date: "Dec 2025", nps: 7, quality: 4, communication: 4, timeliness: 3 },
  { date: "Nov 2025", nps: 9, quality: 5, communication: 5, timeliness: 5 },
];

export function SatisfactionSurveyPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>Veldt Finance · Account</div>
          <h1 className={cx("pageTitle")}>Give Feedback</h1>
          <p className={cx("pageSub")}>Your feedback helps us improve. Complete the monthly satisfaction survey below.</p>
        </div>
      </div>

      {!submitted ? (
        <div className={cx("card", "p24", "mb16")}>
          <div className={cx("fw700", "text14", "mb16")}>February 2026 Survey</div>
          {questions.map((q) => (
            <div key={q.id} className={cx("mb20")}>
              <div className={cx("fw600", "text12", "mb8")}>{q.text}</div>
              <div className={cx("flex", "gap6")}>
                {(q.type === "nps" ? [0,1,2,3,4,5,6,7,8,9,10] : [1,2,3,4,5]).map((n) => (
                  <button key={n} type="button" className={cx("btnSm", "btnGhost")} style={{ minWidth: q.type === "nps" ? "36px" : "42px" }}>{n}</button>
                ))}
              </div>
              {q.type === "nps" && <div className={cx("flex", "gap0", "justifyBetween", "text10", "colorMuted", "mt4")} style={{ maxWidth: "400px" }}><span>Not likely</span><span>Very likely</span></div>}
            </div>
          ))}
          <div className={cx("mb16")}>
            <div className={cx("fw600", "text12", "mb8")}>Anything else you'd like us to know?</div>
            <textarea className={cx("input")} rows={3} placeholder="Optional comments..." style={{ width: "100%", resize: "vertical" }} />
          </div>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setSubmitted(true)}>Submit Feedback</button>
        </div>
      ) : (
        <div className={cx("card", "p24", "mb16")} style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
          <div className={cx("fw700", "text14", "mb4")}>Thank you for your feedback!</div>
          <div className={cx("text12", "colorMuted")}>Your responses help us continually improve our service.</div>
        </div>
      )}

      <div className={cx("card")}>
        <div className={cx("cardHd")} style={{ padding: "12px 16px" }}><span className={cx("cardHdTitle")}>Previous Responses</span></div>
        <table className={cx("table")}>
          <thead><tr><th>Period</th><th>NPS</th><th>Quality</th><th>Communication</th><th>Timeliness</th></tr></thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.date}>
                <td className={cx("fw600")}>{h.date}</td>
                <td className={cx("fontMono", "fw600", h.nps >= 8 ? "colorGreen" : "colorAmber")}>{h.nps}/10</td>
                <td className={cx("fontMono")}>{h.quality}/5</td>
                <td className={cx("fontMono")}>{h.communication}/5</td>
                <td className={cx("fontMono")}>{h.timeliness}/5</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
