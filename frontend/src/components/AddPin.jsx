import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import api from "../api";
import { auth, storage } from "../firebase";
import { spotTypes } from "../utils";
import { IconCrosshair, IconSearch, IconPlus, IconClose, IconCheck, IconNavigation, IconMap } from "../icons";

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
  const [locationMode, setLocationMode] = useState("gps");
  const [isLocating, setIsLocating] = useState(false);
  const [locationSet, setLocationSet] = useState(() => !!(userLocation?.lat));

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
      // Fallback: user can type manually
    }
  };

  // Landmark search with debounce
  const handleLandmarkInput = (val) => {
    setLandmarkQuery(val);
    clearTimeout(searchTimeoutRef.current);

    if (!val || val.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingLandmark(true);
      try {
        const queryWithContext = val.includes("Bangalore") || val.includes("Bengaluru")
          ? val
          : `${val}, Bangalore, India`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            queryWithContext
          )}&format=json&limit=5&countrycodes=in`
        );
        const data = await res.json();
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearchingLandmark(false);
      }
    }, 380);
  };

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setPinLocation({ lat, lng });
    setLocationSet(true);
    setShowSuggestions(false);
    setLandmarkQuery(item.display_name.split(",")[0]);

    const parts = item.display_name.split(", ");
    const shortAddr = parts.slice(0, 3).join(", ");
    setForm((prev) => ({ ...prev, address: shortAddr }));

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.0 });
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
    onToast("Location set! Adjust pin on the map if needed.", "success");
  };

  // GPS handler
  const handleUseGPS = () => {
    setLocationMode("gps");
    if (!navigator.geolocation) {
      onToast("Geolocation is not supported by your browser.", "error");
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
        reverseGeocode(lat, lng);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.0 });
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
        }
        onToast("Location detected from GPS.", "success");
      },
      (err) => {
        setIsLocating(false);
        onToast("Location permission denied. Try searching a landmark.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Leaflet map setup when location is available
  useEffect(() => {
    if (!locationSet || !pinLocation || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([pinLocation.lat, pinLocation.lng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      className: "map-tile-dark",
    }).addTo(map);

    const pinIcon = L.divIcon({
      html: `
        <div class="uber-marker-pin" style="transform: scale(1.1);">
          <span style="font-size: 11px; font-weight: 800; color: #000000;">PIN</span>
        </div>
      `,
      className: "",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([pinLocation.lat, pinLocation.lng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      setPinLocation({ lat: pos.lat, lng: pos.lng });
      reverseGeocode(pos.lat, pos.lng);
    });

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setPinLocation({ lat, lng });
      reverseGeocode(lat, lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [locationSet, pinLocation]);

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onToast("Photo must be under 5MB.", "error");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      onToast("Please enter a spot name.", "error");
      return;
    }
    if (!locationSet || !pinLocation) {
      onToast("Please select a location using GPS or Landmark search.", "error");
      return;
    }
    if (!form.address.trim()) {
      onToast("Please enter an address or area name.", "error");
      return;
    }
    if (!form.reviewText.trim()) {
      onToast("Please add a short note about this spot.", "error");
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = "";
      if (selectedFile) {
        const user = auth.currentUser;
        const fileExt = selectedFile.name.split(".").pop();
        const fileRef = ref(storage, `spots/${user?.uid || "anon"}_${Date.now()}.${fileExt}`);
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
      const created = res.data?.spot || { ...payload, id: res.data?.spot?.id || Date.now() };
      setSubmittedSpot(created);
      onToast("Spot published successfully!", "success");
      onCreated?.(created);
    } catch (err) {
      console.error(err);
      onToast(err.response?.data?.error || "Failed to publish spot. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedSpot) {
    return (
      <div className="cmhub-page-shell" style={{ maxWidth: 540, margin: "0 auto", paddingBottom: 60 }}>
        <div className="cmhub-form-card uber-form-card uber-success-card">
          <div className="uber-success-icon-wrap">
            <IconCheck size={28} color="#000000" />
          </div>

          <span className="uber-points-pill">
            +150 SCOUT POINTS EARNED
          </span>

          <h2 className="uber-success-title">
            Spot Published!
          </h2>
          <p className="uber-subtitle" style={{ textAlign: "center", maxWidth: 400, margin: "0 auto 20px" }}>
            "{submittedSpot.name}" is now live on the community map for students and explorers.
          </p>

          {/* Mini Spot Preview Card */}
          <div className="uber-spot-preview-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="uber-category-tag">
                {submittedSpot.type ? submittedSpot.type.toUpperCase() : "SPOT"}
              </span>
              <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#FFFFFF" }}>
                ★ {Number(submittedSpot.avgRating || form.rating || 5).toFixed(1)}
              </span>
            </div>
            <h3 style={{ margin: "4px 0 6px", color: "#FFFFFF", fontSize: "1.2rem", fontWeight: 800 }}>
              {submittedSpot.name}
            </h3>
            <p style={{ margin: "0 0 10px", color: "#A0A0A0", fontSize: "0.82rem" }}>
              {submittedSpot.address}
            </p>
            <div style={{ display: "flex", gap: 8, fontSize: "0.76rem", color: "#71717A" }}>
              <span>₹{submittedSpot.priceMin || form.priceMin} – ₹{submittedSpot.priceMax || form.priceMax}</span>
              <span>•</span>
              <span>{submittedSpot.openTime || form.openTime} – {submittedSpot.closeTime || form.closeTime}</span>
            </div>
          </div>

          {/* Action Buttons */}
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
    <div className="cmhub-page-shell" style={{ maxWidth: 680, margin: "0 auto", paddingBottom: 60 }}>
      <div className="cmhub-form-card uber-form-card">
        {/* Header */}
        <div className="cmhub-form-header">
          <div>
            <h1 className="uber-form-title">Add a Spot</h1>
            <p className="uber-subtitle">
              Add a verified hotel, restaurant, cafe, or local food adda.
            </p>
          </div>
          <button type="button" className="uber-secondary-btn" onClick={onBack}>
            <IconClose size={16} />
            <span>Cancel</span>
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Spot Name */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Spot Name *</label>
            <input
              type="text"
              className="cmhub-input"
              placeholder="e.g. The Oberoi, Meghana Foods, Third Wave Coffee"
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

          {/* ── Location Section ── */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Location</label>

            {/* Two option cards */}
            <div className="loc-option-cards">
              {/* GPS Card */}
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

              {/* Landmark Search Card */}
              <button
                type="button"
                className={`loc-option-card ${locationMode === "search" ? "active" : ""}`}
                onClick={() => setLocationMode("search")}
              >
                <span className="loc-option-icon">
                  <IconSearch size={18} />
                </span>
                <div className="loc-option-text">
                  <strong>Search Address</strong>
                  <span>Type a street, college, or area</span>
                </div>
                {locationMode === "search" && locationSet && (
                  <span className="loc-option-check"><IconCheck size={14} /></span>
                )}
              </button>
            </div>

            {/* Autocomplete Input when Search is chosen */}
            {locationMode === "search" && (
              <div className="loc-search-box-wrap" style={{ marginTop: 10 }}>
                <div className="cmhub-search-bar" style={{ borderRadius: 12 }}>
                  <IconSearch size={16} className="cmhub-search-icon" />
                  <input
                    type="text"
                    className="cmhub-search-input"
                    placeholder="Search e.g. MSRIT Gate 2, Koramangala 5th Block, Indiranagar..."
                    value={landmarkQuery}
                    onChange={(e) => handleLandmarkInput(e.target.value)}
                    autoFocus
                  />
                  {isSearchingLandmark && (
                    <span className="button-spinner" style={{ width: 16, height: 16, marginRight: 10 }} />
                  )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="loc-suggestions-dropdown">
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="loc-suggestion-item"
                        onClick={() => handleSelectSuggestion(item)}
                      >
                        <IconNavigation size={14} />
                        <div className="loc-suggestion-text">
                          <strong>{item.display_name.split(",")[0]}</strong>
                          <span>{item.display_name.split(",").slice(1, 4).join(",")}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Location Status Bar */}
            {locationSet && pinLocation && (
              <div className="loc-status-bar">
                <IconCheck size={16} />
                <span>
                  Location pinned: {pinLocation.lat.toFixed(4)}, {pinLocation.lng.toFixed(4)}
                </span>
              </div>
            )}

            {/* Interactive Pin Map */}
            {locationSet && pinLocation && (
              <div className="loc-map-container-wrap" style={{ marginTop: 10 }}>
                <div
                  ref={mapContainerRef}
                  style={{
                    width: "100%",
                    height: 220,
                    borderRadius: 14,
                    border: "1px solid #262626",
                    overflow: "hidden",
                  }}
                />
                <div className="loc-map-hint">
                  Drag marker or tap map to adjust exact spot position
                </div>
              </div>
            )}
          </div>

          {/* Address String */}
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

          {/* Price Range */}
          <div className="cmhub-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="cmhub-form-group">
              <label className="cmhub-label">Min Price (₹)</label>
              <input
                type="number"
                className="cmhub-input"
                min="0"
                value={form.priceMin}
                onChange={(e) => update("priceMin", e.target.value)}
              />
            </div>
            <div className="cmhub-form-group">
              <label className="cmhub-label">Max Price (₹)</label>
              <input
                type="number"
                className="cmhub-input"
                min="0"
                value={form.priceMax}
                onChange={(e) => update("priceMax", e.target.value)}
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div className="cmhub-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="cmhub-form-group">
              <label className="cmhub-label">Opening Time</label>
              <input
                type="time"
                className="cmhub-input"
                value={form.openTime}
                onChange={(e) => update("openTime", e.target.value)}
              />
            </div>
            <div className="cmhub-form-group">
              <label className="cmhub-label">Closing Time</label>
              <input
                type="time"
                className="cmhub-input"
                value={form.closeTime}
                onChange={(e) => update("closeTime", e.target.value)}
              />
            </div>
          </div>

          {/* Initial Rating */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Your Rating</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  style={{
                    color: form.rating >= star ? "#FFFFFF" : "#3F3F46",
                    background: "none",
                    border: "none",
                    fontSize: "1.8rem",
                    cursor: "pointer",
                  }}
                  onClick={() => update("rating", star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Review Note */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Review / Experience *</label>
            <textarea
              className="cmhub-textarea"
              rows={3}
              placeholder="What makes this place special? Top dishes, ambience, seating..."
              value={form.reviewText}
              onChange={(e) => update("reviewText", e.target.value)}
              required
            />
          </div>

          {/* Pro Tips */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Pro Tip (Optional)</label>
            <input
              type="text"
              className="cmhub-input"
              placeholder="e.g. Ask for extra ghee, parking behind the building"
              value={form.tips}
              onChange={(e) => update("tips", e.target.value)}
            />
          </div>

          {/* Photo Upload */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              className="cmhub-input"
              onChange={handlePhotoSelect}
            />
            {previewUrl && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 10 }}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="uber-cta-btn uber-btn-full"
            disabled={submitting}
            style={{ marginTop: 10, padding: "14px 20px" }}
          >
            {submitting ? (
              <span className="button-spinner" />
            ) : (
              <>
                <IconPlus size={18} />
                <span>Publish Spot</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
