import NgoStatCard from "./NgoStatCard";

export default function NgoSummaryGrid({ data }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <NgoStatCard title="Total Campaigns" value={data.campaigns.total} />
      <NgoStatCard title="Active Campaigns" value={data.campaigns.active} />
      <NgoStatCard title="Pending Reviews" value={data.donations.pendingReview} />
      <NgoStatCard title="Approved Donations" value={data.donations.approved} />
      <NgoStatCard title="Audit Events" value={data.audit.totalEvents} />
      <NgoStatCard title="Finalized Audits" value={data.audit.finalized} />
      <NgoStatCard title="On-Chain Anchored" value={data.audit.anchored} />
      <NgoStatCard title="Rejected Donations" value={data.donations.rejected} />
    </div>
  );
}
