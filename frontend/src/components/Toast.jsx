export default function Toast({ toasts }) {
  if (!toasts?.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-message ${
            toast.type === "error"
              ? "toast-error"
              : toast.type === "success"
              ? "toast-success"
              : ""
          }`}
        >
          <span>{toast.type === "error" ? "⚠️" : toast.type === "success" ? "✓" : "ℹ️"}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
