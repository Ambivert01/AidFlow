export default function NotificationPanel({ notifications }) {
  if (!notifications) {
    return (
      <div className="card shadow-sm border-0">
        <div className="skeleton skeleton-title mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "60px" }} />
          ))}
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "PROOF_REJECTED":
        return "❌";
      case "PROOF_VERIFIED":
        return "✅";
      case "FRAUD_ALERT":
        return "🚨";
      case "WALLET_FROZEN":
        return "⚠️";
      case "WALLET_EXPIRED":
        return "⏳";
      case "BENEFICIARY_REJECTED":
      case "BENEFICIARY_BLOCKED":
        return "🚩";
      case "CAMPAIGN_APPROVED":
      case "CAMPAIGN_COMPLETED":
        return "🎯";
      case "GOVERNMENT_ESCALATION":
        return "🏛️";
      default:
        return "📢";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
      case "CRITICAL":
        return "bg-[var(--color-alert-light)] border-[var(--color-alert-light)]";
      case "MEDIUM":
        return "bg-[var(--color-signal-light)] border-[var(--color-signal-light)]";
      default:
        return "bg-[var(--color-paper-alt)] border-[var(--color-paper-alt)]";
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="row-between mb-4">
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Notifications</h2>
        {notifications.length > 0 && (
          <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold rounded-full">
            {notifications.filter((n) => !n.isRead).length} New
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-12 text-center bg-[var(--color-paper-alt)] rounded-lg">
          <span className="text-3xl block mb-2">🔔</span>
          <p className="text-sm font-bold text-[var(--color-steel)]">No notifications</p>
          <p className="text-xs text-[var(--color-steel)] mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-3 rounded-lg border ${getPriorityColor(notification.priority)} ${
                !notification.isRead ? "border-l-4" : ""
              } hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-[12px] font-bold text-[var(--color-ink)]">
                      {notification.title || notification.type}
                    </div>
                    {!notification.isRead && (
                      <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </div>

                  <div className="text-[11px] text-[var(--color-steel)] mb-2">
                    {notification.message}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-[var(--color-steel)]">
                      {new Date(notification.createdAt).toLocaleString(
                        "en-IN",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </div>

                    {notification.priority && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          notification.priority === "HIGH" ||
                          notification.priority === "CRITICAL"
                            ? "bg-[var(--color-alert-light)] text-[var(--color-alert-dark)]"
                            : notification.priority === "MEDIUM"
                              ? "bg-[var(--color-signal-light)] text-[var(--color-signal-dark)]"
                              : "bg-[var(--color-paper-alt)] text-[var(--color-ink)]"
                        }`}
                      >
                        {notification.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
