export default function UsageHistory() {

    const transactions = [];

    if (transactions.length === 0) {
  return (
    <EmptyState
          title="No Audit Records"
          subtitle="Blockchain audit logs will appear here once donations are processed."
    />
  );
}


  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Usage History</h2>

      <div className="bg-white p-3 shadow rounded">
        <p>Food Store – ₹1,200</p>
        <p className="text-sm text-gray-500">1 Feb 2026</p>
      </div>
    </div>
  );
}
