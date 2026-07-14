import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as notificationService from "../services/notification.service";

const ICONS = {
  DONATION_SUCCESS: "\u2705",
  DONATION_REJECTED: "\u274C",
  DONATION_ESCALATED: "\u23F3",
  TRANSACTION_SUCCESS: "\uD83D\uDCB3",
  PROOF_REJECTED: "\u274C",
  PROOF_VERIFIED: "\u2705",
  FRAUD_ALERT: "\uD83D\uDEA8",
  WALLET_FROZEN: "\u26A0\uFE0F",
  WALLET_EXPIRED: "\u23F3",
  BENEFICIARY_REJECTED: "\uD83D\uDEA9",
  BENEFICIARY_BLOCKED: "\uD83D\uDEA9",
  CAMPAIGN_APPROVED: "\uD83C\uDFAF",
  CAMPAIGN_COMPLETED: "\uD83C\uDFAF",
  GOVERNMENT_ESCALATION: "\uD83C\uDFDB\uFE0F",
};

// This is a plain, functional dropdown - no polish, no animation pass yet.
// Getting notifications visible to every role (previously only NGO ever
// saw any) is a logic/workflow fix; the visual treatment is Phase 5's job.
export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getMyNotifications();
      const list = res.data?.data || res.data || [];
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Simple polling - no websocket layer exists in this codebase yet.
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpenNotification = async (n) => {
    if (!n.isRead) {
      try {
        await notificationService.markNotificationRead(n._id);
        setNotifications((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)),
        );
      } catch (err) {
        console.error("Failed to mark notification read", err);
      }
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="btn btn-ghost btn-sm"
        style={{
          borderColor: "rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.85)",
          position: "relative",
          padding: "6px 10px",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "var(--color-alert, #C0392B)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              borderRadius: "999px",
              minWidth: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="card shadow-lg"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "340px",
            maxHeight: "420px",
            overflowY: "auto",
            zIndex: 200,
            padding: "var(--space-3)",
          }}
        >
          <div className="row-between" style={{ marginBottom: "8px" }}>
            <strong style={{ fontSize: "13px" }}>Notifications</strong>
            {unreadCount > 0 && (
              <span className="badge badge-primary">{unreadCount} new</span>
            )}
          </div>

          {!loaded && (
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              Loading…
            </div>
          )}

          {loaded && notifications.length === 0 && (
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              You're all caught up.
            </div>
          )}

          <div className="stack-xs">
            {notifications.slice(0, 20).map((n) => (
              <div
                key={n._id}
                onClick={() => handleOpenNotification(n)}
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  background: n.isRead
                    ? "transparent"
                    : "var(--color-surface-alt, #f3f4f6)",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <span>{ICONS[n.type] || "\uD83D\uDCE2"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{n.title || n.type}</div>
                  <div style={{ color: "var(--color-text-muted)" }}>
                    {n.message}
                  </div>
                  <div
                    style={{
                      color: "var(--color-text-faint, #999)",
                      fontSize: "10px",
                      marginTop: "2px",
                    }}
                  >
                    {new Date(n.createdAt).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
