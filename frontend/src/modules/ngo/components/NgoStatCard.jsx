export default function NgoStatCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow text-center">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-blue-700">{value}</p>
    </div>
  );
}
