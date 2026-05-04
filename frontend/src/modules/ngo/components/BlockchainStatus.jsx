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
        <h2 className="text-lg font-bold text-slate-800">Blockchain Status</h2>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase font-bold">
            Network
          </div>
          <div className="text-sm font-bold text-slate-700">
            {blockchain.networkName || "N/A"}
          </div>
        </div>
      </div>

      {blockchain.totalAnchored === 0 && blockchain.pendingAnchor === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-lg">
          <span className="text-3xl block mb-2">⛓️</span>
          <p className="text-sm font-bold text-slate-600">
            No blockchain transactions
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Transactions will be anchored automatically
          </p>
        </div>
      ) : (
        <>
          {blockchain.delayWarning && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="text-[11px] font-bold text-orange-700 uppercase">
                    Anchoring Delayed
                  </div>
                  <div className="text-sm text-orange-600">
                    Blockchain anchoring delayed beyond 24 hours
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid-2 gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">
                Total Anchored
              </div>
              <div className="text-2xl font-bold text-green-600">
                {blockchain.totalAnchored || 0}
              </div>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">
                Pending Anchor
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {blockchain.pendingAnchor || 0}
              </div>
            </div>
          </div>

          {blockchain.lastAnchorTimestamp && (
            <div className="mb-4 p-2 bg-slate-50 rounded text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">
                Last Anchor
              </div>
              <div className="text-[12px] text-slate-700 font-medium">
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
              <div className="text-[11px] font-bold text-slate-600 uppercase mb-2">
                Anchored by Campaign
              </div>
              <div className="space-y-1">
                {blockchain.byCampaign.map((campaign) => (
                  <div
                    key={campaign.campaignId}
                    className="flex justify-between items-center text-[12px] p-2 bg-slate-50 rounded"
                  >
                    <span className="text-slate-700 font-medium">Campaign</span>
                    <span className="font-bold text-slate-800">
                      {campaign.anchoredCount} txns
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {blockchain.recentTransactions &&
            blockchain.recentTransactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-600 uppercase mb-2">
                  Recent Transactions
                </div>
                <div className="space-y-2">
                  {blockchain.recentTransactions.map((tx, index) => (
                    <div
                      key={index}
                      className="p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <div className="text-[11px] font-mono text-slate-700 truncate">
                            {tx.txHash || "N/A"}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Block #{tx.blockNumber || "N/A"}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 ml-2">
                          {tx.anchoredAt &&
                            new Date(tx.anchoredAt).toLocaleDateString(
                              "en-IN",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                        </div>
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
