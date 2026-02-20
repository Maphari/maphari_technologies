type MilestoneItem = {
  title: string;
  date: string;
  status: "" | "done" | "active";
};

type Props = {
  items: MilestoneItem[];
};

export function Milestones({ items }: Props) {
  return (
    <div className="card">
      <div className="card-hd">
        <span className="card-hd-title">Next Milestones</span>
      </div>
      <div className="card-inner" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <div className="milestone-list">
          {items.map((item) => (
            <div key={item.title} className="milestone-item">
              <div className={`m-check${item.status ? ` ${item.status}` : ""}`}>
                {item.status === "done" ? "✓" : item.status === "active" ? "→" : ""}
              </div>
              <div>
                <div className="m-title">{item.title}</div>
                <div className="m-date">{item.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
