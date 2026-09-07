import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api";
import { IconLocation, IconCheck, IconCrosshair, IconChevronRight } from "../icons";

const colors = ["#10B981", "#F59E0B", "#8B5CF6", "#3B82F6", "#EC4899", "#F97316"];

export default function Onboarding({ authUser, onComplete, onToast }) {
  const [name, setName] = useState(authUser?.displayName || "");
  const [area, setArea] = useState("");
  const [areaCoords, setAreaCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [avatarColor, setAvatarColor] = useState(colors[0]);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const query = area.trim();

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (query.length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return undefined;
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query
          )}&format=json&limit=5&addressdetails=1`
        );
        const results = await response.json();
        setSuggestions(
          (results || []).map((entry) => ({
            label: entry.display_name,
            lat: Number(entry.lat),
            lng: Number(entry.lon),
          }))
        );
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [area]);

  const submit = async () => {
    if (!name.trim() || !area.trim()) {
      onToast("Please add your name and campus/neighbourhood.", "error");
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/users/${authUser.uid}`, {
        name: name.trim(),
        area: area.trim(),
        areaLat: areaCoords?.lat ?? null,
        areaLng: areaCoords?.lng ?? null,
        lat: areaCoords?.lat ?? null,
        lng: areaCoords?.lng ?? null,
        avatarColor,
        onboardingComplete: true,
      });
      onComplete(response.data.user);
    } catch (error) {
      onToast(
        error.response?.data?.error || "We could not save your profile details.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Location access is unavailable. Please type your neighbourhood instead."
      );
      return;
    }

    setDetectingLocation(true);
    setLocationDetected(false);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          const data = await response.json();
          const areaLabel =
            data?.address?.suburb ||
            data?.address?.neighbourhood ||
            data?.address?.city_district ||
            data?.address?.city ||
            "Current Location";

          setArea(areaLabel);
          setAreaCoords({ lat, lng: lon });
          setLocationDetected(true);
          setShowSuggestions(false);
        } catch {
          setLocationError("Could not detect area name. Please type it below.");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        setLocationDetected(false);
        setLocationError("Location access was denied. Please type your area below.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <main className="auth-fullscreen">
      <div className="auth-glass-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo-badge">
          <span style={{ color: "#10B981" }}>●</span>
          <span style={{ fontWeight: 900, fontStyle: "italic" }}>cmhub</span>
          <span style={{ color: "#71717A" }}>/</span>
          <span style={{ color: "#FFFFFF", fontWeight: 700 }}>Profile Setup</span>
        </div>

        <div>
          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: "0 0 6px 0",
              color: "#FFFFFF",
            }}
          >
            Welcome to Adda Map
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: "0.9rem", margin: 0 }}>
            Set up your profile to discover nearby food spots and night addas.
          </p>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            textAlign: "left",
          }}
        >
          {/* Name Field */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Your Name or Nickname</label>
            <input
              type="text"
              className="cmhub-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ayush, foodie_rahul"
            />
          </div>

          {/* Location Action */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Campus or Neighbourhood</label>
            <button
              type="button"
              className="cmhub-btn-secondary"
              style={{
                width: "100%",
                borderColor: locationDetected ? "#10B981" : undefined,
                color: locationDetected ? "#10B981" : undefined,
              }}
              onClick={useCurrentLocation}
              disabled={detectingLocation}
            >
              <span>{locationDetected ? <IconCheck size={16} color="#10B981" /> : <IconCrosshair size={16} />}</span>
              <span>
                {detectingLocation
                  ? "Detecting location..."
                  : locationDetected
                  ? "Location detected!"
                  : "Use My Current Location"}
              </span>
            </button>

            {locationError && (
              <span style={{ color: "#EF4444", fontSize: "0.8rem", marginTop: 4 }}>
                {locationError}
              </span>
            )}

            <div style={{ position: "relative", marginTop: "8px" }}>
              <input
                type="text"
                className="cmhub-input"
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  setAreaCoords(null);
                  setLocationDetected(false);
                }}
                onFocus={() => {
                  if (suggestions.length) setShowSuggestions(true);
                }}
                placeholder="Or type your campus / area (e.g. Koramangala, HSR Layout)..."
              />

              {showSuggestions && (suggestions.length > 0 || loadingSuggestions) && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    background: "#161619",
                    border: "1px solid #222226",
                    borderRadius: "12px",
                    marginTop: "6px",
                    maxHeight: "180px",
                    overflowY: "auto",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                  }}
                >
                  {loadingSuggestions ? (
                    <div style={{ padding: "12px", color: "#9CA3AF", fontSize: "0.85rem" }}>
                      Searching places...
                    </div>
                  ) : (
                    suggestions.map((item, index) => (
                      <button
                        key={`${item.label}-${index}`}
                        type="button"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: "0.85rem",
                          color: "#E4E4E7",
                          borderBottom: "1px solid #222226",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        onClick={() => {
                          setArea(item.label);
                          setAreaCoords({ lat: item.lat, lng: item.lng });
                          setShowSuggestions(false);
                          setLocationDetected(true);
                        }}
                      >
                        <IconLocation size={14} color="#8E8E93" />
                        <span>{item.label}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Color Picker */}
          <div className="cmhub-form-group">
            <label className="cmhub-label">Pick your avatar accent color</label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: color,
                    border: avatarColor === color ? "3px solid #FFFFFF" : "2px solid transparent",
                    boxShadow: avatarColor === color ? `0 0 14px ${color}` : "none",
                    transform: avatarColor === color ? "scale(1.15)" : "scale(1)",
                    transition: "all 150ms ease",
                  }}
                  onClick={() => setAvatarColor(color)}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="cmhub-btn-primary"
          style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
          onClick={submit}
          disabled={saving}
        >
          {saving ? "Setting up..." : "Continue to Adda Map"}
        </button>

        <button
          type="button"
          className="uber-secondary-btn"
          style={{ width: "100%", marginTop: "10px", justifyContent: "center", color: "#EF4444" }}
          onClick={() => signOut(auth)}
        >
          Sign Out / Use Another Account
        </button>
      </div>
    </main>
  );
}
