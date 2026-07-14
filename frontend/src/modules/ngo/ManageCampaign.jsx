import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";
import { confirmDialog } from "../../components/ConfirmDialog";
import { useToast } from "../../components/toastContext";

export default function ManageCampaign() {
  const { id } = useParams();
  const showToast = useToast();

  const [campaign, setCampaign] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [campaignRes, benRes] = await Promise.all([
        api.get(`/campaigns/${id}`),
        api.get(`/ngo/beneficiaries/${id}`),
      ]);

      if (cancelled) return;
      const campData = campaignRes.data?.data || campaignRes.data;
      setCampaign(campData);
      setBeneficiaries(benRes.data?.data || benRes.data || []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // SUBMIT CAMPAIGN FOR ADMIN APPROVAL
  // (There is no NGO self-activation - campaigns go DRAFT -> PENDING_APPROVAL
  // -> ACTIVE only once an admin approves them. The previous version of this
  // button called a /campaigns/:id/activate endpoint that doesn't exist
  // anywhere in the backend.)
  const submitForApproval = async () => {
    const confirmed = await confirmDialog(
      "Submit this campaign for admin approval? Its policy will be locked once approved.",
      { title: "Submit for approval", confirmLabel: "Submit" },
    );
    if (!confirmed) return;

    try {
      await api.post(`/campaigns/${id}/submit`);
      const campaignRes = await api.get(`/campaigns/${id}`);
      const campData = campaignRes.data?.data || campaignRes.data;
      setCampaign(campData);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to submit campaign for approval.",
        "error",
      );
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div><p>Loading Mission Intel...</p></div>;

  const totalDonated = campaign.totalDonated || 0;
  const totalSpent = campaign.totalSpent || 0;
  const disbursedPct = totalDonated > 0 ? Math.round((totalSpent / totalDonated) * 100) : 0;

  return (
    <div className="stack-lg">
      <div className="page-header border-b pb-6">
        <div className="row-between">
           <div>
              <h1 className="page-title text-2xl">{campaign.title}</h1>
              <div className="flex gap-2 items-center mt-2">
                <StatusBadge status={campaign.status} />
                <span className="text-xs font-bold text-[var(--color-steel)] uppercase tracking-widest">{campaign.disasterType} Mission</span>
              </div>
           </div>
           {campaign.status === "DRAFT" && (
            <button
              onClick={submitForApproval}
              className="btn btn-primary btn-lg"
            >
              Submit for Approval
            </button>
          )}
          {campaign.status === "PENDING_APPROVAL" && (
            <span className="badge badge-yellow">Awaiting admin review</span>
          )}
        </div>
      </div>

      <div className="grid-3 gap-6">
        <div className="stat-card border-none bg-[var(--color-signal-light)]">
          <div className="stat-card-label text-[var(--color-signal-dark)]">Donation Intake</div>
          <div className="stat-card-value text-[var(--color-signal-dark)]">₹{totalDonated.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-[var(--color-signal-dark)] font-bold uppercase mt-2">{campaign.totalWalletsCreated || 0} WALLETS CREATED</p>
        </div>
        <div className="stat-card border-none bg-[var(--color-verified-light)]">
          <div className="stat-card-label text-[var(--color-verified-dark)]">Beneficiaries Registered</div>
          <div className="stat-card-value text-[var(--color-verified-dark)]">{campaign.totalBeneficiaries || beneficiaries.length}</div>
          <p className="text-[10px] text-[var(--color-verified-dark)] font-bold uppercase mt-2">{beneficiaries.filter(b=>b.status==='APPROVED' || b.status==='ACTIVE').length} APPROVED & WALLET-READY</p>
        </div>
        <div className="stat-card border-none bg-[var(--color-paper-alt)]">
           <div className="stat-card-label text-[var(--color-steel)]">Disbursement Status</div>
           <div className="stat-card-value text-[var(--color-ink)]">{disbursedPct}%</div>
           <div className="w-full bg-[var(--color-paper-alt)] h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-[var(--color-ink)] h-full" style={{ width: `${disbursedPct}%` }}></div>
           </div>
        </div>
      </div>

      <div className="grid-2-1 gap-8">
        <div className="stack">
          <div className="card-header row-between">
            <h3 className="text-lg font-bold text-[var(--color-ink)] tracking-tight">Registered Beneficiaries</h3>
            <Link to="/ngo/beneficiaries/register" className="text-primary text-xs font-bold">+ Register New</Link>
          </div>

          <div className="stack gap-3">
            {beneficiaries.length === 0 ? (
              <div className="empty-state py-20 border-2 border-dashed border-[var(--color-paper-alt)] rounded-xl">
                 <p className="text-[var(--color-steel)]">No beneficiaries have been registered for this campaign yet.</p>
              </div>
            ) : (
              beneficiaries.map((b) => (
                <div key={b._id} className="p-4 bg-white border border-[var(--color-paper-alt)] rounded-xl hover:shadow-md transition-shadow row-between">
                  <div className="flex gap-4 items-center">
                    <div className="h-10 w-10 bg-[var(--color-paper-alt)] rounded-full flex items-center justify-center font-bold text-[var(--color-steel)]">
                       {b.name?.charAt(0) || b.user?.email?.charAt(0) || 'B'}
                    </div>
                    <div>
                      <div className="font-bold text-[var(--color-ink)]">{b.name || b.user?.email || "Unnamed Beneficiary"}</div>
                      <div className="text-[10px] font-mono text-[var(--color-steel)]">ID: {b._id.slice(-8).toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                     <StatusBadge status={b.status} />
                     <div className="text-[10px] text-[var(--color-steel)] font-bold mt-1 uppercase mt-1">
                        {b.status === 'APPROVED' || b.status === 'ACTIVE' ? 'Wallet Generated' : 'Evaluation Pending'}
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="stack gap-6">
           <div className="card shadow-sm border-0 bg-[var(--color-ink)] p-6 rounded-2xl text-[var(--color-paper-alt)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-[var(--color-signal)] animate-pulse"></div>
                <h3 className="font-bold uppercase tracking-widest text-[11px] opacity-70">Immutable Policy Snapshot</h3>
              </div>
              
              <div className="space-y-4">
                 <div className="row-between items-center bg-[var(--color-ink)] p-3 rounded-xl border border-[var(--color-ink)]">
                    <span className="text-xs text-[var(--color-steel)]">Spending Lock</span>
                    <span className="text-xs font-bold text-[var(--color-signal)] uppercase tracking-widest">₹{campaign.policySnapshot?.maxPerBeneficiary}/Cap</span>
                 </div>
                 <div className="bg-[var(--color-ink)] p-4 rounded-xl border border-[var(--color-ink)]">
                    <span className="text-[10px] font-bold text-[var(--color-steel)] uppercase block mb-2">Whitelisted Categories</span>
                    <div className="flex flex-wrap gap-2">
                       {campaign.policySnapshot?.allowedCategories?.map(cat => (
                         <span key={cat} className="text-[9px] font-bold px-2 py-0.5 bg-[var(--color-ink)] text-[var(--color-steel)] rounded uppercase tracking-tighter border border-[var(--color-steel)]">
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

           <div className="card border-[var(--color-paper-alt)] shadow-sm p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-[var(--color-ink)] mb-4 uppercase tracking-widest">Audit Chain</h3>
              <div className="space-y-4 border-l-2 border-[var(--color-paper-alt)] ml-2 pl-4">
                 <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[var(--color-steel)]"></div>
                    <div className="text-[11px] font-bold text-[var(--color-ink)]">CAMPAIGN_DRAFTED</div>
                    <div className="text-[10px] text-[var(--color-steel)]">{new Date(campaign.createdAt).toLocaleDateString()}</div>
                 </div>
                 {campaign.status === 'ACTIVE' && (
                   <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[var(--color-verified)]"></div>
                      <div className="text-[11px] font-bold text-[var(--color-ink)] uppercase">Mission Activated</div>
                      <div className="text-[10px] text-[var(--color-steel)]">Policy Encoded in Blockchain</div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
