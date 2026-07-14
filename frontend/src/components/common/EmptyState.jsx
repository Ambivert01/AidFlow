export default function EmptyState({ title, subtitle, icon = "🎯" }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{subtitle}</div>
    </div>
  );
}
