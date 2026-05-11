import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import api from "../api";
import { auth, storage } from "../firebase";
import { getTypeColor } from "../utils";

const mapPinIcon = L.divIcon({
  className: "",
  html: '<div class="drop-pin">📍</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

const timeOptions = (() => {
  const values = [];
  for (let hour = 5; hour <= 26; hour += 0.5) {
    const normalizedHour = Math.floor(hour) % 24;
    const minutes = hour % 1 === 0 ? "00" : "30";
    values.push(`${String(normalizedHour).padStart(2, "0")}:${minutes}`);
  }
  return values;
})();

const initialState = {
  name: "",
  type: "chai",
  address: "",
  priceMin: "",
  priceMax: "",
  openTime: "08:00",
  closeTime: "23:00",
  reviewText: "",
  tips: "",
  rating: 5,
};

export default function AddPin({ userLocation, onBack, onToast, onCreated }) {
  const [form, setForm] = useState(initialState);
  const [coords, setCoords] = useState(userLocation || { lat: 12.9352, lng: 77.6245 });
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const typeColor = getTypeColor(form.type);
  const livePrice = useMemo(() => {
    if (!form.priceMin || !form.priceMax) return "₹0 – ₹0";
    return `₹${form.priceMin} – ₹${form.priceMax}`;
  }, [form.priceMin, form.priceMax]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([coords.lat, coords.lng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markerRef.current = L.marker([coords.lat, coords.lng], { icon: mapPinIcon }).addTo(map);
    map.on("click", (event) => {
      setCoords({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [coords.lat, coords.lng]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([coords.lat, coords.lng], map.getZoom(), { animate: true });
    markerRef.current?.setLatLng([coords.lat, coords.lng]);
  }, [coords]);

  useEffect(() => {
    if (userLocation) setCoords(userLocation);
  }, [userLocation]);

  const validate = () => {
    const nextErrors = {};
    ["name", "address", "priceMin", "priceMax", "reviewText"].forEach((field) => {
      if (!form[field]) nextErrors[field] = "Please fill in this field.";
    });
    if (!coords?.lat || !coords?.lng) nextErrors.coords = "Please drop a pin on the map.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      let photoUrl = "";
      if (photo) {
        const uid = auth.currentUser?.uid || "anonymous";
        const fileRef = ref(storage, `spot-photos/${uid}/${Date.now()}-${photo.name}`);
        await uploadBytes(fileRef, photo);
        photoUrl = await getDownloadURL(fileRef);
      }

      const response = await api.post("/spots", {
        ...form,
        lat: coords.lat,
        lng: coords.lng,
        priceMin: Number(form.priceMin),
        priceMax: Number(form.priceMax),
        photoUrl,
      });

      onToast(`Spot added successfully. +${response.data.pointsAwarded || 50} scout points`, "success");
      onCreated?.(response.data.spot);
      onBack();
    } catch (error) {
      onToast(error.response?.data?.error || "We could not add this spot", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="full-screen-panel">
      <header className="panel-header">
        <button type="button" className="ghost-button" onClick={onBack}>
          ← Back
        </button>
        <h2>Add a new spot</h2>
      </header>

      <div className="form-stack">
        <label>
          <span>Spot name</span>
          <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Usman Biryani, Irani Chai Corner…" />
          {errors.name && <small className="field-error">{errors.name}</small>}
        </label>

        <div>
          <span>Type</span>
          <div className="type-toggle">
            {["chai", "biryani"].map((type) => (
              <button
                key={type}
                type="button"
                className={`type-option ${form.type === type ? "selected" : ""}`}
                style={form.type === type ? { background: getTypeColor(type) } : undefined}
                onClick={() => update("type", type)}
              >
                {type === "chai" ? "☕ CHAI" : "🍛 BIRYANI"}
              </button>
            ))}
          </div>
        </div>

        <label>
          <span>Address</span>
          <input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Street, landmark, neighbourhood" />
          {errors.address && <small className="field-error">{errors.address}</small>}
        </label>

        <div className="row gap-md">
          <label className="grow">
            <span>Price min</span>
            <input type="number" value={form.priceMin} onChange={(event) => update("priceMin", event.target.value)} />
            {errors.priceMin && <small className="field-error">{errors.priceMin}</small>}
          </label>
          <label className="grow">
            <span>Price max</span>
            <input type="number" value={form.priceMax} onChange={(event) => update("priceMax", event.target.value)} />
            {errors.priceMax && <small className="field-error">{errors.priceMax}</small>}
          </label>
        </div>

        <p className="muted">Live range: <strong style={{ color: typeColor }}>{livePrice}</strong></p>

        <div className="row gap-md">
          <label className="grow">
            <span>Open time</span>
            <select value={form.openTime} onChange={(event) => update("openTime", event.target.value)}>
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </label>
          <label className="grow">
            <span>Close time</span>
            <select value={form.closeTime} onChange={(event) => update("closeTime", event.target.value)}>
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <span>Drop the pin</span>
          <div className="mini-map-shell">
            <div ref={mapRef} className="leaflet-map" />
          </div>
          <p className="muted">Lat {coords.lat.toFixed(5)} · Lng {coords.lng.toFixed(5)}</p>
          {errors.coords && <small className="field-error">{errors.coords}</small>}
        </div>

        <label>
          <span>Your review</span>
          <textarea value={form.reviewText} onChange={(event) => update("reviewText", event.target.value)} placeholder="What should people order? What is the experience like?" />
          {errors.reviewText && <small className="field-error">{errors.reviewText}</small>}
        </label>

        <label>
          <span>Any tips?</span>
          <textarea
            value={form.tips}
            onChange={(event) => update("tips", event.target.value)}
            placeholder="Best time to visit, what to order, parking, anything helpful..."
          />
        </label>

        <div>
          <span>Star rating</span>
          <div className="star-picker">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-button ${form.rating >= star ? "selected" : ""}`}
                style={form.rating >= star ? { color: typeColor } : undefined}
                onClick={() => update("rating", star)}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <label className="upload-box">
          <input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
          <span>📷 Add a photo</span>
          <small>{photo ? photo.name : "Optional, but a great photo always helps."}</small>
        </label>

        <button type="button" className="primary-button large" onClick={submit} disabled={saving}>
          {saving ? "Saving spot…" : "Pin this spot"}
        </button>
      </div>
    </section>
  );
}
