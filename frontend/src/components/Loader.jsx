export default function Loader({ text = "Processing..." }) {
  return (
    <div className="animate-fade-in flex items-center gap-3 text-[var(--color-steel)]">
      <div className="spinner" style={{ width: "20px", height: "20px" }}></div>
      <span style={{ fontSize: "14px", fontWeight: "500" }}>{text}</span>
    </div>
  );
}
