export default function DashboardStats({ overview }) {
  if (!overview) {
    return (
      <div className="grid-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="stat-card skeleton"
            style={{ height: "120px" }}
          />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Total Campaigns",
      value: overview.totalCampaigns || 0,
      sub: `${overview.activeCampaigns || 0} active • ${overview.completedCampaigns || 0} completed`,
      color: "var(--color-signal)",
    },
    {
      label: "Total Beneficiaries",
      value: overview.totalBeneficiaries || 0,
      sub: `${overview.pendingApprovalCampaigns || 0} campaigns pending`,
      color: "var(--color-verified)",
    },
    {
      label: "Funds Received",
      value: `₹${(overview.totalFundsReceived || 0).toLocaleString("en-IN")}`,
      sub: `₹${(overview.totalFundsAllocated || 0).toLocaleString("en-IN")} allocated`,
      color: "var(--color-caution)",
    },
    {
      label: "Funds Spent",
      value: `₹${(overview.totalFundsSpent || 0).toLocaleString("en-IN")}`,
      sub: `of ₹${(overview.totalFundsAllocated || 0).toLocaleString("en-IN")} allocated`,
      color: "var(--color-alert)",
    },
  ];

  return (
    <div className="grid-4">
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className="stat-card hover-lift animate-fade-up"
          style={{
            borderTopColor: stat.color,
            animationDelay: `${idx * 0.1}s`,
          }}
        >
          <div className="stat-card-label">{stat.label}</div>
          <div className="stat-card-value" style={{ color: stat.color }}>
            {stat.value}
          </div>
          <div className="stat-card-sub">{stat.sub}</div>
        </div>
      ))}
    </div>
  );
}
