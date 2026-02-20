import type { ProjectRow } from "./data";

type Props = {
  projects: ProjectRow[];
};

export function ProjectTable({ projects }: Props) {
  return (
    <div className="card full-w">
      <table className="proj-table">
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Team</th>
            <th>Deadline</th>
            <th>Budget</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.name}>
              <td>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{project.name}</div>
              </td>
              <td>
                <span className="tag">{project.category}</span>
              </td>
              <td>
                <span className={`badge ${project.statusTone}`}>{project.status}</span>
              </td>
              <td>
                <div className="progress-wrap">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill${project.statusTone === "badge-purple" ? " purple" : project.statusTone === "badge-amber" ? " amber" : ""}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="progress-pct">{project.progress}%</span>
                </div>
              </td>
              <td>
                <div className="avatar-stack">
                  {project.avatars.map((avatar) => (
                    <div
                      key={avatar.label}
                      className="avatar-sm"
                      style={{ background: avatar.bg, color: avatar.color }}
                    >
                      {avatar.label}
                    </div>
                  ))}
                </div>
              </td>
              <td>
                <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: project.dueTone ?? "var(--muted)" }}>{project.due}</span>
              </td>
              <td>
                <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12 }}>{project.budget}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
