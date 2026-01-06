export default function HowItWorksSection() {
  const steps = [
    "Donation is logged by the system",
    "Decisions and approvals are recorded",
    "Funds are governed by predefined rules",
    "An audit proof is generated",
    "Anyone can verify the process publicly",
  ];

  return (
    <section className="bg-slate-100 py-16 rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-10">
        How AidFlow Creates Verifiable Trust
      </h2>

      <div className="flex flex-col md:flex-row justify-center gap-6 max-w-6xl mx-auto">
        {steps.map((step, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded shadow text-center flex-1"
          >
            <div className="text-blue-700 font-bold mb-2">
              Step {i + 1}
            </div>
            <p className="text-sm text-slate-600">{step}</p>
          </div>
        ))}
      </div>

      <p className="text-center mt-10 text-sm text-slate-600">
        AidFlow does not ask you to trust the system — it allows you to verify it.
      </p>
    </section>
  );
}
