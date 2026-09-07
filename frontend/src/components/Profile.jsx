import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import api from "../api";
import { auth } from "../firebase";
import {
  getLevelFromSpots,
  getNextLevelTarget,
  getSpotsToNextLevel,
  getTypeMeta,
  initials,
} from "../utils";
import { IconLocation, IconTrophy, IconUser, IconPlus, IconCheck } from "../icons";

export default function Profile({
  user,
  userProfile,
  onToast,
  onOpenSpot,
  onOpenAuth,
  onNavigateLeaderboard,
  onProfileUpdated,
}) {
  const [profileData, setProfileData] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState("");

  const isGuest = !user || userProfile?.isGuest;

  useEffect(() => {
    if (user?.uid) {
      api.get(`/users/${user.uid}`).then((res) => {
        setProfileData(res.data);
      }).catch((err) => {
        console.warn("Failed to fetch user data:", err);
      });
    } else {
      // Guest profile from localStorage
      const guestName = localStorage.getItem("adda_guest_name") || "Guest Scout";
      const guestArea = localStorage.getItem("adda_guest_area") || "Koramangala, Bangalore";
      setNewName(guestName);
      setNewArea(guestArea);
    }
  }, [user?.uid]);

  const activeUser = profileData?.user || userProfile || {
    id: "guest_scout",
    name: localStorage.getItem("adda_guest_name") || "Guest Scout",
    area: localStorage.getItem("adda_guest_area") || "Bangalore",
    avatarColor: "#10B981",
    scoutPoints: 120,
    spotsCount: 0,
    reviewsCount: 0,
    helpfulVotesReceived: 0,
  };

  const level = useMemo(
    () => getLevelFromSpots(activeUser?.spotsCount || 0),
    [activeUser?.spotsCount]
  );

  const nextTarget = getNextLevelTarget(activeUser?.spotsCount || 0);
  const progress =
    nextTarget === Infinity || !nextTarget
      ? 100
      : Math.min(100, ((activeUser?.spotsCount || 0) / nextTarget) * 100);
  const spotsToNextLevel = getSpotsToNextLevel(activeUser?.spotsCount || 0);

  const handleSaveGuestProfile = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      localStorage.setItem("adda_guest_name", newName.trim());
    }
    if (newArea.trim()) {
      localStorage.setItem("adda_guest_area", newArea.trim());
    }
    setEditingName(false);
    onProfileUpdated?.({
      ...activeUser,
      name: newName.trim() || activeUser.name,
      area: newArea.trim() || activeUser.area,
    });
    onToast?.("Scout profile updated!", "success");
  };

  const logout = async () => {
    await signOut(auth);
    onToast?.("Signed out.", "info");
  };

  return (
    <div className="profile-view-container">
      {/* Profile Card */}
      <section className="cmhub-profile-card uber-profile-card">
        <div
          className="profile-large-avatar"
          style={{ background: activeUser.avatarColor || "#10B981", color: "#FFFFFF" }}
        >
          {initials(activeUser.name)}
        </div>

        <div style={{ textAlign: "center", width: "100%" }}>
          {!editingName ? (
            <>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF" }}>
                {activeUser.name}
              </h2>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ color: "#A0A0A0", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4 }}>
                  <IconLocation size={14} />
                  <span>{activeUser.area || "Bangalore"}</span>
                </span>
                <span className={`uber-category-tag ${isGuest ? "guest-badge" : ""}`}>
                  {isGuest ? "GUEST SCOUT" : "VERIFIED SCOUT"}
                </span>
              </div>
              {isGuest && (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="profile-edit-btn"
                  style={{ marginTop: 8 }}
                >
                  Edit Name & Area
                </button>
              )}
            </>
          ) : (
            <form onSubmit={handleSaveGuestProfile} className="profile-edit-form">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Your Scout Name"
                className="uber-input"
                style={{ marginBottom: 8, textAlign: "center" }}
              />
              <input
                type="text"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="Your Neighborhood (e.g. Koramangala)"
                className="uber-input"
                style={{ marginBottom: 8, textAlign: "center" }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button type="submit" className="uber-cta-btn" style={{ padding: "8px 16px" }}>
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="uber-secondary-btn"
                  style={{ padding: "8px 16px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Level & Points Progress */}
        <div style={{ width: "100%", background: "#181818", border: "1px solid #262626", borderRadius: "16px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.85rem", fontWeight: 700 }}>
            <span style={{ color: "#FFFFFF" }}>
              Level: {level.label}
            </span>
            <span style={{ color: "#10B981" }}>
              {activeUser.scoutPoints || 0} Points
            </span>
          </div>

          <div style={{ width: "100%", height: 8, background: "#262626", borderRadius: "9999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, #10B981, #34D399)",
                borderRadius: "9999px",
                transition: "width 400ms ease",
              }}
            />
          </div>

          {!!spotsToNextLevel && (
            <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#A0A0A0", textAlign: "left" }}>
              Pin {spotsToNextLevel} more spots to reach next scout rank
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="profile-stats-row">
          <div className="profile-stat-box">
            <strong>{activeUser.spotsCount || 0}</strong>
            <span>Spots Pinned</span>
          </div>
          <div className="profile-stat-box">
            <strong>{activeUser.reviewsCount || 0}</strong>
            <span>Reviews</span>
          </div>
          <div className="profile-stat-box">
            <strong>{activeUser.scoutPoints || 0}</strong>
            <span>Scout XP</span>
          </div>
        </div>

        {/* Navigation to Leaderboard */}
        <button
          type="button"
          className="profile-leaderboard-banner-btn"
          onClick={onNavigateLeaderboard}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="leaderboard-icon-bubble">
              <IconTrophy size={18} color="#F59E0B" />
            </div>
            <div style={{ textAlign: "left" }}>
              <strong style={{ display: "block", color: "#FFFFFF", fontSize: "0.92rem" }}>
                View Top Scouts Leaderboard
              </strong>
              <span style={{ color: "#A0A0A0", fontSize: "0.78rem" }}>
                See who's leading the Bangalore adda race
              </span>
            </div>
          </div>
          <span style={{ color: "#FFFFFF", fontSize: "1.1rem" }}>→</span>
        </button>

        {/* Guest Auth Promo or Logout */}
        {isGuest ? (
          <div className="guest-auth-prompt-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <IconUser size={18} color="#10B981" />
              <strong style={{ color: "#FFFFFF", fontSize: "0.92rem" }}>
                Want to save badges across devices?
              </strong>
            </div>
            <p style={{ color: "#A0A0A0", fontSize: "0.82rem", margin: "0 0 12px 0", lineHeight: 1.4 }}>
              Sign in anytime with Email or Google to link your pinned spots & climb the official leaderboard.
            </p>
            <button
              type="button"
              className="uber-cta-btn"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={onOpenAuth}
            >
              Sign In or Register
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="uber-secondary-btn"
            style={{ width: "100%", marginTop: 8, color: "#EF4444" }}
            onClick={logout}
          >
            Sign Out
          </button>
        )}

        {/* Pinned Spots Section */}
        <div style={{ width: "100%", textAlign: "left", marginTop: 12 }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 12px 0", color: "#FFFFFF" }}>
            Your Pinned Spots
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(profileData?.pinnedSpots || []).map((spot) => (
              <button
                key={spot.id}
                type="button"
                className="uber-feed-spot-link"
                style={{ width: "100%" }}
                onClick={() => onOpenSpot(spot)}
              >
                <div>
                  <strong style={{ display: "block", color: "#FFFFFF", fontSize: "0.92rem" }}>
                    {spot.name}
                  </strong>
                  <span style={{ color: "#A0A0A0", fontSize: "0.78rem" }}>
                    {getTypeMeta(spot.type).label}
                  </span>
                </div>
                <span style={{ color: "#FFFFFF", fontSize: "0.85rem", fontWeight: 700 }}>
                  View →
                </span>
              </button>
            ))}

            {!profileData?.pinnedSpots?.length && (
              <div style={{ padding: "18px", background: "#181818", border: "1px solid #262626", borderRadius: "14px", textAlign: "center", color: "#A0A0A0", fontSize: "0.85rem" }}>
                You haven't pinned any addas yet. Pin your first spot to earn +50 points!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
