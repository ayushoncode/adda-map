import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import api from "../api";
import { auth } from "../firebase";
import { getLevelFromSpots, getNextLevelTarget, getSpotsToNextLevel, getTypeMeta, initials } from "../utils";
import Leaderboard from "./Leaderboard";

export default function Profile({ user, onToast, onOpenSpot }) {
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState("alltime");
  const [loadingBoard, setLoadingBoard] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    api.get(`/users/${user.uid}`).then((response) => setProfile(response.data));
  }, [user?.uid]);

  useEffect(() => {
    setLoadingBoard(true);
    api
      .get(`/leaderboard?period=${period === "week" ? "week" : "alltime"}`)
      .then((response) => setLeaderboard(response.data.users || []))
      .catch(() => onToast("Could not load the leaderboard", "error"))
      .finally(() => setLoadingBoard(false));
  }, [period, onToast]);

  const activeUser = profile?.user;
  const level = useMemo(() => getLevelFromSpots(activeUser?.spotsCount || 0), [activeUser?.spotsCount]);
  const nextTarget = getNextLevelTarget(activeUser?.spotsCount || 0);
  const progress =
    nextTarget === Infinity || !nextTarget
      ? 100
      : Math.min(100, ((activeUser?.spotsCount || 0) / nextTarget) * 100);
  const spotsToNextLevel = getSpotsToNextLevel(activeUser?.spotsCount || 0);
  const nextLevel = getLevelFromSpots((activeUser?.spotsCount || 0) + spotsToNextLevel + 1);

  const logout = async () => {
    await signOut(auth);
    onToast("You have been logged out.", "info");
  };

  if (!activeUser) {
    return <div className="screen-section"><div className="empty-card">Loading your profile…</div></div>;
  }

  return (
    <div className="screen-section">
      <section className="profile-card">
        <span className="profile-avatar" style={{ background: activeUser.avatarColor || "#384355" }}>
          {initials(activeUser.name)}
        </span>
        <h2>{activeUser.name}</h2>
        <p className="muted">{activeUser.area}</p>
        <div className="badge badge-large" style={{ color: level.color }}>
          {level.icon} {level.label}
        </div>

        <div className="progress-shell">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="muted">
          {activeUser.spotsCount || 0}/{nextTarget === Infinity ? activeUser.spotsCount || 0 : nextTarget} spots · {activeUser.scoutPoints || 0} points
        </p>
        {!!spotsToNextLevel && (
          <p className="muted">
            {spotsToNextLevel} more spots to become a {nextLevel.label}
          </p>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <strong>{activeUser.spotsCount || 0}</strong>
            <span>Spots pinned</span>
          </div>
          <div className="stat-card">
            <strong>{activeUser.reviewsCount || 0}</strong>
            <span>Reviews written</span>
          </div>
          <div className="stat-card">
            <strong>{activeUser.helpfulVotesReceived || 0}</strong>
            <span>People helped</span>
          </div>
        </div>

        <div>
          <h3>Your pins</h3>
          <div className="pin-strip">
            {(profile?.pinnedSpots || []).map((spot) => (
              <button key={spot.id} type="button" className="pin-mini-card" onClick={() => onOpenSpot(spot)}>
                <strong>{spot.name}</strong>
                <span>{getTypeMeta(spot.type).fullLabel}</span>
              </button>
            ))}
            {!profile?.pinnedSpots?.length && <div className="empty-card">You have not pinned a spot yet. Add your first favourite place to get started.</div>}
          </div>
        </div>

        <button type="button" className="ghost-button" onClick={logout}>
          Logout
        </button>
      </section>

      <section className="profile-card">
        <div className="row between">
          <h3>Leaderboard</h3>
          <div className="toggle-wrap">
            {["week", "alltime"].map((value) => (
              <button
                key={value}
                type="button"
                className={`toggle-button ${period === value ? "active" : ""}`}
                onClick={() => setPeriod(value)}
              >
                {value === "week" ? "Week" : "All Time"}
              </button>
            ))}
          </div>
        </div>
        <Leaderboard
          users={
            leaderboard.some((entry) => entry.id === activeUser.id)
              ? leaderboard
              : [...leaderboard, activeUser]
          }
          currentUserId={activeUser.id}
          loading={loadingBoard}
        />
      </section>
    </div>
  );
}
