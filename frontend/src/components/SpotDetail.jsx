import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import { formatAreaLabel, getCityKey, getTypeColor, haversineKm, initials, isOpenNow, timeAgo } from "../utils";

const getTypeMeta = (type) =>
  type === "biryani"
    ? { emoji: "🍛", label: "Biryani", color: "#1D9E75" }
    : { emoji: "☕", label: "Chai", color: "#E8A020" };

const formatDistanceAway = (distanceKm) => {
  if (distanceKm === null || Number.isNaN(distanceKm)) return "Distance unavailable";
  return `${distanceKm.toFixed(1)} km away`;
};

const isSameLocalDay = (value, comparison) => {
  const date = new Date(value);
  return (
    date.getFullYear() === comparison.getFullYear() &&
    date.getMonth() === comparison.getMonth() &&
    date.getDate() === comparison.getDate()
  );
};

const StarDisplay = ({ value, color, muted = false }) => (
  <div className={`detail-stars ${muted ? "muted" : ""}`} aria-label={`${value} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, index) => {
      const filled = index < Math.round(value);
      return (
        <span
          key={index}
          className={`detail-star ${filled ? "filled" : ""}`}
          style={filled ? { color } : undefined}
        >
          ★
        </span>
      );
    })}
  </div>
);

const StarPicker = ({ value, onChange, color }) => (
  <div className="detail-star-picker">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`detail-star-button ${value >= star ? "selected" : ""}`}
        style={value >= star ? { color } : undefined}
        onClick={() => onChange(star)}
      >
        ★
      </button>
    ))}
  </div>
);

export default function SpotDetail({ spot, user, userLocation, onClose, onToast, onUpdated, onOpenSpot }) {
  const [detail, setDetail] = useState(null);
  const [similarSpots, setSimilarSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gpsChecking, setGpsChecking] = useState(false);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [gpsState, setGpsState] = useState({ verified: false, coords: null, distanceKm: null });
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef(0);
  const dragOffsetRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!spot?.id) return;
    let ignore = false;
    setLoading(true);
    setIsReviewFormOpen(false);
    setText("");
    setRating(5);
    setGpsState({ verified: false, coords: null, distanceKm: null });
    setDragOffset(0);
    dragOffsetRef.current = 0;
    api
      .get(`/spots/${spot.id}`)
      .then((response) => {
        if (!ignore) setDetail(response.data);
      })
      .catch(() => onToast("Could not load spot details", "error"))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [spot?.id, onToast]);

  useEffect(() => {
    if (!spot?.id || !spot?.type || spot?.lat == null || spot?.lng == null) return;
    let ignore = false;

    api
      .get(`/spots?lat=${spot.lat}&lng=${spot.lng}&type=${spot.type}${user?.area ? `&area=${encodeURIComponent(user.area)}` : ""}`)
      .then((response) => {
        if (ignore) return;
        const nearby = (response.data.spots || [])
          .filter((entry) => entry.id !== spot.id)
          .map((entry) => ({
            ...entry,
            distanceKm: haversineKm(Number(spot.lat), Number(spot.lng), Number(entry.lat), Number(entry.lng)),
          }))
          .filter((entry) => entry.distanceKm !== null && entry.distanceKm <= 2)
          .slice(0, 3);
        setSimilarSpots(nearby);
      })
      .catch(() => {
        if (!ignore) setSimilarSpots([]);
      });

    return () => {
      ignore = true;
    };
  }, [spot?.id, spot?.lat, spot?.lng, spot?.type, user?.area]);

  const activeSpot = detail?.spot || spot;
  const typeMeta = getTypeMeta(activeSpot?.type);
  const typeColor = getTypeColor(activeSpot?.type);
  const reviews = detail?.reviews || [];
  const reviewCount = Number(activeSpot?.reviewCount || reviews.length || 0);
  const avgRating = Number(activeSpot?.avgRating || 0).toFixed(1);
  const isOpen = isOpenNow(activeSpot?.openTime, activeSpot?.closeTime);
  const distance = useMemo(() => {
    if (!userLocation || !activeSpot) return null;
    return haversineKm(userLocation.lat, userLocation.lng, Number(activeSpot.lat), Number(activeSpot.lng));
  }, [userLocation, activeSpot]);
  const reviewsToday = useMemo(() => {
    const now = new Date();
    return reviews.filter((review) => review?.timestamp && isSameLocalDay(review.timestamp, now)).length;
  }, [reviews]);
  const localLoveCount = useMemo(() => {
    if (Number(activeSpot?.localLoveCount || 0) > 0) return Number(activeSpot.localLoveCount);
    const cityKey = getCityKey(user?.area);
    if (!cityKey) return 0;
    return reviews.filter((review) => getCityKey(review.userArea) === cityKey).length;
  }, [activeSpot?.localLoveCount, reviews, user?.area]);

  const verifyGps = () => {
    if (!navigator.geolocation) {
      onToast("Geolocation is not available on this device", "error");
      return;
    }

    setGpsChecking(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const distanceKmFromSpot = haversineKm(
          coords.lat,
          coords.lng,
          Number(activeSpot.lat),
          Number(activeSpot.lng)
        );

        if (distanceKmFromSpot === null || distanceKmFromSpot > 0.2) {
          setGpsState({ verified: false, coords, distanceKm: distanceKmFromSpot });
          onToast("You need to be within 200m of this spot to post a GPS-verified review.", "error");
          setGpsChecking(false);
          return;
        }

        setGpsState({ verified: true, coords, distanceKm: distanceKmFromSpot });
        onToast("GPS verified. You are close enough to review this spot.", "success");
        setGpsChecking(false);
      },
      () => {
        setGpsChecking(false);
        onToast("We could not fetch your location right now.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitReview = async () => {
    if (!text.trim()) {
      onToast("Write a few words before posting your review.", "error");
      return;
    }
    if (!gpsState.verified || !gpsState.coords) {
      onToast("Verify your GPS location before submitting.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/spots/${activeSpot.id}/reviews`, {
        rating,
        text,
        lat: gpsState.coords.lat,
        lng: gpsState.coords.lng,
      });
      onToast("Review posted. +20 points", "success");
      setText("");
      setRating(5);
      setGpsState({ verified: false, coords: null, distanceKm: null });
      setIsReviewFormOpen(false);
      const refreshed = await api.get(`/spots/${activeSpot.id}`);
      setDetail(refreshed.data);
      onUpdated?.();
    } catch (error) {
      onToast(error.response?.data?.error || "Could not post your review.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const markHelpful = async (reviewId) => {
    try {
      await api.put(`/spots/${activeSpot.id}/reviews/${reviewId}/helpful`, {
        type: activeSpot.type,
      });
      onToast("Helpful vote added.", "success");
      const refreshed = await api.get(`/spots/${activeSpot.id}`);
      setDetail(refreshed.data);
      onUpdated?.();
    } catch {
      onToast("Could not record the helpful vote.", "error");
    }
  };

  const shareSpot = async () => {
    const textToCopy = `${typeMeta.emoji} Found ${activeSpot.name} on Adda Map!\n⭐ ${avgRating}/5 · ${reviewCount} reviews\n📍 ${activeSpot.address}\n💰 ₹${activeSpot.priceMin}–₹${activeSpot.priceMax}\nYour city's best kept food secrets`;
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(textToCopy);
      onToast("Spot details copied to the clipboard.", "success");
    } catch {
      onToast("Could not copy the share text right now.", "error");
    }
  };

  const openDirections = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${activeSpot.lat},${activeSpot.lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const startDrag = (clientY) => {
    draggingRef.current = true;
    dragStartY.current = clientY;
  };

  const updateDrag = (clientY) => {
    if (!draggingRef.current) return;
    const nextOffset = Math.max(0, clientY - dragStartY.current);
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (dragOffsetRef.current > 120) {
      onClose();
      return;
    }
    dragOffsetRef.current = 0;
    setDragOffset(0);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className={`spot-sheet spot-sheet-upgraded ${dragOffset ? "dragging" : ""}`}
        style={{ transform: `translateY(${dragOffset}px)` }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="sheet-handle sheet-handle-button"
          aria-label="Drag to dismiss"
          onPointerDown={(event) => {
            startDrag(event.clientY);
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={(event) => updateDrag(event.clientY)}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />

        {loading ? (
          <div className="sheet-loading">Loading spot details…</div>
        ) : (
          <>
            <div className="spot-sheet-scroll">
              <header className="detail-hero">
                <div className="detail-hero-copy">
                  <h2 className="detail-title">{activeSpot.name}</h2>
                  <div className="detail-pill-row">
                    <span className="detail-type-pill" style={{ background: `${typeMeta.color}22`, color: typeMeta.color }}>
                      {typeMeta.emoji} {typeMeta.label}
                    </span>
                    <span className={`detail-status-pill ${isOpen ? "open" : "closed"}`}>
                      {isOpen ? "Open now" : "Closed"}
                    </span>
                    <span className="detail-distance-pill">{formatDistanceAway(distance)}</span>
                    {localLoveCount > 0 && <span className="detail-distance-pill">✅ {localLoveCount} locals love this</span>}
                  </div>
                  <p className="detail-address">{activeSpot.address}</p>
                  {activeSpot.firstPinner && (
                    <div className="detail-first-pinner">👑 First discovered by {activeSpot.firstPinner.userName}</div>
                  )}
                  {!!activeSpot.tips && <div className="detail-local-tip">💡 Local tip: {activeSpot.tips}</div>}
                </div>
              </header>

              <section className="detail-rating-card">
                <div className="detail-rating-score" style={{ color: typeColor }}>
                  {avgRating}
                </div>
                <div className="detail-rating-meta">
                  <StarDisplay value={Number(activeSpot.avgRating || 0)} color={typeColor} />
                  <div className="detail-rating-caption">{reviewCount} reviews</div>
                  <span className="detail-price-pill">
                    ₹{activeSpot.priceMin}–₹{activeSpot.priceMax}
                  </span>
                </div>
              </section>

              <section className="detail-review-section">
                <div className="detail-review-header">
                  <div>
                    <h3>Reviews</h3>
                    <p className="muted">
                      {reviewsToday} {reviewsToday === 1 ? "person reviewed today" : "people reviewed today"}
                    </p>
                  </div>
                  <span className="detail-reviews-count">{reviewCount} total</span>
                </div>

                <div className="detail-reviews-scroll">
                  {!reviews.length && (
                    <div className="empty-card">No reviews yet. Be the first one to leave a real-world note.</div>
                  )}

                  {reviews.map((review) => (
                    <article key={review.id} className="detail-review-card">
                      <div className="detail-review-top">
                        <span className="reviewer-avatar big" style={{ background: review.userAvatarColor || "#384355" }}>
                          {initials(review.userName)}
                        </span>
                        <div className="grow">
                          <div className="row between wrap gap-sm">
                            <div className="detail-review-author">
                              <strong>{review.userName}</strong>
                              <span className="detail-scout-badge">{review.userLevel || "Scout"}</span>
                            </div>
                            <span className="muted">{timeAgo(review.timestamp)}</span>
                          </div>
                          <div className="detail-review-meta">
                            <StarDisplay value={Number(review.rating || 0)} color={typeColor} muted />
                            {review.gpsVerified && <span className="gps-ok">✓ GPS verified</span>}
                          </div>
                        </div>
                      </div>
                      <p className="detail-review-text">{review.text}</p>
                      <button type="button" className="helpful-button" onClick={() => markHelpful(review.id)}>
                        Helpful · {review.helpfulVotes || 0}
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              {!!similarSpots.length && (
                <section className="detail-similar-section">
                  <div className="detail-review-header">
                    <div>
                      <h3>Similar spots nearby</h3>
                      <p className="muted">More {typeMeta.label.toLowerCase()} worth checking within 2 km</p>
                    </div>
                  </div>
                  <div className="detail-similar-list">
                    {similarSpots.map((similarSpot) => (
                      <button
                        key={similarSpot.id}
                        type="button"
                        className="detail-similar-card"
                        onClick={() => onOpenSpot?.(similarSpot)}
                      >
                        <strong>{similarSpot.name}</strong>
                        <span>{formatAreaLabel(similarSpot.address, similarSpot.address)}</span>
                        <span className="muted">
                          ⭐ {Number(similarSpot.avgRating || 0).toFixed(1)} · {similarSpot.distanceKm.toFixed(1)} km away
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className={`detail-action-dock ${isReviewFormOpen ? "expanded" : ""}`}>
              <div className="detail-action-grid">
                <button type="button" className="detail-action-button directions" onClick={openDirections}>
                  🗺 Get Directions
                </button>
                <button type="button" className="detail-action-button share" onClick={shareSpot}>
                  📤 Share
                </button>
                <button
                  type="button"
                  className="detail-action-button review"
                  onClick={() => setIsReviewFormOpen((value) => !value)}
                >
                  ✍️ Write Review
                </button>
              </div>

              {isReviewFormOpen && (
                <div className="detail-review-compose">
                  <div className="detail-compose-header">
                    <h3>Write a review</h3>
                    <span className={`detail-gps-state ${gpsState.verified ? "verified" : ""}`}>
                      {gpsState.verified
                        ? "✓ GPS verified"
                        : gpsState.distanceKm !== null
                          ? `${Math.round(gpsState.distanceKm * 1000)}m from spot`
                          : "GPS verification required"}
                    </span>
                  </div>
                  <StarPicker value={rating} onChange={setRating} color={typeColor} />
                  <textarea
                    className="detail-review-textarea"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Tell people what to order, when to visit, and what makes this spot special."
                  />
                  <div className="detail-compose-actions">
                    <button type="button" className="ghost-button" onClick={verifyGps} disabled={gpsChecking}>
                      {gpsChecking ? "Checking GPS…" : gpsState.verified ? "GPS verified" : "Verify GPS"}
                    </button>
                    <button type="button" className="primary-button" onClick={submitReview} disabled={submitting || !user}>
                      {submitting ? "Posting…" : "Submit review"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
