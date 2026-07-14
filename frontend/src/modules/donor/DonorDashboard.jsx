import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import FilterPanel from "./components/FilterPanel";
import CampaignCard from "./components/CampaignCard";
import SortDropdown from "./components/SortDropdown";
import Donate from "./Donate";

// Simple debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const STATUS_BADGE = {
  CREATED: "badge-gray",
  PENDING_NGO_REVIEW: "badge-yellow",
  NGO_APPROVED: "badge-blue",
  HIGH_RISK_ESCALATED: "badge-orange",
  APPROVED_BY_GOVT: "badge-green",
  REJECTED_BY_GOVT: "badge-red",
  WALLET_CREATING: "badge-blue",
  READY_FOR_USE: "badge-green",
  ELIGIBILITY_FAILED: "badge-red",
  REJECTED: "badge-red",
  AUDIT_FINALIZED: "badge-teal",
};

const STATUS_LABELS = {
  CREATED: "Created",
  PENDING_NGO_REVIEW: "Awaiting NGO",
  NGO_APPROVED: "NGO Approved",
  HIGH_RISK_ESCALATED: "Escalated to Govt",
  APPROVED_BY_GOVT: "Govt Approved",
  REJECTED_BY_GOVT: "Govt Rejected",
  WALLET_CREATING: "Wallet Creating",
  READY_FOR_USE: "Active — Aid Disbursed",
  ELIGIBILITY_FAILED: "Eligibility Failed",
  REJECTED: "Rejected",
  AUDIT_FINALIZED: "Finalized ✓",
};

export default function DonorDashboard() {
  const [stats, setStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Enhanced campaign discovery state
  const [campaigns, setCampaigns] = useState([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState("recent");
  const [pagination, setPagination] = useState({ page: 1, limit: 12 });
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [showCampaigns, setShowCampaigns] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Campaign discovery function
  const discoverCampaigns = useCallback(
    async (currentFilters, currentSort, currentPagination) => {
      setCampaignLoading(true);
      try {
        const params = new URLSearchParams();

        // Add filters to params
        Object.entries(currentFilters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v));
            } else {
              params.append(key, value);
            }
          }
        });

        // Add sort and pagination
        params.append("sort", currentSort);
        params.append("page", currentPagination.page);
        params.append("limit", currentPagination.limit);

        const response = await api.get(
          `/campaigns/discover?${params.toString()}`,
        );
        const result = response.data?.data || response.data;

        setCampaigns(result.campaigns || []);
        setTotalCampaigns(result.pagination?.total || 0);
        setPagination(result.pagination || currentPagination);
      } catch (error) {
        console.error("Error discovering campaigns:", error);
        setCampaigns([]);
        setTotalCampaigns(0);
      } finally {
        setCampaignLoading(false);
      }
    },
    [], // Empty deps is fine - we pass all values as parameters
  );

  // Debounced version - create once and reuse
  const debouncedDiscoverCampaigns = useMemo(
    () =>
      debounce((currentFilters, currentSort, currentPagination) => {
        discoverCampaigns(currentFilters, currentSort, currentPagination);
      }, 800), // Increased to 800ms for better debouncing
    [discoverCampaigns],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, donationsRes] = await Promise.all([
          api.get("/donations/dashboard"),
          api.get("/donations/my"),
        ]);
        setStats(statsRes.data?.data || statsRes.data);
        setDonations(donationsRes.data?.data || donationsRes.data || []);
      } catch (err) {
        console.error("DONOR DASHBOARD ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load campaigns when filters, sort, or pagination change
  useEffect(() => {
    if (showCampaigns) {
      debouncedDiscoverCampaigns(filters, sort, pagination);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, pagination, showCampaigns]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  // Handle sort changes
  const handleSortChange = useCallback((newSort) => {
    setSort(newSort);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  // Handle filter reset
  const handleFilterReset = useCallback(() => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handle campaign donation
  const handleCampaignDonate = useCallback((campaign) => {
    setSelectedCampaign(campaign);
  }, []);

  // Handle donation completion
  const handleDonationComplete = useCallback(() => {
    setSelectedCampaign(null);
    // Refresh donations
    api
      .get("/donations/my")
      .then((res) => setDonations(res.data?.data || res.data || []))
      .catch(console.error);
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Toggle campaigns view
  const toggleCampaignsView = useCallback(() => {
    setShowCampaigns((prev) => !prev);
  }, []);

  if (loading) {
    return (
      <div className="stack-lg">
        <div className="page-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: "30%" }} />
        </div>
        <div className="card skeleton" style={{ height: "80px" }} />
        <div className="grid-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="stat-card skeleton"
              style={{ height: "100px" }}
            />
          ))}
        </div>
        <div
          className="card skeleton"
          style={{ height: "200px", marginTop: "var(--space-6)" }}
        />
        <div
          className="card skeleton"
          style={{ height: "400px", marginTop: "var(--space-6)" }}
        />
      </div>
    );
  }

  return (
    <div className="stack-lg">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Donor Dashboard</h1>
        <p className="page-subtitle">
          Track your donations and see how your contributions are being used.
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid-4">
          {[
            {
              label: "Total Donated",
              value: `₹${(stats.totalDonated || 0).toLocaleString("en-IN")}`,
              sub: "Across all donations",
            },
            {
              label: "Total Donations",
              value: stats.totalDonations || 0,
              sub: "All records",
            },
            {
              label: "Active Disbursements",
              value: stats.activeDonations || 0,
              sub: "Aid in use",
            },
            {
              label: "Campaigns Supported",
              value: stats.campaignsSupported || 0,
              sub: "Unique campaigns",
            },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Browse + Donate Section */}
      <div className="card">
        <div className="row-between" style={{ marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700" }}>
            Browse Active Campaigns
          </h2>
          <div className="flex items-center space-x-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowFilters(!showFilters)}
              disabled={!showCampaigns}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={toggleCampaignsView}
            >
              {showCampaigns ? "Hide" : "Show Campaigns"}
            </button>
          </div>
        </div>

        {showCampaigns && (
          <>
            {/* Filter Panel */}
            {showFilters && (
              <div style={{ marginBottom: "var(--space-4)" }}>
                <FilterPanel
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onReset={handleFilterReset}
                  isLoading={campaignLoading}
                />
              </div>
            )}

            {/* Sort and Results Header */}
            <div
              className="row-between"
              style={{
                marginBottom: "var(--space-4)",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1, maxWidth: "300px" }}>
                <SortDropdown
                  currentSort={sort}
                  onSortChange={handleSortChange}
                  disabled={campaignLoading}
                />
              </div>
              <div className="text-sm text-[var(--color-steel)]">
                {campaignLoading
                  ? "Loading campaigns..."
                  : `${totalCampaigns} campaign${totalCampaigns !== 1 ? "s" : ""} found`}
              </div>
            </div>

            {/* Campaign Grid */}
            {campaignLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-[var(--color-paper-alt)] animate-pulse rounded-lg"
                    style={{ height: "300px" }}
                  />
                ))}
              </div>
            ) : campaigns.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign._id}
                      campaign={campaign}
                      onDonate={handleCampaignDonate}
                      showTrustScore={true}
                      showFundingProgress={true}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1 || campaignLoading}
                      className="btn btn-ghost btn-sm"
                    >
                      Previous
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, pagination.pages) },
                        (_, i) => {
                          const pageNum = i + 1;
                          const isCurrentPage = pageNum === pagination.page;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              disabled={campaignLoading}
                              className={`btn btn-sm ${
                                isCurrentPage ? "btn-primary" : "btn-ghost"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}
                      {pagination.pages > 5 && (
                        <>
                          <span className="text-[var(--color-steel)]">...</span>
                          <button
                            onClick={() => handlePageChange(pagination.pages)}
                            disabled={campaignLoading}
                            className="btn btn-ghost btn-sm"
                          >
                            {pagination.pages}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={
                        pagination.page >= pagination.pages || campaignLoading
                      }
                      className="btn btn-ghost btn-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No campaigns found</div>
                <div className="empty-state-desc">
                  Try adjusting your filters or search criteria to find
                  campaigns.
                </div>
                {Object.keys(filters).length > 0 && (
                  <button
                    onClick={handleFilterReset}
                    className="btn btn-primary btn-sm mt-3"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Inline donation form */}
            {selectedCampaign && (
              <div style={{ marginTop: "var(--space-6)" }}>
                <Donate
                  campaign={selectedCampaign}
                  onClose={handleDonationComplete}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* My Donations */}
      <div className="card">
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "700",
            marginBottom: "var(--space-4)",
          }}
        >
          My Donation History
        </h2>
        {donations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-title">No donations yet</div>
            <div className="empty-state-desc">
              Browse campaigns above and make your first contribution.
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>AI Decision</th>
                  <th>Audit</th>
                  <th>Date</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.donationId}>
                    <td>
                      <div style={{ fontWeight: "600" }}>
                        {d.campaign?.title || "—"}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {d.campaign?.disasterType}
                      </div>
                    </td>
                    <td style={{ fontWeight: "700" }}>
                      ₹{d.amount?.toLocaleString("en-IN")}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_BADGE[d.status] || "badge-gray"}`}
                      >
                        {STATUS_LABELS[d.status] || d.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px" }}>{d.aiDecision || "—"}</td>
                    <td>
                      {d.auditFinalized ? (
                        <a
                          href={`/public-audit?job=${d.donationId}`}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: "11px" }}
                        >
                          ✓ Verified
                        </a>
                      ) : (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--color-text-faint)",
                          }}
                        >
                          In Progress
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {new Date(d.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <Link
                        to={`/donor/donation/${d.donationId}`}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: "12px" }}
                      >
                        Timeline →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
