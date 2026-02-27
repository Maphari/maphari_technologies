"use client";

import { useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#a78bfa",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0",
};

const weeks = ["Feb 24", "Mar 3", "Mar 10", "Mar 17", "Mar 24"] as const;
const CAPACITY = 40;

const staff = [
  {
    id: "RF",
    name: "Renzo Fabbri",
    role: "Creative Director",
    color: C.orange,
    avatar: "RF",
    allocations: [
      { project: "Volta Brand", client: "Volta Studios", clientColor: C.lime, hours: [16, 12, 8, 8, 4] },
      { project: "Dune Editorial", client: "Dune Collective", clientColor: C.amber, hours: [14, 18, 20, 12, 8] },
      { project: "Internal", client: "Internal", clientColor: C.muted, hours: [4, 4, 4, 4, 4] },
    ],
  },
  {
    id: "KB",
    name: "Kira Bosman",
    role: "UX Designer",
    color: C.purple,
    avatar: "KB",
    allocations: [
      { project: "Mira Website", client: "Mira Health", clientColor: C.blue, hours: [24, 28, 32, 20, 16] },
      { project: "Internal", client: "Internal", clientColor: C.muted, hours: [4, 4, 4, 4, 4] },
    ],
  },
  {
    id: "ND",
    name: "Nomsa Dlamini",
    role: "Account Manager",
    color: C.lime,
    avatar: "ND",
    allocations: [
      { project: "Kestrel Campaign", client: "Kestrel Capital", clientColor: C.purple, hours: [12, 10, 8, 6, 4] },
      { project: "Volta AM", client: "Volta Studios", clientColor: C.lime, hours: [10, 10, 10, 10, 10] },
      { project: "Mira AM", client: "Mira Health", clientColor: C.blue, hours: [8, 8, 8, 8, 8] },
      { project: "Internal", client: "Internal", clientColor: C.muted, hours: [4, 4, 4, 4, 4] },
    ],
  },
  {
    id: "TM",
    name: "Tapiwa Moyo",
    role: "Copywriter",
    color: C.amber,
    avatar: "TM",
    allocations: [
      { project: "Okafor Annual Report", client: "Okafor & Sons", clientColor: C.orange, hours: [16, 12, 8, 4, 0] },
      { project: "Kestrel Copy", client: "Kestrel Capital", clientColor: C.purple, hours: [10, 10, 8, 6, 4] },
      { project: "Internal", client: "Internal", clientColor: C.muted, hours: [4, 4, 4, 4, 4] },
    ],
  },
  {
    id: "LF",
    name: "Leilani Fotu",
    role: "Project Manager",
    color: C.blue,
    avatar: "LF",
    allocations: [
      { project: "Portfolio PM", client: "All Clients", clientColor: C.lime, hours: [24, 24, 24, 24, 24] },
      { project: "Admin Ops", client: "Internal", clientColor: C.muted, hours: [8, 8, 8, 8, 8] },
    ],
  },
] as const;

const projectColors: Record<string, string> = {
  "Volta Studios": C.lime,
  "Kestrel Capital": C.purple,
  "Mira Health": C.blue,
  "Dune Collective": C.amber,
  "Okafor & Sons": C.orange,
  "All Clients": C.lime,
  Internal: C.muted,
};

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

type Tab = "weekly grid" | "capacity overview" | "by project";
const tabs: Tab[] = ["weekly grid", "capacity overview", "by project"];

export function ResourceAllocationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("weekly grid");
  const [selectedWeek, setSelectedWeek] = useState(0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / OPERATIONS</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Resource Allocation</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Staff capacity - Project assignments - Overallocation alerts</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Export Plan</button>
          <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Adjust Allocation</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {(() => {
          const weekTotals = staff.map((s) => ({
            name: s.name,
            color: s.color,
            total: s.allocations.reduce((sum, a) => sum + a.hours[selectedWeek], 0),
          }));
          const overallocated = weekTotals.filter((w) => w.total > CAPACITY).length;
          const underutilised = weekTotals.filter((w) => w.total < CAPACITY * 0.7).length;
          const teamUtil = Math.round((weekTotals.reduce((s, w) => s + w.total, 0) / (staff.length * CAPACITY)) * 100);
          return [
            { label: "Team Utilisation", value: `${teamUtil}%`, color: teamUtil >= 80 ? C.lime : C.amber, sub: `Week of ${weeks[selectedWeek]}` },
            { label: "Overallocated", value: overallocated.toString(), color: overallocated > 0 ? C.red : C.lime, sub: `> ${CAPACITY}h capacity` },
            { label: "Underutilised", value: underutilised.toString(), color: underutilised > 0 ? C.amber : C.lime, sub: `< ${Math.round(CAPACITY * 0.7)}h this week` },
            { label: "Total Staff Hours", value: `${weekTotals.reduce((s, w) => s + w.total, 0)}h`, color: C.blue, sub: `Cap: ${staff.length * CAPACITY}h` },
          ];
        })().map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === t ? C.lime : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: `2px solid ${activeTab === t ? C.lime : "transparent"}`,
              marginBottom: -1,
              transition: "all 0.2s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "weekly grid" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {weeks.map((w, i) => (
              <button
                key={w}
                onClick={() => setSelectedWeek(i)}
                style={{
                  background: selectedWeek === i ? C.lime : C.surface,
                  color: selectedWeek === i ? C.bg : C.muted,
                  border: `1px solid ${selectedWeek === i ? C.lime : C.border}`,
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                w/c {w}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {staff.map((member) => {
              const weekTotal = member.allocations.reduce((s, a) => s + a.hours[selectedWeek], 0);
              const isOver = weekTotal > CAPACITY;
              const util = Math.round((weekTotal / CAPACITY) * 100);
              return (
                <div key={member.id} style={{ background: C.surface, border: `1px solid ${isOver ? `${C.red}66` : C.border}`, borderRadius: 12, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <Avatar initials={member.avatar} color={member.color} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{member.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{member.role}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 800, color: isOver ? C.red : util >= 80 ? C.lime : C.amber }}>{weekTotal}h</div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        of {CAPACITY}h - {util}%
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 28, background: C.border, borderRadius: 6, overflow: "hidden", display: "flex", marginBottom: 12 }}>
                    {member.allocations.map((alloc, i) => {
                      const width = (alloc.hours[selectedWeek] / CAPACITY) * 100;
                      if (width === 0) return null;
                      return (
                        <div
                          key={i}
                          title={`${alloc.project}: ${alloc.hours[selectedWeek]}h`}
                          style={{
                            width: `${Math.min(width, 100)}%`,
                            background: projectColors[alloc.client] || C.muted,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            color: C.bg,
                            fontWeight: 700,
                            borderRight: `1px solid ${C.bg}22`,
                            transition: "width 0.5s",
                          }}
                        >
                          {alloc.hours[selectedWeek] >= 6 ? `${alloc.hours[selectedWeek]}h` : ""}
                        </div>
                      );
                    })}
                    {isOver ? <div style={{ width: `${((weekTotal - CAPACITY) / CAPACITY) * 100}%`, background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>+{weekTotal - CAPACITY}h</div> : null}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {member.allocations.map(
                      (alloc, i) =>
                        alloc.hours[selectedWeek] > 0 && (
                          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: projectColors[alloc.client] || C.muted }} />
                            <span style={{ color: C.muted }}>{alloc.project}</span>
                            <span style={{ color: projectColors[alloc.client] || C.muted, fontFamily: "DM Mono, monospace" }}>{alloc.hours[selectedWeek]}h</span>
                          </div>
                        )
                    )}
                  </div>

                  {isOver ? <div style={{ marginTop: 12, padding: 10, background: C.surface, borderRadius: 6, borderLeft: `3px solid ${C.red}`, fontSize: 12, color: C.red }}>⚠ Overallocated by {weekTotal - CAPACITY}h - review assignments</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "capacity overview" && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: `200px ${weeks.map(() => "1fr").join(" ")}`, padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", gap: 12 }}>
            <span>Staff Member</span>
            {weeks.map((w) => (
              <span key={w} style={{ textAlign: "center" }}>
                w/c {w}
              </span>
            ))}
          </div>
          {staff.map((member, ri) => (
            <div key={member.id} style={{ display: "grid", gridTemplateColumns: `200px ${weeks.map(() => "1fr").join(" ")}`, padding: "16px 24px", borderBottom: ri < staff.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Avatar initials={member.avatar} color={member.color} size={28} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{member.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{member.role}</div>
                </div>
              </div>
              {weeks.map((w, wi) => {
                const total = member.allocations.reduce((s, a) => s + a.hours[wi], 0);
                const pct = Math.round((total / CAPACITY) * 100);
                const color = total > CAPACITY ? C.red : pct >= 80 ? C.lime : pct >= 60 ? C.amber : C.muted;
                return (
                  <div key={w} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 15, color }}>{total}h</div>
                    <div style={{ height: 4, background: C.border, borderRadius: 2, margin: "6px 0" }}>
                      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 9, color }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: `200px ${weeks.map(() => "1fr").join(" ")}`, padding: "14px 24px", borderTop: `2px solid ${C.border}`, background: "#0d0d14", gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.lime }}>Team Total</span>
            {weeks.map((w, wi) => {
              const total = staff.reduce((s, m) => s + m.allocations.reduce((s2, a) => s2 + a.hours[wi], 0), 0);
              const cap = staff.length * CAPACITY;
              const pct = Math.round((total / cap) * 100);
              return (
                <div key={w} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 15, color: pct >= 80 ? C.lime : C.amber }}>{total}h</div>
                  <div style={{ fontSize: 9, color: C.muted }}>
                    {pct}% of {cap}h cap
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "by project" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { name: "Brand Identity System", client: "Volta Studios", color: C.lime },
            { name: "Q1 Campaign Strategy", client: "Kestrel Capital", color: C.purple },
            { name: "Website Redesign", client: "Mira Health", color: C.blue },
            { name: "Editorial Design System", client: "Dune Collective", color: C.amber },
            { name: "Annual Report 2025", client: "Okafor & Sons", color: C.orange },
          ].map((project) => {
            const assignedStaff = staff.filter((m) => m.allocations.some((a) => a.client === project.client));
            const weeklyHours = weeks.map((_, wi) => assignedStaff.reduce((s, m) => s + m.allocations.filter((a) => a.client === project.client).reduce((s2, a) => s2 + a.hours[wi], 0), 0));
            return (
              <div key={project.name} style={{ background: C.surface, border: `1px solid ${project.color}33`, borderRadius: 10, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{project.name}</div>
                    <div style={{ fontSize: 12, color: project.color }}>{project.client}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>{assignedStaff.map((m) => <Avatar key={m.id} initials={m.avatar} color={m.color} size={28} />)}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: 8 }}>
                  {weeks.map((w, wi) => (
                    <div key={w} style={{ padding: 10, background: C.bg, borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 16, color: project.color }}>{weeklyHours[wi]}h</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>w/c {w}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
