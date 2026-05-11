import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Map from "../components/Map";
import SpotCard from "../components/SpotCard";
import {
  filterTint,
  formatAreaLabel,
  getDistance,
  getTypeColor,
  initials,
  isActiveWithin24Hours,
  isBudgetBite,
  isHiddenGem,
  isNightOwlSpot,
} from "../utils";

const filters = [
  { label: "All", color: "#E8A020" },
  { label: "Chai ☕", color: "#E8A020" },
  { label: "Biryani 🍛", color: "#1D9E75" },
  { label: "Happening Now 🔥", color: "#FF4444" },
  { label: "Hidden Gem 💎", color: "#9B59B6" },
  { label: "Night Owl 🦉", color: "#1F3A5F" },
  { label: "Budget Bites 💸", color: "#1D9E75" },
];

export default function Home({
  userProfile,
  onOpenSpot,
  onOpenProfile,
  onOpenAdd,
  refreshKey,
  userLocation,
  setUserLocation,
  onAccentChange,
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const effectiveLocation =
    userLocation ||
    (typeof userProfile?.lat === "number" && typeof userProfile?.lng === "number"
      ? { lat: userProfile.lat, lng: userProfile.lng }
      : null);

  useEffect(() => {
    const params = new URLSearchParams();
    const center = effectiveLocation || { lat: 12.9352, lng: 77.6245 };
    params.set("lat", center.lat);
    params.set("lng", center.lng);
    if (userProfile?.area) params.set("area", userProfile.area);
    if (activeFilter === "Night Owl 🦉") params.set("filter", "nightowl");

    setLoading(true);
    api
      .get(`/spots?${params.toString()}`)
      .then((response) => {
        const withViewModel = (response.data.spots || []).map((spot) => ({
          ...spot,
          recentReviewers: spot.recentReviewers || [],
        }));
        const normalized = withViewModel
          .map((spot) => ({
            ...spot,
            distanceMeters: effectiveLocation
              ? getDistance(effectiveLocation.lat, effectiveLocation.lng, Number(spot.lat), Number(spot.lng))
              : null,
          }))
          .sort((a, b) => (a.distanceMeters || Number.MAX_SAFE_INTEGER) - (b.distanceMeters || Number.MAX_SAFE_INTEGER));
        setSpots(normalized);
      })
      .finally(() => setLoading(false));
  }, [activeFilter, effectiveLocation, refreshKey, userProfile?.area]);

  const filteredSpots = useMemo(() => {
    switch (activeFilter) {
      case "Chai ☕":
        return spots.filter((spot) => spot.type === "chai");
      case "Biryani 🍛":
        return spots.filter((spot) => spot.type === "biryani");
      case "Happening Now 🔥":
        return spots.filter((spot) => isActiveWithin24Hours(spot));
      case "Hidden Gem 💎":
        return spots.filter((spot) => isHiddenGem(spot));
      case "Night Owl 🦉":
        return spots.filter((spot) => isNightOwlSpot(spot));
      case "Budget Bites 💸":
        return spots.filter((spot) => isBudgetBite(spot));
      default:
        return spots;
    }
  }, [activeFilter, spots]);

  const accent = useMemo(() => filterTint(activeFilter), [activeFilter]);
  const center = effectiveLocation || { lat: 12.9352, lng: 77.6245 };

  useEffect(() => {
    onAccentChange?.(accent);
  }, [accent, onAccentChange]);

  return (
    <section className="home-screen">
      <header className="top-bar">
        <h1 className="logo small">Adda <span>Map</span></h1>
        <div className="area-pill">{formatAreaLabel(userProfile?.area)}</div>
        <button type="button" className="avatar-button" onClick={onOpenProfile} style={{ background: userProfile?.avatarColor || "#384355" }}>
          {initials(userProfile?.name)}
        </button>
      </header>

      <div className="pill-row">
        {filters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            className={`filter-pill ${activeFilter === filter.label ? "active" : ""}`}
            style={activeFilter === filter.label ? { background: filter.color, borderColor: filter.color } : undefined}
            onClick={() => setActiveFilter(filter.label)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <Map
        spots={filteredSpots}
        center={center}
        userLocation={effectiveLocation}
        setUserLocation={setUserLocation}
        userArea={userProfile?.area}
        currentUser={userProfile}
        onSpotClick={onOpenSpot}
      />

      <div className="spots-list">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <div key={index} className="spot-card skeleton-card" />)
        ) : filteredSpots.length ? (
          filteredSpots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} userLocation={effectiveLocation} onOpen={onOpenSpot} />
          ))
        ) : (
          <div className="empty-card empty-map-state">
            <strong>{activeFilter === "Night Owl 🦉" ? "No late night spots open right now 🌙" : "No spots here yet 📍"}</strong>
            <p>
              {activeFilter === "Night Owl 🦉"
                ? "Check back after 9 PM or add one!"
                : "Be the first to add a chai or biryani spot in your area!"}
            </p>
            {activeFilter !== "Night Owl 🦉" && <p>Your pin could help hundreds of people find great food.</p>}
            <button type="button" className="primary-button large" onClick={onOpenAdd}>
              + Add Spot
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        className="floating-add"
        style={{ background: getTypeColor(activeFilter === "Biryani 🍛" ? "biryani" : "chai") }}
        onClick={onOpenAdd}
      >
        +
      </button>
    </section>
  );
}
