import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";

export default function ManageCampaign() {
  const { id } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [campaignRes, benRes] = await Promise.all([
        api.get(`/public/campaigns/${id}`),
        api.get(`/ngo/beneficiaries`, { params: { campaignId: id } }),
      ]);

      if (cancelled) return;
      setCampaign(campaignRes.data.campaign); // The public endpoint returns { campaign, stats }
      setBeneficiaries(benRes.data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ACTIVATE CAMPAIGN (policy lock)
  const activateCampaign = async () => {
    if (!window.confirm("Activate campaign? Policy will be locked forever."))
      return;

    await api.post(`/campaigns/${id}/activate`);
    alert("Campaign activated");
    // re-fetch campaign detail
    const campaignRes = await api.get(`/public/campaigns/${id}`);
    setCampaign(campaignRes.data.campaign);
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div><p>Loading Mission Intel...</p></div>;

  const stats = campaign.stats || {};

  return (
    <div className="stack-lg">
      <div className="page-header border-b pb-6">
        <div className="row-between">
           <div>
              <h1 className="page-title text-2xl">{campaign.title}</h1>
              <div className="flex gap-2 items-center mt-2">
                <StatusBadge status={campaign.status} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{campaign.disasterType} Mission</span>
              </div>
           </div>
           {campaign.status === "DRAFT" && (
            <button
              onClick={activateCampaign}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg shadow-green-200 transition-all transform hover:scale-105"
            >
              Activate & Lock Policy
            </button>
          )}
        </div>
      </div>

      <div className="grid-3 gap-6">
        <div className="stat-card border-none bg-blue-50">
          <div className="stat-card-label text-blue-800">Donation Intake</div>
          <div className="stat-card-value text-blue-900">₹{(stats.totalDonated || 0).toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-blue-700 font-bold uppercase mt-2">FROM {stats.donationCount || 0} DONATIONS</p>
        </div>
        <div className="stat-card border-none bg-emerald-50">
          <div className="stat-card-label text-emerald-800">Victims Registered</div>
          <div className="stat-card-value text-emerald-900">{stats.totalBeneficiaries || beneficiaries.length}</div>
          <p className="text-[10px] text-emerald-700 font-bold uppercase mt-2">{beneficiaries.filter(b=>b.status==='ACTIVE').length} APPROVED & WALLET-READY</p>
        </div>
        <div className="stat-card border-none bg-slate-100">
           <div className="stat-card-label text-slate-600">Disbursement Status</div>
           <div className="stat-card-value text-slate-800">{Math.round((stats.disbursedAmount / stats.totalDonated)*100) || 0}%</div>
           <div className="w-full bg-slate-200 h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-slate-800 h-full" style={{ width: `${(stats.disbursedAmount / stats.totalDonated)*100 || 0}%` }}></div>
           </div>
        </div>
      </div>

      <div className="grid-2-1 gap-8">
        <div className="stack">
          <div className="card-header row-between">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Onboarded Victims</h3>
            <Link to="/ngo/beneficiaries/register" className="text-primary text-xs font-bold">+ Register New</Link>
          </div>

          <div className="stack gap-3">
            {beneficiaries.length === 0 ? (
              <div className="empty-state py-20 border-2 border-dashed border-slate-100 rounded-xl">
                 <p className="text-slate-400">No victims have been registered for this mission yet.</p>
              </div>
            ) : (
              beneficiaries.map((b) => (
                <div key={b._id} className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow row-between">
                  <div className="flex gap-4 items-center">
                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                       {b.name?.charAt(0) || b.user?.email?.charAt(0) || 'B'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{b.name || b.user?.email || "Unnamed Beneficiary"}</div>
                      <div className="text-[10px] font-mono text-slate-400">ID: {b._id.slice(-8).toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                     <StatusBadge status={b.status} />
                     <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase mt-1">
                        {b.status === 'ACTIVE' ? 'Wallet Generated' : 'Evaluation Pending'}
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="stack gap-6">
           <div className="card shadow-sm border-0 bg-slate-900 p-6 rounded-2xl text-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                <h3 className="font-bold uppercase tracking-widest text-[11px] opacity-70">Immutable Policy Snapshot</h3>
              </div>
              
              <div className="space-y-4">
                 <div className="row-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400">Spending Lock</span>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">₹{campaign.policySnapshot?.maxPerBeneficiary}/Cap</span>
                 </div>
                 <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Whitelisted Categories</span>
                    <div className="flex flex-wrap gap-2">
                       {campaign.policySnapshot?.allowedCategories?.map(cat => (
                         <span key={cat} className="text-[9px] font-bold px-2 py-0.5 bg-slate-700 text-slate-300 rounded uppercase tracking-tighter border border-slate-600">
                           {cat}
                         </span>
                       ))}
                    </div>
                 </div>
                 <div className="row-between text-xs p-2 opacity-60">
                    <span>Audit Duration</span>
                    <span className="font-bold">{campaign.policySnapshot?.validityDays} Days</span>
                 </div>
              </div>
           </div>

           <div className="card border-slate-100 shadow-sm p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Audit Chain</h3>
              <div className="space-y-4 border-l-2 border-slate-100 ml-2 pl-4">
                 <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-300"></div>
                    <div className="text-[11px] font-bold text-slate-700">CAMPAIGN_DRAFTED</div>
                    <div className="text-[10px] text-slate-400">{new Date(campaign.createdAt).toLocaleDateString()}</div>
                 </div>
                 {campaign.status === 'ACTIVE' && (
                   <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-green-500"></div>
                      <div className="text-[11px] font-bold text-slate-700 uppercase">Mission Activated</div>
                      <div className="text-[10px] text-slate-400">Policy Encoded in Blockchain</div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
