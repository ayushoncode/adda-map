import { useState, useMemo } from "react";
import { getLevelFromSpots, initials } from "../utils";
import {
  IconCrown,
  IconMedal,
  IconTrophy,
  IconSparkles,
  IconPlus,
  IconFlame,
  IconZap,
  IconLocation,
  IconStar,
} from "../icons";

export default function Leaderboard({
  users = [],
  currentUserId,
  loading,
  onOpenAdd,
  period = "alltime",
  onPeriodChange,
  sortMetric = "points",
  onSortChange,
}) {
  const [activeMetric, setActiveMetric] = useState(sortMetric);

  const handleMetricSelect = (metric) => {
    setActiveMetric(metric);
    onSortChange?.(metric);
  };

  const sortedUsers = useMemo(() => {
    if (!users || !users.length) return [];
    const list = [...users];
    if (activeMetric === "spots") {
      list.sort((a, b) => (Number(b.spotsCount) || 0) - (Number(a.spotsCount) || 0));
    } else if (activeMetric === "reviews") {
      list.sort((a, b) => (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0));
    } else {
      list.sort((a, b) => (Number(b.scoutPoints) || 0) - (Number(a.scoutPoints) || 0));
    }
    return list;
  }, [users, activeMetric]);

  const top3 = sortedUsers.slice(0, 3);
  const remaining = sortedUsers.slice(3);

  const goldUser = top3[0];
  const silverUser = top3[1];
  const bronzeUser = top3[2];

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-skeleton-header" />
        <div className="leaderboard-podium-skeleton">
          <div className="skeleton-podium-bar silver" />
          <div className="skeleton-podium-bar gold" />
          <div className="skeleton-podium-bar bronze" />
        </div>
        <div className="leaderboard-list-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-card" style={{ height: 68, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      {/* Hero Header */}
      <div className="leaderboard-hero-card">
        <div className="leaderboard-hero-sparkle">
          <IconSparkles size={22} color="#F59E0B" />
        </div>
        <div className="leaderboard-hero-content">
          <div className="leaderboard-badge-pill">
            <IconFlame size={14} color="#EF4444" />
            <span>SEASON 1 • BANGALORE LEAGUE</span>
          </div>
          <h1 className="leaderboard-title">Top Scouts Leaderboard</h1>
          <p className="leaderboard-subtitle">
            Ranked by Bangalore foodies discovering the best chai spots, secret biryanis & night addas.
          </p>
        </div>

        {/* Quick Point Rules Bar */}
        <div className="leaderboard-perks-strip">
          <div className="perk-chip">
            <span className="perk-pts">+50</span>
            <span className="perk-label">Pin Spot</span>
          </div>
          <div className="perk-chip">
            <span className="perk-pts">+25</span>
            <span className="perk-label">Spot Photo</span>
          </div>
          <div className="perk-chip">
            <span className="perk-pts">+15</span>
            <span className="perk-label">Review</span>
          </div>
          <div className="perk-chip">
            <span className="perk-pts">+5</span>
            <span className="perk-label">Helpful Upvote</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="leaderboard-filter-bar">
        <div className="leaderboard-tabs-scroll">
          <button
            type="button"
            className={`leaderboard-tab-btn ${activeMetric === "points" ? "active" : ""}`}
            onClick={() => handleMetricSelect("points")}
          >
            <IconTrophy size={15} />
            <span>All Points</span>
          </button>
          <button
            type="button"
            className={`leaderboard-tab-btn ${activeMetric === "spots" ? "active" : ""}`}
            onClick={() => handleMetricSelect("spots")}
          >
            <IconLocation size={15} />
            <span>Most Spots</span>
          </button>
          <button
            type="button"
            className={`leaderboard-tab-btn ${activeMetric === "reviews" ? "active" : ""}`}
            onClick={() => handleMetricSelect("reviews")}
          >
            <IconStar size={15} fill="currentColor" />
            <span>Top Reviewers</span>
          </button>
        </div>

        {onPeriodChange && (
          <div className="leaderboard-period-toggle">
            <button
              type="button"
              className={`period-pill ${period === "alltime" ? "active" : ""}`}
              onClick={() => onPeriodChange("alltime")}
            >
              All-Time
            </button>
            <button
              type="button"
              className={`period-pill ${period === "week" ? "active" : ""}`}
              onClick={() => onPeriodChange("week")}
            >
              This Week
            </button>
          </div>
        )}
      </div>

      {/* Top 3 Podium Section */}
      {sortedUsers.length > 0 ? (
        <div className="leaderboard-podium-section">
          {/* Silver - Rank 2 */}
          <div className="podium-card rank-2">
            <div className="podium-pedestal-wrap">
              {silverUser ? (
                <>
                  <div className="podium-medal-badge silver">
                    <IconMedal size={18} />
                    <span>#2</span>
                  </div>
                  <div
                    className="podium-avatar silver-glow"
                    style={{ background: silverUser.avatarColor || "#4B5563" }}
                  >
                    {initials(silverUser.name)}
                  </div>
                  <div className="podium-user-name" title={silverUser.name}>
                    {silverUser.name}
                  </div>
                  <span className="podium-tier-tag">
                    {getLevelFromSpots(silverUser.spotsCount || 0).label}
                  </span>
                  <div className="podium-points-tag silver-tag">
                    <span className="points-number">{silverUser.scoutPoints || 0}</span>
                    <span className="points-text">pts</span>
                  </div>
                  <div className="podium-stats-micro">
                    {silverUser.spotsCount || 0} spots • {silverUser.reviewsCount || 0} reviews
                  </div>
                </>
              ) : (
                <div className="podium-empty-slot">
                  <div className="podium-medal-badge silver">#2</div>
                  <div className="empty-slot-circle">?</div>
                  <div className="podium-user-name">Open Rank</div>
                  <span className="podium-tier-tag">Available</span>
                </div>
              )}
              <div className="podium-pedestal silver-bar">
                <span className="pedestal-rank-num">2</span>
              </div>
            </div>
          </div>

          {/* Gold - Rank 1 (Tallest Center) */}
          <div className="podium-card rank-1">
            <div className="podium-pedestal-wrap">
              {goldUser ? (
                <>
                  <div className="podium-crown-floating">
                    <IconCrown size={28} color="#F59E0B" />
                  </div>
                  <div className="podium-medal-badge gold">
                    <IconTrophy size={18} />
                    <span>#1</span>
                  </div>
                  <div
                    className="podium-avatar gold-glow"
                    style={{ background: goldUser.avatarColor || "#F59E0B" }}
                  >
                    {initials(goldUser.name)}
                  </div>
                  <div className="podium-user-name champion" title={goldUser.name}>
                    {goldUser.name}
                  </div>
                  <span className="podium-tier-tag gold-tier">
                    {getLevelFromSpots(goldUser.spotsCount || 0).label}
                  </span>
                  <div className="podium-points-tag gold-tag">
                    <span className="points-number">{goldUser.scoutPoints || 0}</span>
                    <span className="points-text">pts</span>
                  </div>
                  <div className="podium-stats-micro">
                    {goldUser.spotsCount || 0} spots • {goldUser.reviewsCount || 0} reviews
                  </div>
                </>
              ) : (
                <div className="podium-empty-slot">
                  <div className="podium-crown-floating">
                    <IconCrown size={28} color="#F59E0B" />
                  </div>
                  <div className="podium-medal-badge gold">#1</div>
                  <div className="empty-slot-circle gold"><IconCrown size={22} color="#F59E0B" /></div>
                  <div className="podium-user-name champion">Leader Slot</div>
                  <span className="podium-tier-tag gold-tier">Claim with 1 Pin</span>
                </div>
              )}
              <div className="podium-pedestal gold-bar">
                <span className="pedestal-rank-num">1</span>
              </div>
            </div>
          </div>

          {/* Bronze - Rank 3 */}
          <div className="podium-card rank-3">
            <div className="podium-pedestal-wrap">
              {bronzeUser ? (
                <>
                  <div className="podium-medal-badge bronze">
                    <IconMedal size={18} />
                    <span>#3</span>
                  </div>
                  <div
                    className="podium-avatar bronze-glow"
                    style={{ background: bronzeUser.avatarColor || "#D97706" }}
                  >
                    {initials(bronzeUser.name)}
                  </div>
                  <div className="podium-user-name" title={bronzeUser.name}>
                    {bronzeUser.name}
                  </div>
                  <span className="podium-tier-tag">
                    {getLevelFromSpots(bronzeUser.spotsCount || 0).label}
                  </span>
                  <div className="podium-points-tag bronze-tag">
                    <span className="points-number">{bronzeUser.scoutPoints || 0}</span>
                    <span className="points-text">pts</span>
                  </div>
                  <div className="podium-stats-micro">
                    {bronzeUser.spotsCount || 0} spots • {bronzeUser.reviewsCount || 0} reviews
                  </div>
                </>
              ) : (
                <div className="podium-empty-slot">
                  <div className="podium-medal-badge bronze">#3</div>
                  <div className="empty-slot-circle">?</div>
                  <div className="podium-user-name">Open Rank</div>
                  <span className="podium-tier-tag">Available</span>
                </div>
              )}
              <div className="podium-pedestal bronze-bar">
                <span className="pedestal-rank-num">3</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Fresh Season Empty State (Vibrant & Motivating) */
        <div className="leaderboard-empty-fresh-card">
          <div className="fresh-podium-preview">
            <div className="fresh-slot silver">
              <span className="slot-badge">#2</span>
              <div className="slot-circle"><IconMedal size={22} color="#94A3B8" /></div>
              <span className="slot-title">Silver Scout</span>
            </div>
            <div className="fresh-slot gold">
              <span className="slot-badge">#1</span>
              <div className="slot-circle"><IconCrown size={24} color="#F59E0B" /></div>
              <span className="slot-title">Adda Champion</span>
            </div>
            <div className="fresh-slot bronze">
              <span className="slot-badge">#3</span>
              <div className="slot-circle"><IconMedal size={22} color="#D97706" /></div>
              <span className="slot-title">Bronze Pioneer</span>
            </div>
          </div>

          <div className="fresh-callout-body">
            <h3>Be the #1 Founding Scout</h3>
            <p>
              The database has been wiped clean for a fresh start. Pin Bangalore's favorite chai tapri,
              late-night parotta stall, or hidden cafe to instantly seize the #1 spot on the podium!
            </p>
            {onOpenAdd && (
              <button
                type="button"
                className="leaderboard-cta-btn"
                onClick={onOpenAdd}
              >
                <IconPlus size={18} />
                <span>Pin a Spot & Claim #1</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ranked Scouts List (#4 and below) */}
      {remaining.length > 0 && (
        <div className="leaderboard-list-card">
          <div className="leaderboard-list-title">
            <span>Official Standings</span>
            <span className="count-pill">{sortedUsers.length} Scouts</span>
          </div>

          <div className="scout-rows-container">
            {remaining.map((user, idx) => {
              const rank = idx + 4;
              const isCurrentUser = user.id === currentUserId;
              const level = getLevelFromSpots(user.spotsCount || 0);

              return (
                <div
                  key={user.id || idx}
                  className={`scout-rank-row ${isCurrentUser ? "is-current-user" : ""}`}
                >
                  <div className="scout-rank-badge">#{rank}</div>

                  <div
                    className="scout-row-avatar"
                    style={{ background: user.avatarColor || "#262626" }}
                  >
                    {initials(user.name)}
                  </div>

                  <div className="scout-row-meta">
                    <div className="scout-row-name-line">
                      <strong className="scout-name">{user.name}</strong>
                      {isCurrentUser && <span className="you-badge">YOU</span>}
                      <span className="scout-tier-badge">{level.label}</span>
                    </div>
                    <div className="scout-row-sub">
                      <span>{user.spotsCount || 0} spots pinned</span>
                      <span className="dot-sep">•</span>
                      <span>{user.reviewsCount || 0} reviews</span>
                      {user.area && (
                        <>
                          <span className="dot-sep">•</span>
                          <span className="scout-area">{user.area}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="scout-points-pill">
                    <span className="points-val">{user.scoutPoints || 0}</span>
                    <span className="points-unit">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scout Rank Tiers Guide */}
      <div className="scout-tiers-guide-card">
        <h4 className="guide-title">
          <IconZap size={16} color="#10B981" />
          <span>Scout Progression Tiers</span>
        </h4>
        <div className="tiers-grid">
          <div className="tier-box">
            <span className="tier-rank-icon"><IconMedal size={18} color="#D97706" /></span>
            <div className="tier-name">Food Explorer</div>
            <span className="tier-req">0 – 5 spots pinned</span>
          </div>
          <div className="tier-box">
            <span className="tier-rank-icon"><IconMedal size={18} color="#94A3B8" /></span>
            <div className="tier-name">Street Scout</div>
            <span className="tier-req">6 – 15 spots pinned</span>
          </div>
          <div className="tier-box">
            <span className="tier-rank-icon"><IconMedal size={18} color="#F59E0B" /></span>
            <div className="tier-name">Adda Legend</div>
            <span className="tier-req">16 – 30 spots pinned</span>
          </div>
          <div className="tier-box highlight">
            <span className="tier-rank-icon"><IconCrown size={18} color="#F59E0B" /></span>
            <div className="tier-name">City Champion</div>
            <span className="tier-req">31+ spots pinned</span>
          </div>
        </div>
      </div>
    </div>
  );
}
