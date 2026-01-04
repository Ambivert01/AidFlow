export default function FraudMonitor() {
  const flags = [
    { id: 1, type: "Merchant Overuse", level: "High" },
    { id: 2, type: "Duplicate Beneficiary", level: "Medium" }
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">AI Risk Monitor</h2>

      {flags.map(f => (
        <div key={f.id} className="bg-white p-3 shadow rounded mb-2">
          <p>{f.type}</p>
          <p className="text-red-600">{f.level} Risk</p>
        </div>
      ))}
    </div>
  );
}
