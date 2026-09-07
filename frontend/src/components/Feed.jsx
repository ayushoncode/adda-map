import { useEffect, useState } from "react";
import api from "../api";
import { formatDistance, getDistance, getTypeMeta, initials, timeAgo } from "../utils";
import { IconActivity, IconNavigation } from "../icons";

export default function Feed({ onOpenSpot, onToast, userLocation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const res = await api.get("/feed");
      setItems(res.data.feed || []);
    } catch {
      onToast("Could not load activity feed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  return (
    <div className="activity-feed-container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 className="uber-main-title">
            Live Activity
          </h1>
          <p className="uber-subtitle">
            Real-time reviews and newly pinned spots by scouts.
          </p>
        </div>
        <button type="button" className="uber-secondary-btn" onClick={loadFeed}>
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="skeleton-card" style={{ height: 120 }} />
          ))}
        </div>
      ) : !items.length ? (
        <div className="cmhub-empty-box">
          <div className="uber-empty-icon-circle">
            <IconActivity size={24} />
          </div>
          <strong>No recent activity</strong>
          <p>Be the first to pin a new food spot or write a review!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((item, idx) => {
            const typeMeta = getTypeMeta(item.type);
            const dist =
              userLocation && item.spotLat && item.spotLng
                ? formatDistance(
                    getDistance(
                      userLocation.lat,
                      userLocation.lng,
                      Number(item.spotLat),
                      Number(item.spotLng)
                    )
                  )
                : null;

            return (
              <div
                key={idx}
                className="uber-feed-card"
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      className="cmhub-user-avatar"
                      style={{ background: "#262626", color: "#FFFFFF" }}
                    >
                      {initials(item.userName)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#FFFFFF" }}>
                        {item.userName}
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#A0A0A0" }}>
                        {item.action === "pinned" ? "Added a new spot" : "Reviewed a spot"} • {timeAgo(item.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Text */}
                {item.meta?.reviewSnippet && (
                  <p style={{ margin: "6px 0", color: "#D4D4D8", fontSize: "0.88rem", lineHeight: 1.5 }}>
                    “{item.meta.reviewSnippet}”
                  </p>
                )}

                {/* Linked Spot Card */}
                {item.spotName && (
                  <button
                    type="button"
                    className="uber-feed-spot-link"
                    onClick={() =>
                      onOpenSpot?.({
                        id: item.spotId,
                        name: item.spotName,
                        type: item.type,
                      })
                    }
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#FFFFFF" }}>
                        {item.spotName}
                      </div>
                      {dist && (
                        <div style={{ fontSize: "0.76rem", color: "#A0A0A0", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <IconNavigation size={12} />
                          <span>{dist}</span>
                        </div>
                      )}
                    </div>
                    <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.85rem" }}>
                      View Details →
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
