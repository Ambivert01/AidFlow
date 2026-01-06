export default function InfoNotice({ title, message }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-4">
      {title && (
        <p className="font-semibold mb-1">{title}</p>
      )}
      <p className="text-sm">{message}</p>
    </div>
  );
}
