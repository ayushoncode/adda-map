export default function BottomNav({ current, onChange, accent }) {
  const items = [
    { id: "map", label: "Map", icon: "🗺" },
    { id: "feed", label: "Feed", icon: "⚡" },
    { id: "add", label: "Add", icon: "＋", add: true },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item ${current === item.id ? "active" : ""} ${item.add ? "nav-add" : ""}`}
          onClick={() => onChange(item.id)}
          style={current === item.id ? { "--accent": accent } : undefined}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
          {!item.add && <i className="nav-dot" />}
        </button>
      ))}
    </nav>
  );
}
