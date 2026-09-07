import { getLevelFromSpots, initials } from "../utils";

export default function Leaderboard({ users = [], currentUserId, loading }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton-card" style={{ height: 60 }} />
        ))}
      </div>
    );
  }

  if (!users.length) {
    return (
      <div style={{ textAlign: "center", color: "#A0A0A0", padding: "20px 0" }}>
        No scouts on the leaderboard yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {users.map((user, index) => {
        const level = getLevelFromSpots(user.spotsCount || 0);
        const isTop3 = index < 3;
        const rankText = `#${index + 1}`;

        return (
          <div
            key={user.id || index}
            className="uber-feed-card"
            style={{
              background: user.id === currentUserId ? "#1A1A1A" : "#121212",
              border: `1px solid ${user.id === currentUserId ? "#FFFFFF" : "#262626"}`,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 800,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: isTop3 ? "#FFFFFF" : "#222222",
                color: isTop3 ? "#000000" : "#A0A0A0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {rankText}
            </div>

            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#262626",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: 800,
              }}
            >
              {initials(user.name)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <strong style={{ color: "#FFFFFF", fontSize: "0.92rem" }}>
                  {user.name}
                </strong>
                <span className="uber-category-tag" style={{ margin: 0 }}>
                  {level.label}
                </span>
              </div>
              <div style={{ color: "#A0A0A0", fontSize: "0.76rem", marginTop: 2 }}>
                {user.spotsCount || 0} spots pinned • {user.reviewsCount || 0} reviews
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "1rem" }}>
                {user.scoutPoints || 0}
              </div>
              <div style={{ color: "#A0A0A0", fontSize: "0.68rem", textTransform: "uppercase" }}>pts</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
