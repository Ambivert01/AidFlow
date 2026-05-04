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
      case "FRAUD_ALERT":
        return "🚨";
      case "WALLET_SUSPENDED":
        return "⚠️";
      case "BENEFICIARY_FLAGGED":
        return "🚩";
      case "CAMPAIGN_MILESTONE":
        return "🎯";
      default:
        return "📢";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
      case "CRITICAL":
        return "bg-red-50 border-red-200";
      case "MEDIUM":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="row-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
        {notifications.length > 0 && (
          <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold rounded-full">
            {notifications.filter((n) => !n.isRead).length} New
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-lg">
          <span className="text-3xl block mb-2">🔔</span>
          <p className="text-sm font-bold text-slate-600">No notifications</p>
          <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
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
                    <div className="text-[12px] font-bold text-slate-800">
                      {notification.title || notification.type}
                    </div>
                    {!notification.isRead && (
                      <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-600 mb-2">
                    {notification.message}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-slate-500">
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
                            ? "bg-red-100 text-red-700"
                            : notification.priority === "MEDIUM"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-700"
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
