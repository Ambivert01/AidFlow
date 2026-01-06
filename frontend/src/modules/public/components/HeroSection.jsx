import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="text-center py-24">
      <h1 className="text-4xl font-bold text-blue-700">AidFlow</h1>

      <p className="mt-4 text-xl text-slate-700">
        Transparent Infrastructure for Disaster Relief
      </p>

      <p className="mt-6 max-w-3xl mx-auto text-slate-600">
        AidFlow is a public accountability system that ensures disaster relief
        funds are allocated, governed, and verifiable — from donation to usage —
        without relying on blind trust.
      </p>

      <div className="mt-10">
        <Link
          to="/public"
          className="inline-block bg-blue-700 text-white px-6 py-3 rounded-md text-lg hover:bg-blue-800"
        >
          Verify a Public Audit
        </Link>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        No login required. No personal data needed.
      </p>
    </section>
  );
}
