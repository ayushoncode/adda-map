export default function Toast({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type || "info"}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
