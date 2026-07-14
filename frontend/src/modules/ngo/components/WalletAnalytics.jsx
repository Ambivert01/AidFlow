export default function WalletAnalytics({ wallets }) {
  if (!wallets) {
    return (
      <div className="card shadow-sm border-0">
        <div className="skeleton skeleton-title mb-4" />
        <div className="grid-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "60px" }} />
          ))}
        </div>
      </div>
    );
  }

  const utilizationRate =
    wallets.totalAllocated > 0
      ? Math.round((wallets.totalSpent / wallets.totalAllocated) * 100)
      : 0;

  return (
    <div className="card shadow-sm border-0">
      <div className="row-between mb-4">
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Wallet Analytics</h2>
        <div className="text-right">
          <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold">
            Total Wallets
          </div>
          <div className="text-xl font-bold text-primary">
            {wallets.totalCreated || 0}
          </div>
        </div>
      </div>

      {wallets.totalCreated === 0 ? (
        <div className="py-12 text-center bg-[var(--color-paper-alt)] rounded-lg">
          <span className="text-3xl block mb-2">💳</span>
          <p className="text-sm font-bold text-[var(--color-steel)]">No wallets created</p>
          <p className="text-xs text-[var(--color-steel)] mt-1">
            Allocate funds to beneficiaries to create wallets
          </p>
        </div>
      ) : (
        <>
          <div className="grid-2 gap-3 mb-4">
            <div className="p-3 bg-[var(--color-signal-light)] rounded-lg border border-[var(--color-signal-light)]">
              <div className="text-[10px] uppercase font-bold text-[var(--color-steel)] mb-1">
                Total Allocated
              </div>
              <div className="text-xl font-bold text-[var(--color-signal)]">
                ₹{(wallets.totalAllocated || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3 bg-[var(--color-verified-light)] rounded-lg border border-[var(--color-verified-light)]">
              <div className="text-[10px] uppercase font-bold text-[var(--color-steel)] mb-1">
                Total Spent
              </div>
              <div className="text-xl font-bold text-[var(--color-verified)]">
                ₹{(wallets.totalSpent || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3 bg-[var(--color-signal-light)] rounded-lg border border-[var(--color-signal)]/20">
              <div className="text-[10px] uppercase font-bold text-[var(--color-steel)] mb-1">
                Remaining Balance
              </div>
              <div className="text-xl font-bold text-[var(--color-signal)]">
                ₹{(wallets.remainingBalance || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3 bg-[var(--color-paper-alt)] rounded-lg border border-[var(--color-paper-alt)]">
              <div className="text-[10px] uppercase font-bold text-[var(--color-steel)] mb-1">
                Utilization Rate
              </div>
              <div className="text-xl font-bold text-[var(--color-ink)]">
                {utilizationRate}%
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
              Wallet Status
            </div>
            <div className="grid-3 gap-2">
              <div className="text-center p-2 bg-[var(--color-verified-light)] rounded">
                <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold">
                  Active
                </div>
                <div className="text-lg font-bold text-[var(--color-verified)]">
                  {wallets.active || 0}
                </div>
              </div>
              <div className="text-center p-2 bg-[var(--color-signal-light)] rounded">
                <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold">
                  Suspended
                </div>
                <div className="text-lg font-bold text-[var(--color-signal)]">
                  {wallets.suspended || 0}
                </div>
              </div>
              <div className="text-center p-2 bg-[var(--color-paper-alt)] rounded">
                <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold">
                  Expired
                </div>
                <div className="text-lg font-bold text-[var(--color-steel)]">
                  {wallets.expired || 0}
                </div>
              </div>
            </div>
          </div>

          {wallets.highRisk > 0 && (
            <div className="p-3 bg-[var(--color-alert-light)] border border-[var(--color-alert-light)] rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="text-[11px] font-bold text-[var(--color-alert-dark)] uppercase">
                    High Risk Wallets
                  </div>
                  <div className="text-sm text-[var(--color-alert)]">
                    {wallets.highRisk} wallets flagged with risk score &gt; 70
                  </div>
                </div>
              </div>
            </div>
          )}

          {wallets.byCampaign && wallets.byCampaign.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-paper-alt)]">
              <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
                Allocation by Campaign
              </div>
              <div className="space-y-2">
                {wallets.byCampaign.map((campaign) => (
                  <div
                    key={campaign.campaignId}
                    className="flex justify-between items-center text-[12px] p-2 bg-[var(--color-paper-alt)] rounded"
                  >
                    <span className="text-[var(--color-ink)] font-medium truncate flex-1">
                      {campaign.campaignTitle}
                    </span>
                    <div className="text-right ml-2">
                      <div className="font-bold text-[var(--color-ink)]">
                        ₹{campaign.allocated?.toLocaleString("en-IN") || 0}
                      </div>
                      <div className="text-[10px] text-[var(--color-steel)]">
                        ₹{campaign.spent?.toLocaleString("en-IN") || 0} spent
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {wallets.byCategory && Object.keys(wallets.byCategory).length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-paper-alt)]">
              <div className="text-[11px] font-bold text-[var(--color-steel)] uppercase mb-2">
                Spending by Category
              </div>
              <div className="space-y-2">
                {Object.entries(wallets.byCategory).map(
                  ([category, amount]) => (
                    <div
                      key={category}
                      className="flex justify-between items-center text-[12px]"
                    >
                      <span className="text-[var(--color-ink)] font-medium">
                        {category}
                      </span>
                      <span className="font-bold text-[var(--color-ink)]">
                        ₹{amount?.toLocaleString("en-IN") || 0}
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
