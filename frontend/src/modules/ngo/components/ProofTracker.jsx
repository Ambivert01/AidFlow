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
      color: "text-[var(--color-caution)]",
      bg: "bg-[var(--color-caution-light)]",
    },
    {
      label: "AI Verified",
      count: proofs.aiVerified,
      color: "text-[var(--color-signal)]",
      bg: "bg-[var(--color-signal-light)]",
    },
    {
      label: "Approved",
      count: proofs.approved,
      color: "text-[var(--color-verified)]",
      bg: "bg-[var(--color-verified-light)]",
    },
    {
      label: "Rejected",
      count: proofs.rejected,
      color: "text-[var(--color-alert)]",
      bg: "bg-[var(--color-alert-light)]",
    },
    {
      label: "Manual Review",
      count: proofs.manualReview,
      color: "text-[var(--color-info)]",
      bg: "bg-[var(--color-info)]/10",
    },
  ];

  return (
    <div className="card shadow-sm border-0">
      <div className="row-between mb-4">
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Proof Tracker</h2>
        <div className="text-right">
          <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold">
            Total Proofs
          </div>
          <div className="text-xl font-bold text-primary">
            {proofs.total || 0}
          </div>
        </div>
      </div>

      {proofs.total === 0 ? (
        <div className="py-12 text-center bg-[var(--color-paper-alt)] rounded-lg">
          <span className="text-3xl block mb-2">📸</span>
          <p className="text-sm font-bold text-[var(--color-steel)]">No proofs uploaded</p>
          <p className="text-xs text-[var(--color-steel)] mt-1">
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
                <div className="text-[10px] uppercase font-bold text-[var(--color-steel)] mb-1">
                  {item.label}
                </div>
                <div className={`text-2xl font-bold ${item.color}`}>
                  {item.count || 0}
                </div>
              </div>
            ))}
          </div>

          {proofs.highRisk > 0 && (
            <div className="p-3 bg-[var(--color-alert-light)] border border-[var(--color-alert-light)] rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="text-[11px] font-bold text-[var(--color-alert-dark)] uppercase">
                    High Risk Proofs
                  </div>
                  <div className="text-sm text-[var(--color-alert)]">
                    {proofs.highRisk} proofs with fraud probability &gt; 0.7
                  </div>
                </div>
              </div>
            </div>
          )}

          {proofs.byType && Object.keys(proofs.byType).length > 0 && (
            <div className="mb-4">
              <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
                Distribution by Type
              </div>
              <div className="grid-2 gap-2">
                {Object.entries(proofs.byType).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex justify-between items-center text-[12px] p-2 bg-[var(--color-paper-alt)] rounded"
                  >
                    <span className="text-[var(--color-ink)] font-medium">{type}</span>
                    <span className="font-bold text-[var(--color-ink)]">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {proofs.recent && proofs.recent.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-paper-alt)]">
              <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
                Recent Uploads
              </div>
              <div className="space-y-2">
                {proofs.recent.map((proof) => (
                  <div
                    key={proof._id}
                    className="p-2 bg-[var(--color-paper-alt)] rounded hover:bg-[var(--color-paper-alt)] transition-colors"
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
                          <div className="text-[12px] font-bold text-[var(--color-ink)]">
                            {proof.proofType}
                          </div>
                          <div className="text-[10px] text-[var(--color-steel)]">
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
                          proof.status === "APPROVED" || proof.status === "AI_VERIFIED"
                            ? "bg-[var(--color-verified-light)] text-[var(--color-verified-dark)]"
                            : proof.status === "REJECTED" || proof.status === "FLAGGED"
                              ? "bg-[var(--color-alert-light)] text-[var(--color-alert-dark)]"
                              : ["UPLOADED", "UNDER_VALIDATION", "MANUAL_REVIEW"].includes(proof.status)
                                ? "bg-[var(--color-signal-light)] text-[var(--color-signal-dark)]"
                                : "bg-[var(--color-paper-alt)] text-[var(--color-ink)]"
                        }`}
                      >
                        {proof.status}
                      </span>
                    </div>
                    {proof.rejectionReason && (
                      <div className="mt-1 text-[10px] text-[var(--color-alert)] bg-[var(--color-alert-light)] p-1 rounded">
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
