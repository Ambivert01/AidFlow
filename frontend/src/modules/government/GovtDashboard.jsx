import RoleContextBanner from "../../components/RoleContextBanner";
import InfoNotice from "../../components/InfoNotice";

export default function GovtDashboard() {
  return (
    <div className="space-y-4">
      <RoleContextBanner
        role="GOVERNMENT"
        message="This dashboard provides high-level visibility into system activity and risks."
      />

      <InfoNotice
        title="Read-only oversight"
        message="This dashboard provides visibility into system activity. Operational actions are handled by NGOs and automated workflows."
      />

      <h1 className="text-2xl font-bold">Disaster Command Center</h1>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
 gap-4"
      >
        <div className="bg-white p-4 shadow rounded">
          <p>Active Disasters</p>
          <p className="text-xl font-semibold">1</p>
        </div>

        <div className="bg-white p-4 shadow rounded">
          <p>Funds Distributed</p>
          <p className="text-xl font-semibold">₹9.8 Cr</p>
        </div>

        <div className="bg-white p-4 shadow rounded">
          <p>AI Flags</p>
          <p className="text-xl font-semibold">3</p>
        </div>
      </div>
    </div>
  );
}
