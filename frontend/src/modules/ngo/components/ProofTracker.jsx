export default function ProofTracker({ proofs }) {
  if (!proofs) {
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
      label: "Pending",
      count: proofs.pending,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "AI Verified",
      count: proofs.aiVerified,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Approved",
      count: proofs.approved,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Rejected",
      count: proofs.rejected,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Manual Review",
      count: proofs.manualReview,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="card shadow-sm border-0">
      <div className="row-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Proof Tracker</h2>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase font-bold">
            Total Proofs
          </div>
          <div className="text-xl font-bold text-primary">
            {proofs.total || 0}
          </div>
        </div>
      </div>

      {proofs.total === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-lg">
          <span className="text-3xl block mb-2">📸</span>
          <p className="text-sm font-bold text-slate-600">No proofs uploaded</p>
          <p className="text-xs text-slate-400 mt-1">
            Beneficiaries will upload proofs after spending
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

          {proofs.highRisk > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="text-[11px] font-bold text-red-700 uppercase">
                    High Risk Proofs
                  </div>
                  <div className="text-sm text-red-600">
                    {proofs.highRisk} proofs with fraud probability &gt; 0.7
                  </div>
                </div>
              </div>
            </div>
          )}

          {proofs.byType && Object.keys(proofs.byType).length > 0 && (
            <div className="mb-4">
              <div className="text-[11px] font-bold text-slate-600 uppercase mb-2">
                Distribution by Type
              </div>
              <div className="grid-2 gap-2">
                {Object.entries(proofs.byType).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex justify-between items-center text-[12px] p-2 bg-slate-50 rounded"
                  >
                    <span className="text-slate-700 font-medium">{type}</span>
                    <span className="font-bold text-slate-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {proofs.recent && proofs.recent.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-600 uppercase mb-2">
                Recent Uploads
              </div>
              <div className="space-y-2">
                {proofs.recent.map((proof) => (
                  <div
                    key={proof._id}
                    className="p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {proof.proofType === "RECEIPT"
                            ? "🧾"
                            : proof.proofType === "PHOTO"
                              ? "📸"
                              : "📄"}
                        </span>
                        <div>
                          <div className="text-[12px] font-bold text-slate-800">
                            {proof.proofType}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(proof.capturedAt).toLocaleDateString(
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
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          proof.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : proof.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : proof.status === "PENDING"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {proof.status}
                      </span>
                    </div>
                    {proof.rejectionReason && (
                      <div className="mt-1 text-[10px] text-red-600 bg-red-50 p-1 rounded">
                        <span className="font-bold">Rejected: </span>
                        {proof.rejectionReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
