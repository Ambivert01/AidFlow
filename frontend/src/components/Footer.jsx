export default function Footer() {
  return (
    <footer className="bg-white border-t border-[var(--color-paper-alt)]">
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-[var(--color-steel)] flex justify-between">
        <span>© {new Date().getFullYear()} AidFlow</span>
        <span>Transparent Disaster Relief Infrastructure</span>
      </div>
    </footer>
  );
}
