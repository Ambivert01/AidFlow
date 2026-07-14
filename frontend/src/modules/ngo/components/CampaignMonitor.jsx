import { Link } from "react-router-dom";

const STATUS_BADGE = {
  ACTIVE: "badge-green",
  DRAFT: "badge-gray",
  PAUSED: "badge-orange",
  CLOSED: "badge-gray",
  COMPLETED: "badge-teal",
  AUDIT_FINALIZED: "badge-teal",
};

export default function CampaignMonitor({ campaigns }) {
  if (!campaigns) {
    return (
      <div className="card shadow-sm border-0">
        <div className="skeleton skeleton-title mb-4" />
        <div className="grid-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "80px" }} />
          ))}
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="card shadow-sm border-0">
        <h2 className="text-lg font-bold text-[var(--color-ink)] mb-4">
          Campaign Monitor
        </h2>
        <div className="py-12 text-center border-2 border-dashed border-[var(--color-paper-alt)] rounded-xl">
          <span className="text-3xl block mb-2">📋</span>
          <p className="text-[var(--color-steel)] text-sm font-bold">No campaigns found</p>
          <p className="text-xs text-[var(--color-steel)] mt-1">
            Create your first campaign to get started
          </p>
          <Link
            to="/ngo/campaigns/create"
            className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors"
          >
            Create Campaign
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="row-between mb-4">
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Campaign Monitor</h2>
        <Link
          to="/ngo"
          className="text-primary text-xs font-bold hover:underline"
        >
          View All →
        </Link>
      </div>

      <div className="grid-1 gap-3">
        {campaigns.map((campaign) => {
          const fundingProgress =
            campaign.targetAmount > 0
              ? Math.round(
                  (campaign.totalDonated / campaign.targetAmount) * 100,
                )
              : 0;
          const isHighRisk = campaign.aiRiskScore > 70;

          return (
            <div
              key={campaign._id}
              className="p-4 border border-[var(--color-paper-alt)] rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3 items-start flex-1">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl ${
                      campaign.status === "ACTIVE"
                        ? "bg-[var(--color-verified-light)]"
                        : "bg-[var(--color-paper-alt)]"
                    }`}
                  >
                    {campaign.disasterType === "FLOOD"
                      ? "🌊"
                      : campaign.disasterType === "EARTHQUAKE"
                        ? "🌋"
                        : "📦"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/ngo/campaigns/${campaign._id}`}
                        className="font-bold text-[var(--color-ink)] text-[15px] hover:text-primary"
                      >
                        {campaign.title}
                      </Link>
                      {isHighRisk && (
                        <span className="px-2 py-0.5 bg-[var(--color-alert-light)] text-[var(--color-alert-dark)] text-[9px] font-bold uppercase rounded">
                          High Risk
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--color-steel)] uppercase font-bold tracking-widest">
                      {campaign.disasterType} •{" "}
                      {campaign.location?.state || "N/A"}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter ${STATUS_BADGE[campaign.status] || "badge-gray"}`}
                >
                  {campaign.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold mb-1">
                    Funding Progress
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[var(--color-paper-alt)] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[var(--color-ink)]">
                      {fundingProgress}%
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--color-steel)] mt-1">
                    ₹{campaign.totalDonated?.toLocaleString("en-IN") || 0} / ₹
                    {campaign.targetAmount?.toLocaleString("en-IN") || 0}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold mb-1">
                      Beneficiaries
                    </div>
                    <div className="text-[13px] font-bold text-[var(--color-ink)]">
                      {campaign.beneficiaryCount || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold mb-1">
                      Transparency
                    </div>
                    <div className="text-[13px] font-bold text-[var(--color-verified)]">
                      {campaign.transparencyScore || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold mb-1">
                      Risk Score
                    </div>
                    <div
                      className={`text-[13px] font-bold ${isHighRisk ? "text-[var(--color-alert)]" : "text-[var(--color-ink)]"}`}
                    >
                      {campaign.aiRiskScore || 0}
                    </div>
                  </div>
                </div>
              </div>

              {(campaign.pausedReason || campaign.closedReason) && (
                <div className="mt-2 p-2 bg-[var(--color-signal-light)] border border-[var(--color-signal-light)] rounded text-[11px] text-[var(--color-signal-dark)]">
                  <span className="font-bold">Reason: </span>
                  {campaign.pausedReason || campaign.closedReason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
