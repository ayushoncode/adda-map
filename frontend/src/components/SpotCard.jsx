import {
  formatDistance,
  getDistance,
  getTypeColor,
  getTypeMeta,
  isOpenNow,
} from "../utils";
import { IconStar, IconNavigation, IconClock } from "../icons";

export default function SpotCard({ spot, userLocation, onOpen }) {
  const distance = userLocation
    ? getDistance(
        userLocation.lat,
        userLocation.lng,
        Number(spot.lat),
        Number(spot.lng)
      )
    : null;

  const typeMeta = getTypeMeta(spot.type);
  const photoUrl = spot.photos?.[0];
  const photoCount = spot.photos?.length || 0;
  const isCurrentlyOpen = isOpenNow(spot.openTime, spot.closeTime);

  const openDirections = (e) => {
    e.stopPropagation();
    if (spot.lat && spot.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`,
        "_blank"
      );
    }
  };

  return (
    <div
      className="cmhub-spot-card"
      onClick={() => onOpen(spot)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(spot);
        }
      }}
    >
      {/* Cover Image & Badges */}
      <div className="cmhub-spot-cover">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={spot.name}
            className="cmhub-spot-img"
            loading="lazy"
          />
        ) : (
          <div className="cmhub-spot-img-fallback">
            <span className="fallback-category">{typeMeta.label}</span>
          </div>
        )}

        <div className="cmhub-badge-top-left">
          <span className="uber-category-tag">{typeMeta.label}</span>
        </div>

        <div className="cmhub-badge-top-right">
          ₹{spot.priceMin || 0} – ₹{spot.priceMax || 0}
        </div>
      </div>

      {/* Card Body */}
      <div className="cmhub-card-body">
        <div className="cmhub-card-header-row">
          <h3 className="cmhub-card-title">{spot.name}</h3>
          <div className="cmhub-card-rating">
            <IconStar size={14} fill="#FFFFFF" />
            <span className="rating-value">{Number(spot.avgRating || 4.5).toFixed(1)}</span>
            <span className="cmhub-rating-reviews">({spot.reviewCount || 1})</span>
          </div>
        </div>

        <div className="cmhub-card-tags">
          <span
            className={`cmhub-status-chip ${
              isCurrentlyOpen ? "cmhub-status-open" : "cmhub-status-closed"
            }`}
          >
            <span className="status-indicator-dot" />
            <span>{isCurrentlyOpen ? "Open Now" : "Closed"}</span>
          </span>

          <span className="cmhub-dist-chip">
            <IconNavigation size={12} />
            <span>{distance !== null ? formatDistance(distance) : "Nearby"}</span>
          </span>
        </div>

        <p className="cmhub-card-snippet">
          {spot.lastReviewSnippet ||
            "Popular hangout spot with authentic food and verified recommendations."}
        </p>

        {/* Card Footer */}
        <div className="cmhub-card-footer">
          <span className="cmhub-address-text">
            {spot.address ? spot.address.split(",").slice(0, 2).join(",") : "Bangalore"}
          </span>

          <button
            type="button"
            className="uber-card-directions-btn"
            onClick={openDirections}
            title="Open turn-by-turn navigation in Google Maps"
          >
            <IconNavigation size={13} />
            <span>Directions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
