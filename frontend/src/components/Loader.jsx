export default function Loader({ text = "Processing..." }) {
  return (
    <div className="flex items-center gap-2 text-gray-500 animate-pulse">
      <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
      <span>{text}</span>
    </div>
  );
}
