export default function BlockchainStatus({ blockchain }) {
  if (!blockchain) {
    return (
      <div className="card shadow-sm border-0">
        <div className="skeleton skeleton-title mb-4" />
        <div className="grid-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: "60px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="row-between mb-4">
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Blockchain Status</h2>
        <div className="text-right">
          <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold">
            Network
          </div>
          <div className="text-sm font-bold text-[var(--color-ink)]">
            {blockchain.networkName || "N/A"}
          </div>
        </div>
      </div>

      {blockchain.totalAnchored === 0 && blockchain.pendingAnchor === 0 ? (
        <div className="py-12 text-center bg-[var(--color-paper-alt)] rounded-lg">
          <span className="text-3xl block mb-2">⛓️</span>
          <p className="text-sm font-bold text-[var(--color-steel)]">
            No blockchain transactions
          </p>
          <p className="text-xs text-[var(--color-steel)] mt-1">
            Transactions will be anchored automatically
          </p>
        </div>
      ) : (
        <>
          {blockchain.delayWarning && (
            <div className="mb-4 p-3 bg-[var(--color-signal-light)] border border-[var(--color-signal-light)] rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="text-[11px] font-bold text-[var(--color-signal-dark)] uppercase">
                    Anchoring Delayed
                  </div>
                  <div className="text-sm text-[var(--color-signal)]">
                    Blockchain anchoring delayed beyond 24 hours
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid-2 gap-3 mb-4">
            <div className="p-3 bg-[var(--color-verified-light)] rounded-lg border border-[var(--color-verified-light)]">
              <div className="text-[10px] uppercase font-bold text-[var(--color-steel)] mb-1">
                Total Anchored
              </div>
              <div className="text-2xl font-bold text-[var(--color-verified)]">
                {blockchain.totalAnchored || 0}
              </div>
            </div>

            <div className="p-3 bg-[var(--color-signal-light)] rounded-lg border border-[var(--color-signal-light)]">
              <div className="text-[10px] uppercase font-bold text-[var(--color-steel)] mb-1">
                Pending Anchor
              </div>
              <div className="text-2xl font-bold text-[var(--color-signal)]">
                {blockchain.pendingAnchor || 0}
              </div>
            </div>
          </div>

          {blockchain.lastAnchorTimestamp && (
            <div className="mb-4 p-2 bg-[var(--color-paper-alt)] rounded text-center">
              <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold">
                Last Anchor
              </div>
              <div className="text-[12px] text-[var(--color-ink)] font-medium">
                {new Date(blockchain.lastAnchorTimestamp).toLocaleString(
                  "en-IN",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </div>
            </div>
          )}

          {blockchain.byCampaign && blockchain.byCampaign.length > 0 && (
            <div className="mb-4">
              <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
                Anchored by Campaign
              </div>
              <div className="space-y-1">
                {blockchain.byCampaign.map((campaign) => (
                  <div
                    key={campaign.campaignId}
                    className="flex justify-between items-center text-[12px] p-2 bg-[var(--color-paper-alt)] rounded"
                  >
                    <span className="text-[var(--color-ink)] font-medium">Campaign</span>
                    <span className="font-bold text-[var(--color-ink)]">
                      {campaign.anchoredCount} txns
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {blockchain.recentTransactions &&
            blockchain.recentTransactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--color-paper-alt)]">
                <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
                  Recent Transactions
                </div>
                <div className="space-y-2">
                  {blockchain.recentTransactions.map((tx, index) => (
                    <div
                      key={index}
                      className="hash-display"
                      style={{ marginBottom: "8px" }}
                    >
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {tx.txHash || "N/A"}
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right", color: "rgba(255,255,255,0.4)" }}>
                        <div>#{tx.blockNumber || "N/A"}</div>
                        {tx.anchoredAt && (
                          <div>
                            {new Date(tx.anchoredAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        )}
                      </div>
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
