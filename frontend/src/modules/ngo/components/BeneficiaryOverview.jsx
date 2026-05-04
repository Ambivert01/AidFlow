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
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Pending",
      count: beneficiaries.pending,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Rejected",
      count: beneficiaries.rejected,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Manual Review",
      count: beneficiaries.manualReview,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Fraud Flagged",
      count: beneficiaries.fraudFlagged,
      color: "text-red-700",
      bg: "bg-red-100",
    },
    {
      label: "High Risk",
      count: beneficiaries.highRisk,
      color: "text-orange-700",
      bg: "bg-orange-100",
    },
  ];

  return (
    <div className="card shadow-sm border-0">
      <div className="row-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">
          Beneficiary Overview
        </h2>
        <div className="text-2xl font-bold text-primary">
          {beneficiaries.total || 0}
        </div>
      </div>

      {beneficiaries.total === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-lg">
          <span className="text-3xl block mb-2">👥</span>
          <p className="text-sm font-bold text-slate-600">
            No beneficiaries registered
          </p>
          <p className="text-xs text-slate-400 mt-1">
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
                <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">
                  {item.label}
                </div>
                <div className={`text-2xl font-bold ${item.color}`}>
                  {item.count || 0}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(beneficiaries.byStatus || {}).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-600 uppercase mb-2">
                Distribution by Status
              </div>
              <div className="space-y-2">
                {Object.entries(beneficiaries.byStatus).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="flex justify-between items-center text-[12px]"
                    >
                      <span className="text-slate-700 font-medium">
                        {status}
                      </span>
                      <span className="font-bold text-slate-800">{count}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {Object.keys(beneficiaries.byAIDecision || {}).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-600 uppercase mb-2">
                Distribution by AI Decision
              </div>
              <div className="space-y-2">
                {Object.entries(beneficiaries.byAIDecision).map(
                  ([decision, count]) => (
                    <div
                      key={decision}
                      className="flex justify-between items-center text-[12px]"
                    >
                      <span className="text-slate-700 font-medium">
                        {decision}
                      </span>
                      <span className="font-bold text-slate-800">{count}</span>
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
