export default function RoleContextBanner({ role, message }) {
  const roleLabels = {
    DONOR: "Donor",
    NGO: "NGO",
    BENEFICIARY: "Beneficiary",
    MERCHANT: "Merchant",
    GOVERNMENT: "Government",
  };

  return (
    <div className="bg-[var(--color-signal-light)] border border-[var(--color-signal-light)] text-[var(--color-signal-dark)] p-4 rounded mb-6">
      <p className="font-semibold">
        You are logged in as a {roleLabels[role] || role}
      </p>
      {message && (
        <p className="text-sm mt-1 text-[var(--color-signal-dark)]">{message}</p>
      )}
    </div>
  );
}
