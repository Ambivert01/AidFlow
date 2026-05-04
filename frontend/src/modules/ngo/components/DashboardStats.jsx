export default function DashboardStats({ overview }) {
  if (!overview) {
    return (
      <div className="grid-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="stat-card skeleton"
            style={{ height: "100px" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid-4">
      <div className="stat-card">
        <div className="stat-card-label">Total Campaigns</div>
        <div className="stat-card-value text-primary">
          {overview.totalCampaigns || 0}
        </div>
        <div className="stat-card-sub">
          {overview.activeCampaigns || 0} active •{" "}
          {overview.completedCampaigns || 0} completed
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card-label">Total Beneficiaries</div>
        <div className="stat-card-value text-green-600">
          {overview.totalBeneficiaries || 0}
        </div>
        <div className="stat-card-sub">
          {overview.pendingApprovalCampaigns || 0} campaigns pending approval
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card-label">Funds Received</div>
        <div className="stat-card-value tracking-tight">
          ₹{(overview.totalFundsReceived || 0).toLocaleString("en-IN")}
        </div>
        <div className="stat-card-sub">
          ₹{(overview.totalFundsAllocated || 0).toLocaleString("en-IN")}{" "}
          allocated
        </div>
      </div>

      <div className="stat-card highlight-orange">
        <div className="stat-card-label">Pending Proofs</div>
        <div className="stat-card-value">
          {overview.pendingProofsCount || 0}
        </div>
        <div className="stat-card-sub">
          ₹{(overview.totalFundsSpent || 0).toLocaleString("en-IN")} spent
        </div>
      </div>
    </div>
  );
}
