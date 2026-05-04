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
        <h2 className="text-lg font-bold text-slate-800">AI Insights</h2>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase font-bold">
            Active Alerts
          </div>
          <div
            className={`text-xl font-bold ${aiInsights.activeFraudAlerts > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {aiInsights.activeFraudAlerts || 0}
          </div>
        </div>
      </div>

      {aiInsights.activeFraudAlerts === 0 && !hasRecentDecisions ? (
        <div className="py-12 text-center bg-green-50 rounded-lg border border-green-200">
          <span className="text-3xl block mb-2">✅</span>
          <p className="text-sm font-bold text-green-700">All Clear!</p>
          <p className="text-xs text-green-600 mt-1">
            No active fraud alerts detected
          </p>
        </div>
      ) : (
        <>
          {hasCriticalAlerts && (
            <div className="mb-4">
              <div className="text-[11px] font-bold text-red-700 uppercase mb-2 flex items-center gap-2">
                <span>🚨</span> Critical Alerts
              </div>
              <div className="space-y-2">
                {aiInsights.criticalAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-[12px] font-bold text-red-800">
                          {alert.alertType}
                        </div>
                        <div className="text-[10px] text-red-600 uppercase font-bold mt-0.5">
                          {alert.entityType} • {alert.severity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-red-600 uppercase font-bold">
                          Risk Score
                        </div>
                        <div className="text-lg font-bold text-red-700">
                          {alert.riskScore || 0}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-red-700 bg-red-100 px-2 py-1 rounded">
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
                <div className="text-[11px] font-bold text-slate-600 uppercase mb-2">
                  Alerts by Severity
                </div>
                <div className="grid-3 gap-2">
                  {Object.entries(aiInsights.alertsBySeverity).map(
                    ([severity, count]) => (
                      <div
                        key={severity}
                        className={`text-center p-2 rounded ${
                          severity === "CRITICAL"
                            ? "bg-red-100"
                            : severity === "HIGH"
                              ? "bg-orange-100"
                              : severity === "MEDIUM"
                                ? "bg-yellow-100"
                                : "bg-slate-100"
                        }`}
                      >
                        <div className="text-[10px] text-slate-600 uppercase font-bold">
                          {severity}
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            severity === "CRITICAL"
                              ? "text-red-700"
                              : severity === "HIGH"
                                ? "text-orange-700"
                                : severity === "MEDIUM"
                                  ? "text-yellow-700"
                                  : "text-slate-700"
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
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-600 uppercase mb-2">
                Recent AI Decisions
              </div>
              <div className="space-y-2">
                {aiInsights.recentDecisions.slice(0, 5).map((decision) => (
                  <div
                    key={decision._id}
                    className="p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <div className="text-[12px] font-bold text-slate-800">
                          {decision.decisionType}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
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
                          <div className="text-[10px] text-slate-500 uppercase font-bold">
                            Risk
                          </div>
                          <div
                            className={`text-sm font-bold ${
                              decision.riskScore > 70
                                ? "text-red-600"
                                : decision.riskScore > 40
                                  ? "text-orange-600"
                                  : "text-green-600"
                            }`}
                          >
                            {decision.riskScore || 0}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            decision.decision === "APPROVE"
                              ? "bg-green-100 text-green-700"
                              : decision.decision === "BLOCK"
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {decision.decision}
                        </span>
                      </div>
                    </div>
                    {decision.reason && (
                      <div className="text-[10px] text-slate-600 mt-1">
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
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-600 uppercase mb-2">
                  Decisions by Type
                </div>
                <div className="space-y-1">
                  {Object.entries(aiInsights.decisionsByType).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex justify-between items-center text-[12px] p-1"
                      >
                        <span className="text-slate-700 font-medium">
                          {type}
                        </span>
                        <span className="font-bold text-slate-800">
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
