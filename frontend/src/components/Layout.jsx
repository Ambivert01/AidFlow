import Navbar from "./Navbar";
import PageTransition from "./PageTransition";
import ConfirmDialogHost from "./ConfirmDialog";

export default function Layout({ children }) {
  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <PageTransition>{children}</PageTransition>
      </main>
      <ConfirmDialogHost />
      <footer style={{
        borderTop: "1px solid var(--color-border)",
        padding: "16px 24px",
        textAlign: "center",
        fontSize: "12px",
        color: "var(--color-text-faint)",
        background: "var(--color-surface)",
      }}>
        AidFlow AI — Transparent Humanitarian Aid Infrastructure &nbsp;|&nbsp;
        <a href="/public-audit" style={{ color: "var(--color-primary)" }}>Public Audit</a> &nbsp;|&nbsp;
        <a href="/public/how-it-works" style={{ color: "var(--color-text-muted)" }}>How It Works</a>
      </footer>
    </div>
  );
}
