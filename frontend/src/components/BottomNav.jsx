import { IconMap, IconActivity, IconTrophy, IconPlus, IconUser } from "../icons";

export default function BottomNav({ current, onChange }) {
  const items = [
    { id: "map", label: "Explore", icon: <IconMap size={20} /> },
    { id: "leaderboard", label: "Scouts", icon: <IconTrophy size={20} /> },
    { id: "add", label: "Add", icon: <IconPlus size={22} />, add: true },
    { id: "feed", label: "Feed", icon: <IconActivity size={20} /> },
    { id: "profile", label: "Account", icon: <IconUser size={20} /> },
  ];

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation">
      <div className="bottom-nav-inner">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${current === item.id ? "active" : ""} ${item.add ? "nav-add" : ""}`}
            onClick={() => onChange(item.id)}
            aria-label={item.label}
          >
            <span className="nav-icon-wrap">{item.icon}</span>
            <span className="nav-item-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
