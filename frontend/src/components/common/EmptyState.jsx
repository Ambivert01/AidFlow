export default function EmptyState({ title, subtitle }) {
  return (
    <div className="bg-gray-100 p-6 rounded text-center text-gray-500">
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      <p className="text-sm">{subtitle}</p>
    </div>
  );
}
