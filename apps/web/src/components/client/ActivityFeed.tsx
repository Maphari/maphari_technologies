type ActivityProps = {
  feed: Array<{ color: string; text: string; time: string }>;
};

export function ActivityFeed({ feed }: ActivityProps) {
  return (
    <div className="activity-list">
      {feed.map((event) => (
        <div key={`${event.text}-${event.time}`} className="activity-item">
          <div className="activity-dot" style={{ background: event.color }} />
          <div className="activity-text">
            <div className="activity-main">
              <strong>{event.text.split(" ")[0]}</strong> {event.text.replace(/^\S+ /, "")}
            </div>
            <div className="activity-time">{event.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
