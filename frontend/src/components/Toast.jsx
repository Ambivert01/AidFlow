import { useState } from "react";
import { ToastContext } from "./toastContext";

let toastCount = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 4000) => {
    const id = ++toastCount;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div 
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          pointerEvents: "none"
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type} animate-slide-up`}
            style={{
              pointerEvents: "auto",
              padding: "12px 16px",
              background: toast.type === 'error' ? 'var(--color-danger)' : 
                          toast.type === 'success' ? '#10b981' : 
                          toast.type === 'warning' ? 'var(--color-orange)' : 
                          'var(--color-surface-reverse)',
              color: 'white',
              borderRadius: "8px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "14px",
              fontWeight: "500",
              minWidth: "280px"
            }}
          >
            {toast.type === 'success' && <span>✅</span>}
            {toast.type === 'error' && <span>❌</span>}
            {toast.type === 'warning' && <span>⚠️</span>}
            {toast.type === 'info' && <span>ℹ️</span>}
            
            <span style={{ flex: 1 }}>{toast.message}</span>
            
            <button 
              onClick={() => removeToast(toast.id)}
              style={{ background: "transparent", border: "none", color: "white", opacity: 0.6, cursor: "pointer", fontSize: "16px", outline: "none" }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
