import { IconMap, IconActivity, IconPlus, IconUser } from "../icons";

export default function BottomNav({ current, onChange }) {
  const items = [
    { id: "map", label: "Explore", icon: <IconMap size={20} /> },
    { id: "feed", label: "Activity", icon: <IconActivity size={20} /> },
    { id: "add", label: "Add Spot", icon: <IconPlus size={20} />, add: true },
    { id: "profile", label: "Account", icon: <IconUser size={20} /> },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item ${current === item.id ? "active" : ""} ${item.add ? "nav-add" : ""}`}
          onClick={() => onChange(item.id)}
        >
          <span className="nav-icon-wrap">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
