import { IconCheck, IconAlert, IconInfo } from "../icons";

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
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            {toast.type === "error" ? (
              <IconAlert size={16} color="#EF4444" />
            ) : toast.type === "success" ? (
              <IconCheck size={16} color="#10B981" />
            ) : (
              <IconInfo size={16} color="#3B82F6" />
            )}
          </span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
