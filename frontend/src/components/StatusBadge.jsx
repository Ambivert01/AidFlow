export default function StatusBadge({ status }) {
  const styles = {
    APPROVED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    BLOCKED: "bg-red-100 text-red-700",
    ACTIVE: "bg-blue-100 text-blue-700",
    EXPIRED: "bg-gray-200 text-gray-600"
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
