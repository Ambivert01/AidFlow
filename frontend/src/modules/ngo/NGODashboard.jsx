import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const STATUS_BADGE = {
  ACTIVE: "badge-green",
  DRAFT: "badge-gray",
  PAUSED: "badge-orange",
  CLOSED: "badge-gray",
  COMPLETED: "badge-teal",
  AUDIT_FINALIZED: "badge-teal",
};

export default function NGODashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, campRes, donRes] = await Promise.all([
          api.get("/ngo/dashboard"),
          api.get("/ngo/campaigns").catch(() => ({ data: { data: [] } })),
          api.get("/ngo/donations/pending").catch(() => ({ data: { data: [] } })),
        ]);
        setStats(statsRes.data?.data || statsRes.data);
        setCampaigns((campRes.data?.data || campRes.data || []).slice(0, 5));
        setRecentDonations((donRes.data?.data || donRes.data || []).slice(0, 5));
      } catch (err) {
        console.error("NGO DASHBOARD ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="stack-lg">
        <div className="page-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
        <div className="grid-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card skeleton" style={{ height: '100px' }} />
          ))}
        </div>
        <div className="grid-2 mt-8">
          <div className="card skeleton" style={{ height: '300px' }} />
          <div className="card skeleton" style={{ height: '300px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <h1 className="page-title">NGO Operations Dashboard</h1>
        <p className="page-subtitle">Manage campaigns, evaluate beneficiaries, and disburse smart aid.</p>
      </div>

      {stats && (
        <div className="grid-4">
          <div className="stat-card stagger-item">
            <div className="stat-card-label">Active Campaigns</div>
            <div className="stat-card-value text-primary number-animate">{stats.activeCampaigns || 0}</div>
            <div className="stat-card-sub">from {stats.totalCampaigns || 0} total programs</div>
          </div>
          <div className="stat-card stagger-item">
            <div className="stat-card-label">Approved Victims</div>
            <div className="stat-card-value text-green-600 number-animate">{stats.activeBeneficiaries || 0}</div>
            <div className="stat-card-sub">{stats.pendingBeneficiaries || 0} awaiting AI/NGO review</div>
          </div>
          <div className="stat-card highlight-orange stagger-item">
            <div className="stat-card-label">Pending Aid</div>
            <div className="stat-card-value number-animate">{stats.pendingDonations || 0}</div>
            <div className="stat-card-sub">Donations requiring assignment</div>
          </div>
          <div className="stat-card stagger-item">
            <div className="stat-card-label">Total Disbursed</div>
            <div className="stat-card-value tracking-tight number-animate">₹{(stats.totalDonated || 0).toLocaleString("en-IN")}</div>
            <div className="stat-card-sub">Across all secure wallets</div>
          </div>
        </div>
      )}

      <div className="grid-2 gap-8">
        {/* Quick Actions */}
        <div className="card shadow-sm border-0 bg-gradient-to-br from-slate-50 to-blue-50/30 hover-lift">
          <h2 className="text-lg font-bold mb-4 text-slate-800">Mission Oversight</h2>
          <div className="grid-2 gap-4">
            <Link to="/ngo/campaigns/create" className="action-button group">
              <div className="icon-box bg-blue-100 group-hover:bg-blue-600 transition-colors">
                <span className="text-2xl group-hover:scale-110 transition-transform inline-block">📋</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-800">Launch Campaign</div>
                <p className="text-[11px] text-slate-500 leading-tight mt-1">Deploy new aid funds with specific policies.</p>
              </div>
            </Link>

            <Link to="/ngo/beneficiaries/register" className="action-button group">
              <div className="icon-box bg-emerald-100 group-hover:bg-emerald-600 transition-colors">
                <span className="text-2xl group-hover:scale-110 transition-transform inline-block">👤</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-800">Register Victims</div>
                <p className="text-[11px] text-slate-500 leading-tight mt-1">Onboard beneficiaries for AI validation.</p>
              </div>
            </Link>

            <Link to="/ngo/reviews" className="action-button full-width group bg-primary bg-opacity-5 border-primary border-opacity-20">
              <div className="flex items-center gap-4 w-100">
                <div className="icon-box bg-primary group-hover:bg-primary-dark transition-colors">
                  <span className="text-2xl group-hover:scale-110 transition-transform inline-block">⚖️</span>
                </div>
                <div className="text-left flex-1">
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-primary-dark">Review & Disburse Aid</div>
                    {stats?.pendingDonations > 0 && (
                      <span className="badge badge-red animate-pulse">{stats.pendingDonations} PENDING</span>
                    )}
                  </div>
                  <p className="text-[11px] text-primary-dark opacity-70 leading-tight mt-1">Assign funds to approved beneficiaries and activate smart wallets.</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Pending Donations Tracker */}
        <div className="card shadow-sm border-0 hover-lift">
          <div className="row-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Real-time Aid Intake</h2>
            <Link to="/ngo/reviews" className="text-primary text-xs font-bold hover:underline transition-smooth">Full Queue →</Link>
          </div>
          
          {recentDonations.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-lg">
              <span className="text-3xl block mb-2">✨</span>
              <p className="text-sm font-bold text-slate-600">All aid has been assigned</p>
              <p className="text-xs text-slate-400 mt-1">New donations will appear here instantly.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDonations.map((d, idx) => (
                <div key={d._id} className="py-3 flex justify-between items-center group hover:bg-slate-50 rounded px-2 transition-smooth stagger-item" style={{ '--index': idx }}>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800">₹{d.amount?.toLocaleString("en-IN")}</div>
                    <div className="text-[11px] text-slate-500">Intake from: {d.donor?.name || "Private Donor"}</div>
                  </div>
                  <Link to="/ngo/reviews" className="px-3 py-1 bg-slate-100 hover:bg-primary hover:text-white text-[10px] font-bold rounded transition-smooth uppercase tracking-wider hover-scale">Assign Aid</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign List */}
      <div className="card shadow-sm border-0 hover-lift">
         <div className="row-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Program Management</h2>
          </div>
          
          {campaigns.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 text-sm">No active aid programs found.</p>
            </div>
          ) : (
            <div className="grid-1 gap-3">
               {campaigns.map((c, idx) => (
                <div key={c._id} className="p-4 border border-slate-100 rounded-lg flex justify-between items-center hover:shadow-lg transition-smooth hover:border-primary/30 stagger-item" style={{ '--index': idx }}>
                  <div className="flex gap-4 items-center">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl transition-transform ${c.status === 'ACTIVE' ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 'bg-slate-100'}`}>
                      {c.disasterType === 'FLOOD' ? '🌊' : c.disasterType === 'EARTHQUAKE' ? '🌋' : '📦'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-[15px]">{c.title}</div>
                      <div className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">{c.disasterType} • {c.location?.state}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter transition-smooth ${
                      c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>{c.status}</span>
                    <Link to={`/ngo/campaigns/${c._id}`} className="p-2 hover:bg-primary hover:text-white rounded-full transition-smooth text-slate-400 hover-scale">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
