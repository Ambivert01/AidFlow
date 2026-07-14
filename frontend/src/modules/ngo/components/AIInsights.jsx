export default function AIInsights({ aiInsights }) {
  if (!aiInsights) {
    return (
      <div className="card shadow-sm border-0">
        <div className="skeleton skeleton-title mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "60px" }} />
          ))}
        </div>
      </div>
    );
  }

  const hasCriticalAlerts =
    aiInsights.criticalAlerts && aiInsights.criticalAlerts.length > 0;
  const hasRecentDecisions =
    aiInsights.recentDecisions && aiInsights.recentDecisions.length > 0;

  return (
    <div className="card shadow-sm border-0">
      <div className="row-between mb-4">
        <h2 className="text-lg font-bold text-[var(--color-ink)]">AI Insights</h2>
        <div className="text-right">
          <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold">
            Active Alerts
          </div>
          <div
            className={`text-xl font-bold ${aiInsights.activeFraudAlerts > 0 ? "text-[var(--color-alert)]" : "text-[var(--color-verified)]"}`}
          >
            {aiInsights.activeFraudAlerts || 0}
          </div>
        </div>
      </div>

      {aiInsights.activeFraudAlerts === 0 && !hasRecentDecisions ? (
        <div className="py-12 text-center bg-[var(--color-verified-light)] rounded-lg border border-[var(--color-verified-light)]">
          <span className="text-3xl block mb-2">✅</span>
          <p className="text-sm font-bold text-[var(--color-verified-dark)]">All Clear!</p>
          <p className="text-xs text-[var(--color-verified)] mt-1">
            No active fraud alerts detected
          </p>
        </div>
      ) : (
        <>
          {hasCriticalAlerts && (
            <div className="mb-4">
              <div className="text-[11px] font-bold text-[var(--color-alert-dark)] uppercase mb-2 flex items-center gap-2">
                <span>🚨</span> Critical Alerts
              </div>
              <div className="space-y-2">
                {aiInsights.criticalAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="p-3 bg-[var(--color-alert-light)] border border-[var(--color-alert-light)] rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-[12px] font-bold text-[var(--color-alert-dark)]">
                          {alert.alertType}
                        </div>
                        <div className="text-[10px] text-[var(--color-alert)] uppercase font-bold mt-0.5">
                          {alert.entityType} • {alert.severity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[var(--color-alert)] uppercase font-bold">
                          Risk Score
                        </div>
                        <div className="text-lg font-bold text-[var(--color-alert-dark)]">
                          {alert.riskScore || 0}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-[var(--color-alert-dark)] bg-[var(--color-alert-light)] px-2 py-1 rounded">
                      Entity ID: {alert.entityId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiInsights.alertsBySeverity &&
            Object.keys(aiInsights.alertsBySeverity).length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
                  Alerts by Severity
                </div>
                <div className="grid-3 gap-2">
                  {Object.entries(aiInsights.alertsBySeverity).map(
                    ([severity, count]) => (
                      <div
                        key={severity}
                        className={`text-center p-2 rounded ${
                          severity === "CRITICAL"
                            ? "bg-[var(--color-alert-light)]"
                            : severity === "HIGH"
                              ? "bg-[var(--color-signal-light)]"
                              : severity === "MEDIUM"
                                ? "bg-[var(--color-caution-light)]"
                                : "bg-[var(--color-paper-alt)]"
                        }`}
                      >
                        <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold">
                          {severity}
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            severity === "CRITICAL"
                              ? "text-[var(--color-alert-dark)]"
                              : severity === "HIGH"
                                ? "text-[var(--color-signal-dark)]"
                                : severity === "MEDIUM"
                                  ? "text-[var(--color-caution)]"
                                  : "text-[var(--color-ink)]"
                          }`}
                        >
                          {count}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {hasRecentDecisions && (
            <div className="mt-4 pt-4 border-t border-[var(--color-paper-alt)]">
              <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
                Recent AI Decisions
              </div>
              <div className="space-y-2">
                {aiInsights.recentDecisions.slice(0, 5).map((decision) => (
                  <div
                    key={decision._id}
                    className="p-2 bg-[var(--color-paper-alt)] rounded hover:bg-[var(--color-paper-alt)] transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <div className="text-[12px] font-bold text-[var(--color-ink)]">
                          {decision.decisionType}
                        </div>
                        <div className="text-[10px] text-[var(--color-steel)] mt-0.5">
                          {new Date(decision.evaluatedAt).toLocaleDateString(
                            "en-IN",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold">
                            Risk
                          </div>
                          <div
                            className={`text-sm font-bold ${
                              decision.riskScore > 70
                                ? "text-[var(--color-alert)]"
                                : decision.riskScore > 40
                                  ? "text-[var(--color-signal)]"
                                  : "text-[var(--color-verified)]"
                            }`}
                          >
                            {decision.riskScore || 0}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            decision.decision === "ALLOW"
                              ? "bg-[var(--color-verified-light)] text-[var(--color-verified-dark)]"
                              : decision.decision === "ALLOW_WITH_MONITORING"
                                ? "bg-[var(--color-caution-light)] text-[var(--color-caution)]"
                                : decision.decision === "BLOCK" ||
                                    decision.decision === "ESCALATE_TO_GOVT"
                                  ? "bg-[var(--color-alert-light)] text-[var(--color-alert-dark)]"
                                  : "bg-[var(--color-signal-light)] text-[var(--color-signal-dark)]"
                          }`}
                        >
                          {decision.decision}
                        </span>
                      </div>
                    </div>
                    {decision.reason && (
                      <div className="text-[10px] text-[var(--color-steel)] mt-1">
                        {decision.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiInsights.decisionsByType &&
            Object.keys(aiInsights.decisionsByType).length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--color-paper-alt)]">
                <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
                  Decisions by Type
                </div>
                <div className="space-y-1">
                  {Object.entries(aiInsights.decisionsByType).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex justify-between items-center text-[12px] p-1"
                      >
                        <span className="text-[var(--color-ink)] font-medium">
                          {type}
                        </span>
                        <span className="font-bold text-[var(--color-ink)]">
                          {count}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}
