import { useParams } from "react-router-dom";
import Beneficiaries from "./Beneficiaries";

export default function NgoCampaignDetails() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Campaign Management</h2>

      {/* THIS IS WHERE Beneficiary.jsx LIVES */}
      <Beneficiaries campaignId={id} />
    </div>
  );
}
