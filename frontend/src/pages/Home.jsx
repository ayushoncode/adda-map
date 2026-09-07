import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import Map from "../components/Map";
import SpotCard from "../components/SpotCard";
import {
  formatAreaLabel,
  getDistance,
  getTypeColor,
  initials,
  isActiveWithin24Hours,
  isBudgetBite,
  isHiddenGem,
  isNightOwlSpot,
  spotTypes,
} from "../utils";
import { IconSearch, IconMap, IconList, IconMoon, IconPlus, IconLocation, IconClose } from "../icons";

const filters = [
  { label: "All", value: "all" },
  { label: "Chai & Tea", value: "chai" },
  { label: "Biryani", value: "biryani" },
  { label: "Cafes", value: "cafe" },
  { label: "Late Night", value: "nightowl" },
  { label: "Street Food", value: "street-food" },
  { label: "South Indian", value: "south-indian" },
  { label: "North Indian", value: "north-indian" },
  { label: "Fast Food", value: "fast-food" },
  { label: "Restaurants", value: "restaurant" },
  { label: "Hotels", value: "hotel" },
];

export default function Home({
  userProfile,
  onOpenSpot,
  onOpenProfile,
  onOpenAdd,
  refreshKey,
  userLocation,
  setUserLocation,
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeViewMode, setActiveViewMode] = useState("all"); // 'all' (Map+List), 'grid' (List Only), 'night' (Late Night)
  const [searchTerm, setSearchTerm] = useState("");
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const locationRequestStarted = useRef(false);

  const userLat = userLocation?.lat ?? userProfile?.lat ?? null;
  const userLng = userLocation?.lng ?? userProfile?.lng ?? null;

  const effectiveLocation = useMemo(() => {
    if (typeof userLat === "number" && typeof userLng === "number") {
      return {
        lat: userLat,
        lng: userLng,
        accuracy: userLocation?.accuracy,
      };
    }
    return null;
  }, [userLat, userLng, userLocation?.accuracy]);

  useEffect(() => {
    if (effectiveLocation || locationRequestStarted.current) return;
    locationRequestStarted.current = true;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation?.({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, [effectiveLocation, setUserLocation]);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    const center = effectiveLocation || { lat: 12.9352, lng: 77.6245 };
    params.set("lat", center.lat);
    params.set("lng", center.lng);
    if (userProfile?.area) params.set("area", userProfile.area);
    if (activeFilter === "Late Night" || activeViewMode === "night") {
      params.set("filter", "nightowl");
    }

    setLoading(true);
    api
      .get(`/spots?${params.toString()}`)
      .then((response) => {
        if (ignore) return;
        const withViewModel = (response.data.spots || []).map((spot) => ({
          ...spot,
          recentReviewers: spot.recentReviewers || [],
        }));
        const normalized = withViewModel
          .map((spot) => ({
            ...spot,
            distanceMeters: effectiveLocation
              ? getDistance(
                  effectiveLocation.lat,
                  effectiveLocation.lng,
                  Number(spot.lat),
                  Number(spot.lng)
                )
              : null,
          }))
          .sort(
            (a, b) =>
              (a.distanceMeters || Number.MAX_SAFE_INTEGER) -
              (b.distanceMeters || Number.MAX_SAFE_INTEGER)
          );
        setSpots(normalized);
      })
      .catch((err) => {
        console.error("Failed to load spots:", err);
        if (!ignore) setSpots([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeFilter, activeViewMode, userLat, userLng, refreshKey, userProfile?.area]);

  const filteredSpots = useMemo(() => {
    let result = spots;

    if (activeViewMode === "night" || activeFilter === "Late Night") {
      return result.filter((spot) => isNightOwlSpot(spot));
    }

    const filterObj = filters.find((f) => f.label === activeFilter);
    if (filterObj && filterObj.value !== "all") {
      return result.filter((spot) => spot.type === filterObj.value);
    }

    return result;
  }, [activeFilter, activeViewMode, spots]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const visibleSpots = useMemo(() => {
    if (!normalizedSearchTerm) return filteredSpots;
    return filteredSpots.filter(
      (spot) =>
        spot.name?.toLowerCase().includes(normalizedSearchTerm) ||
        spot.type?.toLowerCase().includes(normalizedSearchTerm) ||
        spot.address?.toLowerCase().includes(normalizedSearchTerm)
    );
  }, [filteredSpots, normalizedSearchTerm]);

  const center = effectiveLocation || { lat: 12.9352, lng: 77.6245 };

  return (
    <section className="home-page-container">
      {/* Sleek Hero Header */}
      <div className="page-hero">
        <div className="page-hero-header">
          <div className="page-hero-titles">
            <div className="landing-verified-badge">
              <span className="live-dot" />
              <span>COMMUNITY VERIFIED • BANGALORE</span>
            </div>
            <h1 className="uber-main-title">
              {activeViewMode === "night"
                ? "Late Night Dining"
                : "Explore Spots & Dining"}
            </h1>
            <p className="uber-subtitle">
              {activeViewMode === "night"
                ? "Verified food addas and restaurants open right now in Bangalore."
                : "Curated cafes, chai tapris, and local food addas pinned by students and scouts."}
            </p>
          </div>

          <div className="page-hero-actions">
            <button
              type="button"
              className="uber-cta-btn"
              onClick={onOpenAdd}
            >
              <IconPlus size={16} />
              <span>Add Spot</span>
            </button>
          </div>
        </div>

        {/* View Mode Segmented Switcher */}
        <div className="cmhub-segmented-shell">
          <div className="cmhub-segmented-tabs">
            <button
              type="button"
              className={`cmhub-segment-btn ${
                activeViewMode === "all" ? "active" : ""
              }`}
              onClick={() => setActiveViewMode("all")}
            >
              <IconMap size={16} />
              <span>Map & List</span>
            </button>
            <button
              type="button"
              className={`cmhub-segment-btn ${
                activeViewMode === "grid" ? "active" : ""
              }`}
              onClick={() => setActiveViewMode("grid")}
            >
              <IconList size={16} />
              <span>List Only</span>
            </button>
            <button
              type="button"
              className={`cmhub-segment-btn ${
                activeViewMode === "night" ? "active" : ""
              }`}
              onClick={() => {
                setActiveViewMode("night");
                setActiveFilter("Late Night");
              }}
            >
              <IconMoon size={16} />
              <span>Open Late</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="filter-control-shell">
        <div className="cmhub-search-bar">
          <IconSearch size={18} className="cmhub-search-icon" />
          <input
            type="search"
            className="cmhub-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cafes, biryani, street food, tapris, or area..."
          />
          {searchTerm && (
            <button
              type="button"
              className="cmhub-search-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <IconClose size={14} />
            </button>
          )}
        </div>

        {/* Minimalist Categories Horizontal Carousel */}
        <div className="cmhub-filter-scroll">
          {filters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={`cmhub-filter-chip ${
                activeFilter === filter.label ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter.label)}
            >
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map (Shown when activeViewMode is 'all') */}
      {activeViewMode !== "grid" && (
        <Map
          spots={visibleSpots}
          center={center}
          userLocation={effectiveLocation}
          setUserLocation={setUserLocation}
          currentUser={userProfile}
          onSpotClick={onOpenSpot}
          onAddSpot={onOpenAdd}
        />
      )}

      {/* Spots Section Title */}
      <div className="spots-section-header">
        <h2 className="spots-section-title">
          <span>
            {activeFilter === "All"
              ? "All Curated Spots"
              : activeFilter}
          </span>
          <span className="spots-count-badge">
            {visibleSpots.length}
          </span>
        </h2>
      </div>

      {/* Spots Grid or Empty State */}
      {loading ? (
        <div className="spots-grid">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="skeleton-card" style={{ height: 220, borderRadius: 20 }} />
          ))}
        </div>
      ) : visibleSpots.length ? (
        <div className="spots-grid">
          {visibleSpots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              userLocation={effectiveLocation}
              onOpen={onOpenSpot}
            />
          ))}
        </div>
      ) : (
        <div className="cmhub-empty-box">
          <div className="uber-empty-icon-circle">
            <IconLocation size={24} />
          </div>
          <strong>
            {normalizedSearchTerm
              ? `No spots found for "${searchTerm.trim()}"`
              : activeFilter === "Late Night"
              ? "No late-night spots open right now"
              : activeFilter === "All"
              ? "No spots added in Bangalore yet"
              : `No ${activeFilter.toLowerCase()} added yet`}
          </strong>
          <p>
            {normalizedSearchTerm
              ? "Try searching another dish, cafe, or neighborhood."
              : "Be the founding scout to pin this spot on the map and earn +150 scout points."}
          </p>
          <button
            type="button"
            className="uber-cta-btn"
            onClick={onOpenAdd}
            style={{ marginTop: 14 }}
          >
            <IconPlus size={16} />
            <span>Pin a Spot Now (+150 Pts)</span>
          </button>
        </div>
      )}
    </section>
  );
}
