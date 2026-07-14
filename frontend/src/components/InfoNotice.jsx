export default function InfoNotice({ title, message, type = "warning" }) {
  const typeStyles = {
    warning: "alert-warning",
    info: "alert-info",
    success: "alert-success",
    danger: "alert-danger",
  };

  return (
    <div className={`alert ${typeStyles[type] || typeStyles.warning}`}>
      <div style={{ flex: 1 }}>
        {title && (
          <p style={{ fontWeight: "600", marginBottom: "4px" }}>{title}</p>
        )}
        <p style={{ fontSize: "13px", opacity: 0.9 }}>{message}</p>
      </div>
    </div>
  );
}
