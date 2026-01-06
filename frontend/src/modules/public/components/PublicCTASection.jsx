import { Link } from "react-router-dom";

export default function PublicCTASection() {
  return (
    <section className="text-center py-16 bg-blue-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">
        Verify a Disaster Relief Audit
      </h2>

      <Link
        to="/public"
        className="inline-block bg-blue-700 text-white px-6 py-3 rounded hover:bg-blue-800"
      >
        Go to Public Audit Verification
      </Link>

      <p className="mt-4 text-sm text-slate-600">
        Built for transparency, accountability, and public trust.
      </p>
    </section>
  );
}
