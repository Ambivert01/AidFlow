import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <main className="p-6">{children}</main>
    </div>
  );
}
