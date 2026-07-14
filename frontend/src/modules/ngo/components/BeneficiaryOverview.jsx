export default function BeneficiaryOverview({ beneficiaries }) {
  if (!beneficiaries) {
    return (
      <div className="card shadow-sm border-0">
        <div className="skeleton skeleton-title mb-4" />
        <div className="grid-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "60px" }} />
          ))}
        </div>
      </div>
    );
  }

  const statusItems = [
    {
      label: "Approved",
      count: beneficiaries.approved,
      color: "text-[var(--color-verified)]",
      bg: "bg-[var(--color-verified-light)]",
    },
    {
      label: "Pending",
      count: beneficiaries.pending,
      color: "text-[var(--color-signal)]",
      bg: "bg-[var(--color-signal-light)]",
    },
    {
      label: "Rejected",
      count: beneficiaries.rejected,
      color: "text-[var(--color-alert)]",
      bg: "bg-[var(--color-alert-light)]",
    },
    {
      label: "Manual Review",
      count: beneficiaries.manualReview,
      color: "text-[var(--color-signal)]",
      bg: "bg-[var(--color-signal-light)]",
    },
    {
      label: "Fraud Flagged",
      count: beneficiaries.fraudFlagged,
      color: "text-[var(--color-alert-dark)]",
      bg: "bg-[var(--color-alert-light)]",
    },
    {
      label: "High Risk",
      count: beneficiaries.highRisk,
      color: "text-[var(--color-signal-dark)]",
      bg: "bg-[var(--color-signal-light)]",
    },
  ];

  return (
    <div className="card shadow-sm border-0">
      <div className="row-between mb-4">
        <h2 className="text-lg font-bold text-[var(--color-ink)]">
          Beneficiary Overview
        </h2>
        <div className="text-2xl font-bold text-primary">
          {beneficiaries.total || 0}
        </div>
      </div>

      {beneficiaries.total === 0 ? (
        <div className="py-12 text-center bg-[var(--color-paper-alt)] rounded-lg">
          <span className="text-3xl block mb-2">👥</span>
          <p className="text-sm font-bold text-[var(--color-steel)]">
            No beneficiaries registered
          </p>
          <p className="text-xs text-[var(--color-steel)] mt-1">
            Register beneficiaries to start tracking
          </p>
        </div>
      ) : (
        <>
          <div className="grid-3 gap-3 mb-4">
            {statusItems.map((item) => (
              <div
                key={item.label}
                className={`p-3 rounded-lg ${item.bg} border border-opacity-20`}
              >
                <div className="text-[10px] uppercase font-bold text-[var(--color-steel)] mb-1">
                  {item.label}
                </div>
                <div className={`text-2xl font-bold ${item.color}`}>
                  {item.count || 0}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(beneficiaries.byStatus || {}).length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-paper-alt)]">
              <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
                Distribution by Status
              </div>
              <div className="space-y-2">
                {Object.entries(beneficiaries.byStatus).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="flex justify-between items-center text-[12px]"
                    >
                      <span className="text-[var(--color-ink)] font-medium">
                        {status}
                      </span>
                      <span className="font-bold text-[var(--color-ink)]">{count}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {Object.keys(beneficiaries.byAIDecision || {}).length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-paper-alt)]">
              <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
                Distribution by AI Decision
              </div>
              <div className="space-y-2">
                {Object.entries(beneficiaries.byAIDecision).map(
                  ([decision, count]) => (
                    <div
                      key={decision}
                      className="flex justify-between items-center text-[12px]"
                    >
                      <span className="text-[var(--color-ink)] font-medium">
                        {decision}
                      </span>
                      <span className="font-bold text-[var(--color-ink)]">{count}</span>
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
