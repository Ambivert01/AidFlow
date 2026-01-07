// src/modules/government/GovtDashboard.jsx
import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import RoleContextBanner from "../../components/RoleContextBanner";

export default function GovtDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/government/overview").then(res => setData(res.data));
  }, []);

  if (!data) return <Loader text="Loading government overview..." />;

  return (
    <div className="space-y-6">
      <RoleContextBanner
        role="GOVERNMENT"
        message="National oversight dashboard. All actions are permanently audited."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Escalated Donations" value={data.escalated} />
        <Stat label="Approved" value={data.approved} />
        <Stat label="Rejected" value={data.rejected} />
        <Stat label="Frozen Wallets" value={data.frozenWallets} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white p-4 rounded shadow text-center">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
