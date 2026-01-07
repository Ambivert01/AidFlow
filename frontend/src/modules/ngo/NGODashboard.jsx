import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import RoleContextBanner from "../../components/RoleContextBanner";
import NgoSummaryGrid from "./components/NgoSummaryGrid";
import InfoNotice from "../../components/InfoNotice";

export default function NGODashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/ngo/dashboard")
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading NGO control tower..." />;

  return (
    <div className="space-y-6">
      <RoleContextBanner
        role="NGO"
        message="This dashboard reflects your operational accountability across campaigns, donations, audits, and compliance."
      />

      <InfoNotice
        title="Governance Notice"
        message="All figures shown here are derived from immutable audit logs and AI workflow outputs. No manual overrides are possible."
      />

      <NgoSummaryGrid data={data} />
    </div>
  );
}
