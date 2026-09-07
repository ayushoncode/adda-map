import { initials, formatAreaLabel } from "../utils";
import { IconMap, IconActivity, IconTrophy, IconPlus, IconLocation } from "../icons";

export default function Header({
  userProfile,
  currentTab,
  onTabChange,
  onOpenProfile,
  onOpenAdd,
  onLogout,
}) {
  const isGuest = userProfile?.isGuest || !userProfile?.id || userProfile?.id === "guest_scout";

  return (
    <header className="cmhub-header">
      <div className="cmhub-header-inner">
        {/* Left Branding - Bold Clean Logo */}
        <div className="cmhub-brand-group" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <a
            href="https://cmhub.in"
            target="_blank"
            rel="noopener noreferrer"
            className="cmhub-external-brand-link"
            title="Go to cmhub.in"
            style={{
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: "1.25rem",
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
              display: "inline-flex",
              alignItems: "center",
              transition: "opacity 150ms ease",
            }}
          >
            cmhub
          </a>
          <span style={{ color: "#71717A", fontWeight: 400, fontSize: "0.95rem" }}>×</span>
          <button
            type="button"
            onClick={() => onTabChange("map")}
            className="uber-brand-btn"
            title="Adda Map"
            style={{ padding: 0 }}
          >
            <img src="/adda-logo-white.png" alt="adda" className="adda-custom-logo" style={{ height: 24 }} />
            <span className="uber-logo-badge">MAP</span>
          </button>
        </div>

        {/* Center Desktop Navigation Pill Container */}
        <nav className="cmhub-nav-pill-group" aria-label="Main Navigation">
          <button
            type="button"
            className={`cmhub-nav-pill ${currentTab === "map" ? "active" : ""}`}
            onClick={() => onTabChange("map")}
          >
            <IconMap size={16} />
            <span>Explore</span>
          </button>
          <button
            type="button"
            className={`cmhub-nav-pill ${currentTab === "leaderboard" ? "active" : ""}`}
            onClick={() => onTabChange("leaderboard")}
          >
            <IconTrophy size={16} />
            <span>Top Scouts</span>
          </button>
          <button
            type="button"
            className={`cmhub-nav-pill ${currentTab === "feed" ? "active" : ""}`}
            onClick={() => onTabChange("feed")}
          >
            <IconActivity size={16} />
            <span>Activity</span>
          </button>
          <button
            type="button"
            className="cmhub-nav-pill cmhub-nav-add-btn"
            onClick={onOpenAdd}
          >
            <IconPlus size={16} />
            <span>Add Spot</span>
          </button>
        </nav>

        {/* Right User Pill & Actions */}
        <div className="cmhub-user-group">
          {userProfile?.area && (
            <div className="cmhub-location-chip" title={userProfile.area}>
              <IconLocation size={14} />
              <span className="cmhub-location-name">
                {formatAreaLabel(userProfile.area)}
              </span>
            </div>
          )}

          <button
            type="button"
            className="cmhub-user-pill"
            onClick={onOpenProfile}
            aria-label="User profile"
          >
            <div
              className="cmhub-user-avatar"
              style={{ background: userProfile?.avatarColor || "#10B981", color: "#FFFFFF" }}
            >
              {initials(userProfile?.name || "Scout")}
            </div>
            <div className="cmhub-user-meta">
              <span className="cmhub-user-name">
                {userProfile?.name || "Scout"}
              </span>
              <span className={`cmhub-verified-badge ${isGuest ? "guest-mode-badge" : ""}`}>
                {isGuest ? "GUEST" : "VERIFIED"}
              </span>
            </div>
          </button>

          {onLogout && (
            <button
              type="button"
              className="header-logout-btn"
              onClick={onLogout}
              title={isGuest ? "Go to Login Page" : "Sign Out"}
            >
              {isGuest ? "Sign In" : "Log Out"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
