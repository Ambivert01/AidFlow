export default function ProblemSection() {
  const problems = [
    {
      title: "Opaque Fund Distribution",
      desc: "Donors rarely know where their money actually goes once it is donated.",
    },
    {
      title: "Manual & Delayed Oversight",
      desc: "Audits often occur months later, after funds are already misused.",
    },
    {
      title: "Trust Depends on Institutions",
      desc: "Current systems rely on organizational promises, not verifiable proof.",
    },
    {
      title: "No Public Visibility",
      desc: "Citizens and donors cannot independently verify outcomes.",
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold text-center mb-10">
        Why Disaster Relief Needs Public Accountability
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {problems.map((p, i) => (
          <div key={i} className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-2">{p.title}</h3>
            <p className="text-sm text-slate-600">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
