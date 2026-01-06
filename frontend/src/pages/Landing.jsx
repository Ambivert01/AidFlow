import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="space-y-24">
      {/* 1 HERO */}
      <section className="text-center py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-700">
          AidFlow
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto">
          A transparent, auditable, and intelligent disaster-relief
          infrastructure that ensures every donated rupee reaches the right
          person — without corruption, delay, or misuse.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            to="/public"
            className="px-6 py-3 rounded bg-blue-700 text-white hover:bg-blue-800"
          >
            Verify Public Audit
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded border border-slate-300 hover:bg-slate-100"
          >
            Login
          </Link>
          <Link to="/request-access" className="px-6 py-3 rounded border">
            NGO / Merchant Access
          </Link>
        </div>
      </section>

      {/* 2 PROBLEM */}
      <section className="max-w-5xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-bold">The Problem With Disaster Relief</h2>
        <p className="text-slate-600">
          Traditional relief systems suffer from fund leakage, delayed
          distribution, lack of accountability, and zero public transparency.
          Donors never know where their money goes. Governments discover fraud
          only after damage is done.
        </p>
      </section>

      {/* 3 SOLUTION */}
      <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {[
          {
            title: "AI-Driven Decisions",
            desc: "Eligibility checks, fraud detection, and risk scoring are handled by independent AI agents — not humans.",
          },
          {
            title: "Policy-Locked Funds",
            desc: "Funds are locked to approved categories (food, medicine, shelter) and cannot be misused.",
          },
          {
            title: "Blockchain Anchoring",
            desc: "Every workflow generates a cryptographic audit proof anchored on-chain for public verification.",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="bg-white p-6 rounded shadow text-center"
          >
            <h3 className="font-semibold text-lg">{c.title}</h3>
            <p className="mt-3 text-sm text-slate-600">{c.desc}</p>
          </div>
        ))}
      </section>

      {/* 4 ROLES */}
      <section className="max-w-6xl mx-auto space-y-10">
        <h2 className="text-3xl font-bold text-center">Who Uses AidFlow?</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            ["Donors", "Track impact with immutable audit proofs."],
            [
              "NGOs",
              "Distribute aid with policy enforcement and AI oversight.",
            ],
            ["Beneficiaries", "Receive funds safely with restricted usage."],
            ["Merchants", "Accept aid-wallet payments securely."],
            ["Government", "Monitor risk, fraud, and compliance in real-time."],
            ["Public", "Verify audits without login or permissions."],
          ].map(([title, desc]) => (
            <div key={title} className="bg-gray-50 p-5 rounded border">
              <h4 className="font-semibold">{title}</h4>
              <p className="text-sm text-slate-600 mt-2">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 PUBLIC AUDIT */}
      <section className="bg-blue-50 py-16 text-center">
        <h2 className="text-3xl font-bold">Radical Transparency</h2>
        <p className="mt-4 max-w-3xl mx-auto text-slate-600">
          Anyone — journalist, citizen, or regulator — can verify the integrity
          of a donation workflow using its public audit ID. No login. No
          permissions. No trust required.
        </p>

        <Link
          to="/public"
          className="inline-block mt-6 px-6 py-3 rounded bg-blue-700 text-white"
        >
          Verify Audit Now
        </Link>
      </section>

      {/* 6 GOVERNANCE */}
      <section className="max-w-5xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-bold">Built For Governance & Scale</h2>
        <p className="text-slate-600">
          AidFlow is designed for national-scale deployment with role-based
          access control, immutable audit trails, AI explainability, and
          legal-grade accountability.
        </p>
      </section>

      {/* 7 CTA */}
      <section className="text-center py-16">
        <h2 className="text-2xl font-semibold">
          Join the Future of Transparent Relief
        </h2>

        <div className="mt-6 flex justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-3 rounded bg-blue-700 text-white"
          >
            Login to Continue
          </Link>
          <Link to="/public" className="px-6 py-3 rounded border">
            Public Audit
          </Link>
        </div>
      </section>
    </div>
  );
}
