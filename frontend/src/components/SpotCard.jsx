import {
  formatDistance,
  getDistance,
  getSpotTags,
  getTypeColor,
  initials,
  isOpenNow,
  timeAgo,
} from "../utils";

export default function SpotCard({ spot, userLocation, onOpen }) {
  const distance = userLocation
    ? getDistance(userLocation.lat, userLocation.lng, Number(spot.lat), Number(spot.lng))
    : null;
  const tags = getSpotTags(spot).slice(0, 2);
  const typeLabel = spot.type === "biryani" ? "Biryani 🍛" : "Chai ☕";

  return (
    <button type="button" className="spot-card" onClick={() => onOpen(spot)}>
      <div className="spot-card-header">
        <div>
          <h3>{spot.name}</h3>
          <div className="row gap-sm">
            <span className="badge" style={{ background: `${getTypeColor(spot.type)}22`, color: getTypeColor(spot.type) }}>
              {typeLabel}
            </span>
            <span className={`badge ${isOpenNow(spot.openTime, spot.closeTime) ? "badge-open" : "badge-closed"}`}>
              {isOpenNow(spot.openTime, spot.closeTime) ? "Open" : "Closed"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <strong>{distance ? formatDistance(distance) : "Nearby"}</strong>
          <p>₹{spot.priceMin} - ₹{spot.priceMax}</p>
        </div>
      </div>

      <p className="spot-snippet">
        “{spot.lastReviewSnippet || "Good food, warm vibe, and the kind of place people bring their friends."}”
      </p>

      <div className="spot-card-footer">
        <div className="rating-line">
          <span>⭐ {Number(spot.avgRating || 0).toFixed(1)}</span>
          <span>{spot.reviewCount || 0} reviews</span>
        </div>
        <div className="reviewer-stack">
          {(spot.recentReviewers || []).slice(0, 3).map((reviewer, index) => (
            <span
              key={`${reviewer.userName}-${index}`}
              className="reviewer-avatar"
              style={{ background: reviewer.userAvatarColor || "#39404e" }}
            >
              {initials(reviewer.userName)}
            </span>
          ))}
        </div>
      </div>

      <div className="row gap-sm wrap">
        {tags.map((tag) => (
          <span key={tag.label} className="badge" style={{ background: `${tag.color}18`, color: tag.color }}>
            {tag.label}
          </span>
        ))}
        {spot.pinnedAt && <span className="muted">{timeAgo(spot.pinnedAt)}</span>}
      </div>
    </button>
  );
}
