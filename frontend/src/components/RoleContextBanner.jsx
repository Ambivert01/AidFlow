export default function RoleContextBanner({ role, message }) {
  const roleLabels = {
    DONOR: "Donor",
    NGO: "NGO",
    BENEFICIARY: "Beneficiary",
    MERCHANT: "Merchant",
    GOVERNMENT: "Government",
  };

  return (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded mb-6">
      <p className="font-semibold">
        You are logged in as a {roleLabels[role] || role}
      </p>
      {message && (
        <p className="text-sm mt-1 text-blue-700">{message}</p>
      )}
    </div>
  );
}
