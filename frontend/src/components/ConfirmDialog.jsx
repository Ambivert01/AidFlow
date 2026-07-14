import { useEffect, useState } from "react";

// Module-level resolver so confirmDialog() can be called imperatively from
// anywhere (matching the existing `if (!window.confirm(msg)) return;`
// call-site shape almost exactly, just async) without needing every caller
// to wire up its own modal state. <ConfirmDialogHost /> below is mounted
// once at the app root and owns the actual rendering.
let resolver = null;
let setDialogState = null;

export function confirmDialog(message, options = {}) {
  return new Promise((resolve) => {
    resolver = resolve;
    setDialogState?.({
      open: true,
      message,
      title: options.title || "Please confirm",
      danger: options.danger ?? false,
      confirmLabel: options.confirmLabel || "Confirm",
      cancelLabel: options.cancelLabel || "Cancel",
      input: options.input ?? false,
      inputLabel: options.inputLabel || "",
      inputPlaceholder: options.inputPlaceholder || "",
      inputValue: options.inputDefault || "",
    });
  });
}

export default function ConfirmDialogHost() {
  const [state, setState] = useState({ open: false, message: "" });

  useEffect(() => {
    setDialogState = setState;
    return () => {
      setDialogState = null;
    };
  }, []);

  const close = (confirmed) => {
    const result = state.input ? (confirmed ? state.inputValue.trim() || null : null) : confirmed;
    setState((s) => ({ ...s, open: false }));
    resolver?.(result);
    resolver = null;
  };

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter" && !state.input) close(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state.open, state.input]);

  if (!state.open) return null;

  return (
    <div
      role="presentation"
      onClick={() => close(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(21, 24, 29, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="card shadow-lg animate-scale-in"
        style={{ maxWidth: "380px", width: "90%", padding: "var(--space-6)" }}
      >
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, marginBottom: "10px" }}>
          {state.title}
        </h3>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: state.input ? "10px" : "var(--space-5)" }}>
          {state.message}
        </p>
        {state.input && (
          <div className="form-group" style={{ marginBottom: "var(--space-5)" }}>
            {state.inputLabel && <label className="form-label">{state.inputLabel}</label>}
            <textarea
              className="form-input"
              autoFocus
              rows={3}
              placeholder={state.inputPlaceholder}
              value={state.inputValue}
              onChange={(e) => setState((s) => ({ ...s, inputValue: e.target.value }))}
            />
          </div>
        )}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => close(false)}>
            {state.cancelLabel}
          </button>
          <button
            className={state.danger ? "btn btn-danger btn-sm" : "btn btn-primary btn-sm"}
            onClick={() => close(true)}
            disabled={state.input && !state.inputValue.trim()}
            autoFocus={!state.input}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
