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
        <div className="cmhub-brand-group">
          <button
            type="button"
            onClick={() => onTabChange("map")}
            className="uber-brand-btn"
            title="Adda Map"
          >
            <span className="uber-logo-text">ADDA</span>
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
