import { useEffect, useState } from "react";
import api from "../api";
import {
  formatDistance,
  getTypeColor,
  getTypeMeta,
  initials,
  isOpenNow,
  timeAgo,
} from "../utils";
import { auth } from "../firebase";
import { IconNavigation, IconStar, IconClock, IconClose, IconTrash } from "../icons";

export default function SpotDetail({
  spot,
  user,
  userLocation,
  onClose,
  onToast,
  onUpdated,
  onOpenSpot,
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingSpot, setDeletingSpot] = useState(false);

  const activeSpot = detail?.spot || spot;

  useEffect(() => {
    if (!spot?.id) return;
    let ignore = false;
    setLoading(true);
    setIsReviewOpen(false);
    setReviewText("");
    setRating(5);

    api
      .get(`/spots/${spot.id}`)
      .then((res) => {
        if (!ignore) setDetail(res.data);
      })
      .catch(() => onToast("Could not load spot details", "error"))
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [spot?.id, onToast]);

  const typeMeta = getTypeMeta(activeSpot?.type);
  const photos = activeSpot?.photos || [];
  const isCurrentlyOpen = isOpenNow(activeSpot?.openTime, activeSpot?.closeTime);

  const submitReview = async () => {
    if (!reviewText.trim()) {
      onToast("Please enter your review feedback.", "error");
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`/spots/${activeSpot.id}/reviews`, {
        rating,
        text: reviewText.trim(),
        userName: user?.name || "Verified Scout",
        userAvatarColor: user?.avatarColor || "#262626",
        userId: user?.uid,
      });

      onToast("Review submitted successfully.", "success");
      setIsReviewOpen(false);
      setReviewText("");

      const refreshed = await api.get(`/spots/${activeSpot.id}`);
      setDetail(refreshed.data);
      onUpdated?.();
    } catch (err) {
      onToast("Could not post review. Please try again.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const openGoogleMaps = () => {
    if (activeSpot?.lat && activeSpot?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${activeSpot.lat},${activeSpot.lng}`;
      window.open(url, "_blank");
    }
  };

  const isAuthor =
    user?.uid &&
    (activeSpot?.pinnedBy === user.uid ||
      activeSpot?.firstPinner?.userId === user.uid ||
      detail?.spot?.pinnedBy === user.uid);

  const handleDeleteSpot = async () => {
    setDeletingSpot(true);
    try {
      await api.delete(`/spots/${activeSpot.id}`);
      onToast("Spot deleted successfully.", "info");
      onClose?.();
      onUpdated?.();
    } catch (err) {
      console.error(err);
      onToast(err.response?.data?.error || "Failed to delete spot.", "error");
    } finally {
      setDeletingSpot(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="spot-detail-overlay" onClick={onClose}>
      <div
        className="spot-detail-sheet uber-detail-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="detail-close-btn uber-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <IconClose size={20} />
        </button>

        {/* Hero Cover Image */}
        <div className="detail-hero-cover">
          {photos[0] ? (
            <img
              src={photos[0]}
              alt={activeSpot.name}
              className="detail-hero-img"
            />
          ) : (
            <div className="cmhub-spot-img-fallback">
              <span className="fallback-category">{typeMeta.label}</span>
            </div>
          )}
        </div>

        {/* Content Wrap */}
        <div className="detail-content-wrap">
          <div className="detail-title-section">
            <div className="uber-category-tag">
              {typeMeta.label}
            </div>
            <h2 className="detail-spot-name">{activeSpot.name}</h2>

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
                <IconClock size={12} />
                <span>{activeSpot.openTime || "08:00"} – {activeSpot.closeTime || "23:00"}</span>
              </span>

              <span className="cmhub-dist-chip">
                <IconStar size={12} fill="#FFFFFF" />
                <span>{Number(activeSpot.avgRating || 4.5).toFixed(1)} ({activeSpot.reviewCount || 1} reviews)</span>
              </span>
            </div>
          </div>

          {/* Action Bar - Uber Style Primary & Secondary Buttons */}
          <div className="detail-action-bar">
            <button
              type="button"
              className="uber-cta-btn uber-btn-full"
              onClick={openGoogleMaps}
            >
              <IconNavigation size={16} />
              <span>Get Turn-by-Turn Directions</span>
            </button>
            <button
              type="button"
              className="uber-secondary-btn"
              onClick={() => setIsReviewOpen(!isReviewOpen)}
            >
              <span>{isReviewOpen ? "Close Form" : "Rate & Review"}</span>
            </button>
          </div>

          {/* Delete Option - Visible ONLY to the scout who pinned this spot */}
          {isAuthor && (
            <div className="uber-author-actions-box">
              {confirmDelete ? (
                <div className="uber-delete-confirm-box">
                  <span style={{ fontSize: "0.82rem", color: "#FFFFFF", fontWeight: 600 }}>
                    Are you sure you want to delete this spot?
                  </span>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      className="uber-btn-danger"
                      onClick={handleDeleteSpot}
                      disabled={deletingSpot}
                    >
                      {deletingSpot ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button
                      type="button"
                      className="uber-secondary-btn"
                      style={{ padding: "6px 14px", fontSize: "0.78rem" }}
                      onClick={() => setConfirmDelete(false)}
                      disabled={deletingSpot}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="uber-delete-trigger-btn"
                  onClick={() => setConfirmDelete(true)}
                >
                  <IconTrash size={14} />
                  <span>Delete This Spot (You Pinned This)</span>
                </button>
              )}
            </div>
          )}

          {/* Review Form (Expandable) */}
          {isReviewOpen && (
            <div className="uber-review-form-box">
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                Add your rating & feedback
              </div>

              {/* Star Picker */}
              <div style={{ display: "flex", gap: "8px", fontSize: "1.5rem" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    style={{
                      color: rating >= star ? "#FFFFFF" : "#3F3F46",
                      transition: "transform 150ms ease",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.6rem",
                    }}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                className="cmhub-textarea"
                rows={3}
                placeholder="Share your experience, recommendations, parking or food quality..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />

              <button
                type="button"
                className="uber-cta-btn"
                onClick={submitReview}
                disabled={submittingReview}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          )}

          {/* Info Grid */}
          <div className="detail-info-grid">
            <div className="detail-info-card">
              <div className="detail-info-label">PRICE RANGE</div>
              <div className="detail-info-val">
                ₹{activeSpot.priceMin || 0} – ₹{activeSpot.priceMax || 0}
              </div>
            </div>
            <div className="detail-info-card">
              <div className="detail-info-label">ADDRESS / LOCATION</div>
              <div className="detail-info-val" style={{ fontSize: "0.86rem" }}>
                {activeSpot.address || "Bangalore"}
              </div>
            </div>
          </div>

          {/* Community Reviews */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                Reviews & Experiences ({detail?.reviews?.length || activeSpot.reviewCount || 0})
              </h3>
            </div>

            {loading ? (
              <div className="skeleton-card" style={{ height: 120 }} />
            ) : detail?.reviews?.length ? (
              <div className="detail-reviews-list">
                {detail.reviews.map((rev) => (
                  <div key={rev.id} className="detail-review-card">
                    <div className="detail-reviewer-header">
                      <div className="detail-reviewer-info">
                        <div
                          className="detail-rev-avatar"
                          style={{
                            background: rev.userAvatarColor || "#262626",
                            color: "#FFFFFF",
                          }}
                        >
                          {initials(rev.userName)}
                        </div>
                        <div>
                          <div className="detail-rev-name">{rev.userName}</div>
                          <div style={{ fontSize: "0.74rem", color: "#A0A0A0" }}>
                            {timeAgo(rev.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.88rem" }}>
                        ★ {rev.rating}
                      </div>
                    </div>

                    <p className="detail-rev-text">{rev.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="uber-empty-reviews">
                No reviews recorded yet. Be the first to share your experience!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
