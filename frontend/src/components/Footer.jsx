export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-slate-500 flex justify-between">
        <span>© {new Date().getFullYear()} AidFlow</span>
        <span>Transparent Disaster Relief Infrastructure</span>
      </div>
    </footer>
  );
}
