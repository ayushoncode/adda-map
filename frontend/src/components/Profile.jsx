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
import Leaderboard from "./Leaderboard";
import { IconLocation } from "../icons";

export default function Profile({ user, onToast, onOpenSpot }) {
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState("alltime");
  const [loadingBoard, setLoadingBoard] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    api.get(`/users/${user.uid}`).then((res) => setProfile(res.data));
  }, [user?.uid]);

  useEffect(() => {
    setLoadingBoard(true);
    api
      .get(`/leaderboard?period=${period === "week" ? "week" : "alltime"}`)
      .then((res) => setLeaderboard(res.data.users || []))
      .catch(() => onToast("Could not load the leaderboard", "error"))
      .finally(() => setLoadingBoard(false));
  }, [period, onToast]);

  const activeUser = profile?.user;
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

  const logout = async () => {
    await signOut(auth);
    onToast("You have been signed out.", "info");
  };

  if (!activeUser) {
    return (
      <div className="profile-view-container">
        <div className="skeleton-card" style={{ height: 240 }} />
      </div>
    );
  }

  return (
    <div className="profile-view-container">
      {/* Profile Card */}
      <section className="cmhub-profile-card uber-profile-card">
        <div
          className="profile-large-avatar"
          style={{ background: "#262626", color: "#FFFFFF" }}
        >
          {initials(activeUser.name)}
        </div>

        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF" }}>
            {activeUser.name}
          </h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ color: "#A0A0A0", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4 }}>
              <IconLocation size={14} />
              <span>{activeUser.area || "Bangalore"}</span>
            </span>
            <span className="uber-category-tag">
              VERIFIED SCOUT
            </span>
          </div>
        </div>

        {/* Level & Points Progress */}
        <div style={{ width: "100%", background: "#181818", border: "1px solid #262626", borderRadius: "14px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.85rem", fontWeight: 700 }}>
            <span style={{ color: "#FFFFFF" }}>
              Level: {level.label}
            </span>
            <span style={{ color: "#A0A0A0" }}>
              {activeUser.scoutPoints || 0} Points
            </span>
          </div>

          <div style={{ width: "100%", height: 6, background: "#262626", borderRadius: "9999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "#FFFFFF",
                borderRadius: "9999px",
                transition: "width 400ms ease",
              }}
            />
          </div>

          {!!spotsToNextLevel && (
            <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#A0A0A0" }}>
              Pin {spotsToNextLevel} more spots to level up
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
            <strong>{activeUser.helpfulVotesReceived || 0}</strong>
            <span>Helpful Votes</span>
          </div>
        </div>

        {/* User Pinned Spots */}
        <div style={{ width: "100%", textAlign: "left", marginTop: 8 }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 12px 0", color: "#FFFFFF" }}>
            Your Pinned Spots
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(profile?.pinnedSpots || []).map((spot) => (
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

            {!profile?.pinnedSpots?.length && (
              <div style={{ padding: "16px", background: "#181818", border: "1px solid #262626", borderRadius: "12px", textAlign: "center", color: "#A0A0A0", fontSize: "0.85rem" }}>
                You have not pinned any spots yet.
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          className="uber-secondary-btn"
          style={{ width: "100%", marginTop: 8, color: "#E11900" }}
          onClick={logout}
        >
          Sign Out
        </button>
      </section>

      {/* Leaderboard Section */}
      <section style={{ background: "#121212", border: "1px solid #262626", borderRadius: "20px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#FFFFFF" }}>
            Top Scouts
          </h3>

          <div className="cmhub-segmented-tabs" style={{ padding: 2 }}>
            <button
              type="button"
              className={`cmhub-segment-btn ${period === "alltime" ? "active" : ""}`}
              style={{ padding: "6px 14px", fontSize: "0.78rem" }}
              onClick={() => setPeriod("alltime")}
            >
              All Time
            </button>
            <button
              type="button"
              className={`cmhub-segment-btn ${period === "week" ? "active" : ""}`}
              style={{ padding: "6px 14px", fontSize: "0.78rem" }}
              onClick={() => setPeriod("week")}
            >
              This Week
            </button>
          </div>
        </div>

        <Leaderboard users={leaderboard} loading={loadingBoard} />
      </section>
    </div>
  );
}
