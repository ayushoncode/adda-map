import { useEffect, useRef, useState } from "react";
import api from "../api";

const colors = ["#E8A020", "#1D9E75", "#FF6B6B", "#6FB1FF", "#A26BFF", "#FF8C42"];

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
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
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
      onToast("Please add your name and location first.", "error");
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/users/${authUser.uid}`, {
        name,
        area,
        areaLat: areaCoords?.lat ?? null,
        areaLng: areaCoords?.lng ?? null,
        lat: areaCoords?.lat ?? null,
        lng: areaCoords?.lng ?? null,
        avatarColor,
        onboardingComplete: true,
      });
      onComplete(response.data.user);
    } catch (error) {
      onToast(error.response?.data?.error || "We could not save your profile details.", "error");
    } finally {
      setSaving(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location access is unavailable. Please type your location instead.");
      return;
    }

    setDetectingLocation(true);
    setLocationDetected(false);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await response.json();
          const detectedArea =
            data?.address?.suburb ||
            data?.address?.neighbourhood ||
            data?.address?.city_district ||
            data?.address?.city;

          setArea(detectedArea || "Current area");
          setAreaCoords({ lat, lng });
          setLocationDetected(true);
          setShowSuggestions(false);
        } catch {
          setLocationError("We could not detect your location. Please type it instead.");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        setLocationDetected(false);
        setLocationError("Location access was denied. Please type your location instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <main className="auth-screen">
      <div className="onboarding-card">
        <h1>What do we call you?</h1>
        <label>
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button
          type="button"
          className={`location-button ${locationDetected ? "location-button-success" : ""}`}
          onClick={useCurrentLocation}
          disabled={detectingLocation}
        >
          <span>{locationDetected ? "✓" : "📍"}</span>
          <span>
            {detectingLocation
              ? "Detecting location…"
              : locationDetected
                ? "Location detected!"
                : "Use my current location"}
          </span>
          {detectingLocation && <span className="button-spinner" />}
        </button>
        {locationError && <p className="location-error">{locationError}</p>}
        <div className="or-divider">or type your location</div>
        <label>
          <span>Your city or neighbourhood</span>
          <div className="autocomplete-wrap">
            <input
              value={area}
              onChange={(event) => {
                setArea(event.target.value);
                setAreaCoords(null);
                setLocationDetected(false);
              }}
              onFocus={() => {
                if (suggestions.length) setShowSuggestions(true);
              }}
              placeholder="e.g. Koramangala, Andheri, Connaught Place, Banjara Hills"
            />
            {showSuggestions && (suggestions.length > 0 || loadingSuggestions) && (
              <div className="autocomplete-dropdown">
                {loadingSuggestions ? (
                  <button type="button" className="autocomplete-item muted" disabled>
                    Searching places…
                  </button>
                ) : (
                  suggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.label}-${suggestion.lat}-${suggestion.lng}`}
                      type="button"
                      className="autocomplete-item"
                      onClick={() => {
                        setArea(suggestion.label);
                        setAreaCoords({ lat: suggestion.lat, lng: suggestion.lng });
                        setLocationDetected(false);
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion.label}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </label>
        <div>
          <span>Pick your color</span>
          <div className="color-grid">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-swatch ${avatarColor === color ? "selected" : ""}`}
                style={{ background: color }}
                onClick={() => setAvatarColor(color)}
              />
            ))}
          </div>
        </div>
        <button type="button" className="primary-button large" onClick={submit} disabled={saving}>
          {saving ? "Setting up…" : "Continue"}
        </button>
      </div>
    </main>
  );
}
