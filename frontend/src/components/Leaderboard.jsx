import { getLevelFromSpots, initials } from "../utils";

export default function Leaderboard({ users = [], currentUserId, loading }) {
  if (loading) {
    return (
      <div className="leaderboard-list">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton-row" />
        ))}
      </div>
    );
  }

  return (
    <div className="leaderboard-list">
      {users.map((user, index) => {
        const level = getLevelFromSpots(user.spotsCount || 0);
        return (
          <div
            key={user.id}
            className={`leader-row ${user.id === currentUserId ? "leader-row-active" : ""}`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="leader-rank">{index + 1}</div>
            <span className="reviewer-avatar big" style={{ background: user.avatarColor || "#384355" }}>
              {initials(user.name)}
            </span>
            <div className="grow">
              <div className="row gap-sm wrap">
                <strong>{user.name}</strong>
                <span className="badge inline-badge" style={{ color: level.color }}>
                  {level.icon} {level.label}
                </span>
              </div>
              <p className="muted">
                {user.spotsCount || 0} spots · {user.reviewsCount || 0} reviews · {user.helpfulVotesReceived || 0} helpful
              </p>
            </div>
            <strong>{user.scoutPoints || 0}</strong>
          </div>
        );
      })}
    </div>
  );
}
