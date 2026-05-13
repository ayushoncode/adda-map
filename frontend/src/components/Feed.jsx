import { useEffect, useRef, useState } from "react";
import api from "../api";
import { formatDistance, getDistance, getLevelFromSpots, getTypeColor, getTypeMeta, initials, timeAgo } from "../utils";

const dostIds = ["friend-1", "friend-2", "friend-3"];

const getPinnedDistanceText = (item, userLocation) => {
  const distanceText =
    userLocation && Number.isFinite(item.spotLat) && Number.isFinite(item.spotLng)
      ? formatDistance(getDistance(userLocation.lat, userLocation.lng, Number(item.spotLat), Number(item.spotLng)))
      : null;

  return distanceText ? ` · ${distanceText}` : "";
};

export default function Feed({ onOpenSpot, onToast, userLocation }) {
  const [items, setItems] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const loadFeed = async (showLoader = false, silent = false) => {
    if (showLoader) setLoading(true);
    try {
      const response = await api.get("/feed");
      const nextItems = response.data.feed || [];
      if (silent && items.length) {
        const unseen = nextItems.filter((entry) => !items.some((existing) => existing.id === entry.id));
        if (unseen.length) {
          setPendingItems(unseen);
        }
      } else {
        setItems(nextItems);
        setPendingItems([]);
      }
    } catch {
      onToast("Could not load nearby activity", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed(true);
    const interval = setInterval(() => loadFeed(false, true), 30000);
    return () => clearInterval(interval);
  }, []);

  const revealPending = () => {
    setItems((current) => [...pendingItems, ...current]);
    setPendingItems([]);
  };

  const triggerRefresh = () => {
    setRefreshing(true);
    setTimeout(() => loadFeed(false), 800);
  };

  return (
    <section
      ref={containerRef}
      className="screen-section feed-screen"
      onTouchStart={(event) => {
        if (containerRef.current?.scrollTop === 0) startY.current = event.changedTouches[0].clientY;
      }}
      onTouchEnd={(event) => {
        if (event.changedTouches[0].clientY - startY.current > 90) triggerRefresh();
      }}
    >
      <div className="row between">
        <div>
          <h2>What’s happening near you</h2>
          <p className="muted">Real spots. Real people. No paid rankings.</p>
        </div>
        {refreshing && <div className="spinner" />}
      </div>

      {!!pendingItems.length && (
        <button type="button" className="updates-pill" onClick={revealPending}>
          {pendingItems.length} new updates
        </button>
      )}

      {loading ? (
        <div className="leaderboard-list">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton-row" />
          ))}
        </div>
      ) : !items.length ? (
        <div className="empty-card center">No activity yet. New pins and reviews from your area will show up here.</div>
      ) : (
        <div className="feed-list">
          {items.map((item, index) => {
            const level = getLevelFromSpots(item.spotsCount || 0);
            const typeMeta = getTypeMeta(item.type);
            const openSpot = () => onOpenSpot({ id: item.spotId, name: item.spotName, type: item.type });
            return (
              <article
                key={item.id}
                className="feed-card"
                style={{ animationDelay: `${index * 80}ms` }}
                onClick={openSpot}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSpot();
                  }
                }}
              >
                <div className="row gap-sm start">
                  <span className="reviewer-avatar big" style={{ background: item.avatarColor || "#364152" }}>
                    {initials(item.userName)}
                  </span>
                  <div className="grow">
                    <div className="row gap-sm wrap">
                      <strong>{item.userName}</strong>
                      <span className="badge inline-badge">{item.userLevel || `${level.icon} ${level.label}`}</span>
                      {dostIds.includes(item.userId) && <span className="badge badge-open">Friend</span>}
                    </div>
                    <p className="muted">
                      {item.action === "pinned" ? (
                        <>
                          pinned a new {typeMeta.label.toLowerCase()} spot
                          {getPinnedDistanceText(item, userLocation)}
                        </>
                      ) : item.action === "helpful" ? (
                        <>
                          found a helpful review at{" "}
                          <button
                            type="button"
                            className="spot-link-button"
                            style={{ color: getTypeColor(item.type) }}
                            onClick={(event) => {
                              event.stopPropagation();
                              openSpot();
                            }}
                          >
                            {item.spotName}
                          </button>{" "}
                          · {timeAgo(item.timestamp)}
                        </>
                      ) : item.meta?.rating ? (
                        <>
                          rated{" "}
                          <button
                            type="button"
                            className="spot-link-button"
                            style={{ color: getTypeColor(item.type) }}
                            onClick={(event) => {
                              event.stopPropagation();
                              openSpot();
                            }}
                          >
                            {item.spotName}
                          </button>{" "}
                          {item.meta.rating} stars · {timeAgo(item.timestamp)}
                        </>
                      ) : (
                        <>
                          left a review at{" "}
                          <button
                            type="button"
                            className="spot-link-button"
                            style={{ color: getTypeColor(item.type) }}
                            onClick={(event) => {
                              event.stopPropagation();
                              openSpot();
                            }}
                          >
                            {item.spotName}
                          </button>{" "}
                          · {timeAgo(item.timestamp)}
                        </>
                      )}
                    </p>
                    {item.action === "pinned" && (
                      <div className="row gap-sm wrap">
                        <span className="type-dot" style={{ background: getTypeColor(item.type) }} />
                        <span className="muted">{timeAgo(item.timestamp)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
