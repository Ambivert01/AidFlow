import RoleContextBanner from "../../components/RoleContextBanner";
import WalletView from "./WalletView";
import UsageHistory from "./UsageHistory";

export default function BeneficiaryDashboard() {
  return (
    <div className="space-y-6">
      <RoleContextBanner
        role="BENEFICIARY"
        message="Your aid wallet is policy-locked and can only be used at approved merchants."
      />

      <WalletView />
      <UsageHistory />
    </div>
  );
}
