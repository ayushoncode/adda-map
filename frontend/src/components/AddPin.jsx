import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import api from "../api";
import { auth, storage } from "../firebase";
import { spotTypes } from "../utils";
import {
  IconCrosshair,
  IconSearch,
  IconPlus,
  IconClose,
  IconCheck,
  IconNavigation,
  IconMap,
  IconLocation,
  IconStar,
} from "../icons";

const POPULAR_BANGALORE_HUBS = [
  { name: "Koramangala 5th Block", area: "Koramangala, South Bangalore", lat: 12.9352, lng: 77.6245 },
  { name: "Indiranagar 100ft Road", area: "Indiranagar, East Bangalore", lat: 12.9719, lng: 77.6412 },
  { name: "HSR Layout Sector 1", area: "HSR Layout, South Bangalore", lat: 12.9121, lng: 77.6446 },
  { name: "Church Street & MG Road", area: "Central Bangalore", lat: 12.9749, lng: 77.6067 },
  { name: "Jayanagar 4th Block", area: "Jayanagar, South Bangalore", lat: 12.9299, lng: 77.5826 },
  { name: "Malleshwaram 8th Cross", area: "Malleshwaram, North Bangalore", lat: 13.0031, lng: 77.5703 },
  { name: "Frazer Town (Mosque Rd)", area: "Frazer Town, Central Bangalore", lat: 12.9982, lng: 77.6139 },
  { name: "Whitefield Inner Circle", area: "Whitefield, East Bangalore", lat: 12.9698, lng: 77.7499 },
  { name: "BTM Layout 2nd Stage", area: "BTM Layout, South Bangalore", lat: 12.9166, lng: 77.6101 },
  { name: "Kalyan Nagar HRBR Layout", area: "Kalyan Nagar, North Bangalore", lat: 13.0223, lng: 77.6433 },
];

const INITIAL_FORM = {
  name: "",
  type: "restaurant",
  address: "",
  priceMin: "100",
  priceMax: "300",
  openTime: "10:00",
  closeTime: "23:00",
  rating: 5,
  reviewText: "",
  tips: "",
};

export default function AddPin({ userLocation, onBack, onSuccess, onCreated, onToast }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submittedSpot, setSubmittedSpot] = useState(null);
  const [pinLocation, setPinLocation] = useState(() => {
    if (userLocation?.lat && userLocation?.lng) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    return null;
  });
  const [locationMode, setLocationMode] = useState("search");
  const [isLocating, setIsLocating] = useState(false);
  const [locationSet, setLocationSet] = useState(() => !!userLocation?.lat);

  // Landmark search state
  const [landmarkQuery, setLandmarkQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingLandmark, setIsSearchingLandmark] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Auto-fill address using reverse geocode when coordinates change
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.display_name) {
        const parts = data.display_name.split(", ");
        const shortAddr = parts.slice(0, 3).join(", ");
        setForm((prev) => ({ ...prev, address: shortAddr }));
      }
    } catch {
      // Fallback
    }
  };

  // Upgraded Multi-Engine Search with Bangalore Biasing
  const handleLandmarkInput = (val) => {
    setLandmarkQuery(val);
    clearTimeout(searchTimeoutRef.current);

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const trimmed = val.trim().toLowerCase();

    // 1. Check local Bangalore hubs first for instant results
    const localMatches = POPULAR_BANGALORE_HUBS.filter(
      (hub) =>
        hub.name.toLowerCase().includes(trimmed) ||
        hub.area.toLowerCase().includes(trimmed)
    ).map((hub) => ({
      title: hub.name,
      subtitle: hub.area,
      lat: hub.lat,
      lng: hub.lng,
      isHub: true,
    }));

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingLandmark(true);
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          val
        )}&lat=12.9716&lon=77.5946&limit=6`;

        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          val.includes("Bangalore") || val.includes("Bengaluru") ? val : `${val}, Bengaluru`
        )}&format=json&limit=5&viewbox=77.45,13.15,77.75,12.80&bounded=0&countrycodes=in`;

        const [photonRes, nomRes] = await Promise.allSettled([
          fetch(photonUrl),
          fetch(nominatimUrl),
        ]);

        let combined = [...localMatches];

        if (photonRes.status === "fulfilled" && photonRes.value.ok) {
          const photonData = await photonRes.value.json();
          const parsedPhoton = (photonData.features || []).map((f) => {
            const props = f.properties || {};
            const title = props.name || props.street || val;
            const subtitleParts = [
              props.district || props.suburb || props.city,
              props.state,
            ].filter(Boolean);
            return {
              title,
              subtitle: subtitleParts.join(", ") || "Bangalore, Karnataka",
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
            };
          });
          combined = [...combined, ...parsedPhoton];
        }

        if (nomRes.status === "fulfilled" && nomRes.value.ok) {
          const nomData = await nomRes.value.json();
          const parsedNom = (nomData || []).map((item) => {
            const parts = item.display_name.split(", ");
            return {
              title: parts[0],
              subtitle: parts.slice(1, 4).join(", "),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });
          combined = [...combined, ...parsedNom];
        }

        // Deduplicate
        const unique = [];
        for (const item of combined) {
          const exists = unique.some(
            (u) =>
              Math.abs(u.lat - item.lat) < 0.001 &&
              Math.abs(u.lng - item.lng) < 0.001
          );
          if (!exists) unique.push(item);
        }

        setSuggestions(unique.slice(0, 6));
        setShowSuggestions(unique.length > 0);
      } catch (err) {
        console.warn("Search places error:", err);
        setSuggestions(localMatches);
        setShowSuggestions(localMatches.length > 0);
      } finally {
        setIsSearchingLandmark(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (item) => {
    const lat = item.lat;
    const lng = item.lng;
    setPinLocation({ lat, lng });
    setLocationSet(true);
    setShowSuggestions(false);
    setLandmarkQuery(item.title);

    const addr = item.subtitle ? `${item.title}, ${item.subtitle}` : item.title;
    setForm((prev) => ({ ...prev, address: addr }));

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.0 });
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
    onToast?.("Location pinned. Drag pin on map if needed.", "success");
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      onToast?.("Geolocation is not supported by your browser.", "error");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPinLocation({ lat, lng });
        setLocationSet(true);
        setIsLocating(false);
        setLocationMode("gps");
        setLandmarkQuery("");

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.0 });
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
        }
        reverseGeocode(lat, lng);
        onToast?.("Current location pinned.", "success");
      },
      () => {
        setIsLocating(false);
        onToast?.(
          "Could not detect location. Please use place search.",
          "error"
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const update = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Initialize interactive pin map
  useEffect(() => {
    if (!mapContainerRef.current || !locationSet || !pinLocation) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [pinLocation.lat, pinLocation.lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      // Uber-sleek minimalist black and green pin
      const pinIcon = L.divIcon({
        className: "custom-spot-marker",
        html: `
          <div style="
            width: 32px; height: 32px;
            background: #000000;
            border: 2.5px solid #10B981;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8), 0 0 12px rgba(16, 185, 129, 0.4);
            color: #10B981; font-weight: 900; font-size: 11px;
            letter-spacing: 0.05em;
          ">
            PIN
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([pinLocation.lat, pinLocation.lng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setPinLocation({ lat: pos.lat, lng: pos.lng });
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        setPinLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      mapInstanceRef.current.setView([pinLocation.lat, pinLocation.lng], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([pinLocation.lat, pinLocation.lng]);
      }
    }

    const t = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => clearTimeout(t);
  }, [locationSet, pinLocation]);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      onToast?.("Please enter the spot name.", "error");
      return;
    }

    if (!pinLocation || !pinLocation.lat || !pinLocation.lng) {
      onToast?.("Please choose a location for this spot.", "error");
      return;
    }

    if (!form.address.trim()) {
      onToast?.("Please provide an address or landmark.", "error");
      return;
    }

    if (!form.reviewText.trim()) {
      onToast?.("Please share a quick note/review about this spot.", "error");
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = "";
      if (selectedFile) {
        const user = auth.currentUser;
        const fileExt = selectedFile.name.split(".").pop();
        const fileRef = ref(
          storage,
          `spots/${user?.uid || "scout"}_${Date.now()}.${fileExt}`
        );
        const snapshot = await uploadBytes(fileRef, selectedFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      const payload = {
        name: form.name.trim(),
        type: form.type,
        lat: pinLocation.lat,
        lng: pinLocation.lng,
        address: form.address.trim(),
        priceMin: Number(form.priceMin) || 50,
        priceMax: Number(form.priceMax) || 200,
        openTime: form.openTime,
        closeTime: form.closeTime,
        rating: Number(form.rating),
        reviewText: form.reviewText.trim(),
        tips: form.tips.trim(),
        photoUrl,
      };

      const res = await api.post("/spots", payload);
      const created = res.data?.spot || {
        ...payload,
        id: res.data?.spot?.id || Date.now(),
      };
      setSubmittedSpot(created);
      onToast?.("Spot published. 150 points earned.", "success");
      onCreated?.(created);
    } catch (err) {
      console.error(err);
      onToast?.(
        err.response?.data?.error || "Failed to publish spot. Try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedSpot) {
    return (
      <div className="add-pin-container" style={{ maxWidth: 520, margin: "0 auto", paddingBottom: 90 }}>
        <div className="cmhub-form-card uber-form-card uber-success-card">
          <div className="uber-success-icon-wrap">
            <IconCheck size={28} color="#000000" />
          </div>

          <span className="uber-points-pill">+150 SCOUT POINTS</span>

          <h2 className="uber-success-title">Spot Published</h2>
          <p
            className="uber-subtitle"
            style={{ textAlign: "center", maxWidth: 400, margin: "0 auto 20px" }}
          >
            "{submittedSpot.name}" is now live on the Bangalore community map.
          </p>

          <div className="uber-spot-preview-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span className="uber-category-tag">
                {submittedSpot.type ? submittedSpot.type.toUpperCase() : "SPOT"}
              </span>
              <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#FFFFFF" }}>
                RATING {Number(submittedSpot.avgRating || form.rating || 5).toFixed(1)}
              </span>
            </div>
            <h3 style={{ margin: "4px 0 6px", color: "#FFFFFF", fontSize: "1.2rem", fontWeight: 800 }}>
              {submittedSpot.name}
            </h3>
            <p style={{ margin: "0 0 10px", color: "#A0A0A0", fontSize: "0.82rem" }}>
              {submittedSpot.address}
            </p>
            <div style={{ display: "flex", gap: 8, fontSize: "0.76rem", color: "#71717A" }}>
              <span>₹{submittedSpot.priceMin} – ₹{submittedSpot.priceMax}</span>
              <span>•</span>
              <span>{submittedSpot.openTime} – {submittedSpot.closeTime}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 24 }}>
            <button
              type="button"
              className="uber-cta-btn uber-btn-full"
              onClick={() => {
                onSuccess?.(submittedSpot);
                onBack?.();
              }}
            >
              <IconMap size={16} />
              <span>Explore on Map</span>
            </button>
            <button
              type="button"
              className="uber-secondary-btn"
              style={{ width: "100%" }}
              onClick={() => {
                setSubmittedSpot(null);
                setForm(INITIAL_FORM);
                setLocationSet(false);
                setPinLocation(null);
                setLandmarkQuery("");
              }}
            >
              <IconPlus size={16} />
              <span>Add Another Spot</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-pin-container" style={{ maxWidth: 640, margin: "0 auto", padding: "16px 14px 100px" }}>
      <div className="cmhub-form-card uber-form-card">
        {/* Header */}
        <div className="cmhub-form-header" style={{ marginBottom: 16 }}>
          <div>
            <h1 className="uber-form-title">Pin an Adda</h1>
            <p className="uber-subtitle">
              Add a verified spot, cafe, restaurant, or late night dining adda.
            </p>
          </div>
          <button type="button" className="uber-secondary-btn" onClick={onBack}>
            <IconClose size={16} />
            <span>Cancel</span>
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Spot Name */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Spot Name *</label>
            <input
              type="text"
              className="cmhub-input"
              placeholder="e.g. Rameshwaram Cafe, Truffles, Meghana Foods"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>

          {/* Category Chips */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Category</label>
            <div className="uber-type-grid">
              {spotTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`uber-type-btn ${form.type === type.value ? "active" : ""}`}
                  onClick={() => update("type", type.value)}
                >
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location Mode Selector */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Set Location *</label>

            <div className="loc-option-cards">
              <button
                type="button"
                className={`loc-option-card ${locationMode === "search" ? "active" : ""}`}
                onClick={() => setLocationMode("search")}
              >
                <span className="loc-option-icon">
                  <IconSearch size={18} />
                </span>
                <div className="loc-option-text">
                  <strong>Search Place or Landmark</strong>
                  <span>Detects Bangalore areas and spots</span>
                </div>
                {locationMode === "search" && locationSet && (
                  <span className="loc-option-check"><IconCheck size={14} /></span>
                )}
              </button>

              <button
                type="button"
                className={`loc-option-card ${locationMode === "gps" ? "active" : ""}`}
                onClick={handleUseGPS}
                disabled={isLocating}
              >
                <span className="loc-option-icon">
                  <IconCrosshair size={18} />
                </span>
                <div className="loc-option-text">
                  <strong>{isLocating ? "Detecting GPS..." : "Current Location"}</strong>
                  <span>Use device GPS coordinates</span>
                </div>
                {locationMode === "gps" && locationSet && !isLocating && (
                  <span className="loc-option-check"><IconCheck size={14} /></span>
                )}
              </button>
            </div>

            {/* Autocomplete Input with FLOATING OVERLAY DROPDOWN */}
            {locationMode === "search" && (
              <div
                className="loc-search-box-wrap"
                style={{ position: "relative", zIndex: 1100, marginTop: 10 }}
              >
                <div className="cmhub-search-bar" style={{ borderRadius: 12 }}>
                  <IconSearch size={16} className="cmhub-search-icon" />
                  <input
                    type="text"
                    className="cmhub-search-input"
                    placeholder="Search e.g. Koramangala 5th Block, Indiranagar, Truffles..."
                    value={landmarkQuery}
                    onChange={(e) => handleLandmarkInput(e.target.value)}
                  />
                  {isSearchingLandmark && (
                    <span className="button-spinner" style={{ width: 16, height: 16, marginRight: 10 }} />
                  )}
                  {landmarkQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setLandmarkQuery("");
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                      style={{ padding: "0 8px", color: "#A0A0A0" }}
                    >
                      <IconClose size={14} />
                    </button>
                  )}
                </div>

                {/* Popular Bangalore Quick Hubs Chips */}
                {!showSuggestions && !landmarkQuery && (
                  <div className="quick-hubs-chips-row">
                    <span className="quick-hubs-label">Popular:</span>
                    {POPULAR_BANGALORE_HUBS.slice(0, 4).map((hub) => (
                      <button
                        key={hub.name}
                        type="button"
                        className="quick-hub-pill"
                        onClick={() =>
                          handleSelectSuggestion({
                            title: hub.name,
                            subtitle: hub.area,
                            lat: hub.lat,
                            lng: hub.lng,
                          })
                        }
                      >
                        {hub.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggestions FLOATING Dropdown (High z-index, positioned above map) */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="loc-suggestions-dropdown">
                    <div className="suggestions-header">
                      <span>Bangalore Locations & POIs</span>
                    </div>
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="loc-suggestion-item"
                        onClick={() => handleSelectSuggestion(item)}
                      >
                        <div className="suggestion-icon-circle">
                          <IconLocation size={14} color="#10B981" />
                        </div>
                        <div className="loc-suggestion-text">
                          <strong className="suggestion-title">{item.title}</strong>
                          <span className="suggestion-sub">{item.subtitle}</span>
                        </div>
                        <span className="suggestion-pick-arrow">Select →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Interactive Pin Map */}
            {locationSet && pinLocation && (
              <div className="loc-map-container-wrap" style={{ marginTop: 12, position: "relative", zIndex: 10 }}>
                <div
                  ref={mapContainerRef}
                  style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 14,
                    border: "1px solid #262626",
                    overflow: "hidden",
                  }}
                />
                <div className="loc-map-hint">
                  <span>Drag marker or tap on map to adjust exact position</span>
                </div>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Address & Landmark Details *</label>
            <input
              type="text"
              className="cmhub-input"
              placeholder="e.g. 5th Block, near Sony Signal, Koramangala"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              required
            />
          </div>

          {/* Approx Cost (Clean, dedicated 2-column inputs) */}
          <div className="cmhub-form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <label className="cmhub-label" style={{ marginBottom: 0 }}>Approx Cost (₹)</label>
              <span style={{ fontSize: "0.72rem", color: "#8E8E93" }}>Cost for 2 people</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#8E8E93", fontWeight: 700, display: "block", marginBottom: 5 }}>
                  MIN PRICE (₹)
                </span>
                <input
                  type="number"
                  className="cmhub-input uber-cost-input"
                  placeholder="100"
                  value={form.priceMin}
                  onChange={(e) => update("priceMin", e.target.value)}
                />
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#8E8E93", fontWeight: 700, display: "block", marginBottom: 5 }}>
                  MAX PRICE (₹)
                </span>
                <input
                  type="number"
                  className="cmhub-input uber-cost-input"
                  placeholder="300"
                  value={form.priceMax}
                  onChange={(e) => update("priceMax", e.target.value)}
                />
              </div>
            </div>
            <div className="uber-preset-chips">
              <button
                type="button"
                className={`uber-preset-chip ${form.priceMin === "50" && form.priceMax === "150" ? "active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, priceMin: "50", priceMax: "150" }))}
              >
                ₹ Budget (50-150)
              </button>
              <button
                type="button"
                className={`uber-preset-chip ${form.priceMin === "100" && form.priceMax === "300" ? "active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, priceMin: "100", priceMax: "300" }))}
              >
                ₹₹ Casual (100-300)
              </button>
              <button
                type="button"
                className={`uber-preset-chip ${form.priceMin === "300" && form.priceMax === "700" ? "active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, priceMin: "300", priceMax: "700" }))}
              >
                ₹₹₹ Dining (300-700)
              </button>
            </div>
          </div>

          {/* Operating Hours (Clean, dedicated 2-column inputs with visible time text) */}
          <div className="cmhub-form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <label className="cmhub-label" style={{ marginBottom: 0 }}>Operating Hours</label>
              <span style={{ fontSize: "0.72rem", color: "#8E8E93" }}>24-hour format</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#8E8E93", fontWeight: 700, display: "block", marginBottom: 5 }}>
                  OPENS AT
                </span>
                <input
                  type="time"
                  className="cmhub-input uber-time-input"
                  value={form.openTime}
                  onChange={(e) => update("openTime", e.target.value)}
                />
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#8E8E93", fontWeight: 700, display: "block", marginBottom: 5 }}>
                  CLOSES AT
                </span>
                <input
                  type="time"
                  className="cmhub-input uber-time-input"
                  value={form.closeTime}
                  onChange={(e) => update("closeTime", e.target.value)}
                />
              </div>
            </div>
            <div className="uber-preset-chips">
              <button
                type="button"
                className={`uber-preset-chip ${form.openTime === "10:00" && form.closeTime === "23:00" ? "active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, openTime: "10:00", closeTime: "23:00" }))}
              >
                Regular (10:00 - 23:00)
              </button>
              <button
                type="button"
                className={`uber-preset-chip ${form.openTime === "18:00" && form.closeTime === "03:00" ? "active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, openTime: "18:00", closeTime: "03:00" }))}
              >
                Late Night (18:00 - 03:00)
              </button>
              <button
                type="button"
                className={`uber-preset-chip ${form.openTime === "06:00" && form.closeTime === "14:00" ? "active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, openTime: "06:00", closeTime: "14:00" }))}
              >
                Morning Chai (06:00 - 14:00)
              </button>
              <button
                type="button"
                className={`uber-preset-chip ${form.openTime === "00:00" && form.closeTime === "23:59" ? "active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, openTime: "00:00", closeTime: "23:59" }))}
              >
                24 Hours Open
              </button>
            </div>
          </div>

          {/* Rating */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Your Rating</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                  onClick={() => update("rating", star)}
                >
                  <IconStar
                    size={26}
                    fill={form.rating >= star ? "#FFFFFF" : "transparent"}
                    color={form.rating >= star ? "#FFFFFF" : "#3F3F46"}
                  />
                </button>
              ))}
              <span style={{ color: "#A0A0A0", fontSize: "0.85rem", alignSelf: "center", marginLeft: 8, fontWeight: 600 }}>
                {form.rating === 5 ? "5.0 Excellent" : form.rating === 4 ? "4.0 Very Good" : `${form.rating}.0`}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Review / Recommendation *</label>
            <textarea
              className="cmhub-textarea"
              rows={3}
              placeholder="What makes this spot worth visiting? Must-try dishes..."
              value={form.reviewText}
              onChange={(e) => update("reviewText", e.target.value)}
              required
            />
          </div>

          {/* Pro Tip (Optional) */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Pro Tip (Optional)</label>
            <input
              type="text"
              className="cmhub-input"
              placeholder="e.g. Best visited after 11 PM, parking available in back lane"
              value={form.tips}
              onChange={(e) => update("tips", e.target.value)}
            />
          </div>

          {/* Photo Upload (Optional) */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              className="cmhub-input"
              onChange={handlePhotoSelect}
            />
            {previewUrl && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 12 }}
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="uber-cta-btn uber-btn-full"
            disabled={submitting}
            style={{ marginTop: 8, padding: "14px 20px" }}
          >
            {submitting ? (
              <span className="button-spinner" />
            ) : (
              <>
                <IconPlus size={18} />
                <span>Publish Spot (+150 Points)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
