export default function VerificationPowerSection() {
  const points = [
    "Whether a donation workflow was completed without tampering",
    "Whether approvals followed defined rules",
    "Whether records were altered after execution",
    "When the audit proof was finalized",
    "That verification is independent of AidFlow operators",
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold text-center mb-8">
        What Can Be Publicly Verified?
      </h2>

      <ul className="max-w-3xl mx-auto list-disc pl-6 space-y-2 text-slate-700">
        {points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>

      <p className="text-center mt-6 text-sm text-slate-500 max-w-3xl mx-auto">
        AidFlow does not expose identities, personal data, or financial details.
        Public verification confirms integrity of process — not private
        information.
      </p>
    </section>
  );
}
