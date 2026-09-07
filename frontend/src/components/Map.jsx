import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  formatAreaLabel,
  getTypeColor,
  getTypeMeta,
  koramangalaCenter,
} from "../utils";
import { IconCrosshair, IconPlus, IconNavigation } from "../icons";

// Premium dark map using free OpenStreetMap tiles + CSS dark filter (no API key needed)
const MAP_STYLES = {
  dark: {
    label: "Dark",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
      className: "map-tile-dark",
    },
  },
  standard: {
    label: "Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    },
  },
};

const createSpotMarker = (spot) => {
  const meta = getTypeMeta(spot.type);
  const rating = Number(spot.avgRating || 4.5).toFixed(1);

  return L.divIcon({
    html: `
      <div class="uber-spot-marker" title="${spot.name}">
        <span class="uber-marker-pin">
          <span class="uber-marker-rating">★ ${rating}</span>
        </span>
        <span class="uber-marker-label">${spot.name}</span>
      </div>
    `,
    className: "",
    iconSize: [120, 48],
    iconAnchor: [60, 24],
    popupAnchor: [0, -20],
  });
};

const userLocationIcon = L.divIcon({
  html: `
    <div class="uber-user-location-marker">
      <span class="uber-user-pulse"></span>
      <span class="uber-user-dot"></span>
    </div>
  `,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function Map({
  spots = [],
  center,
  userLocation,
  setUserLocation,
  currentUser,
  onSpotClick,
  onAddSpot,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userAccuracyCircleRef = useRef(null);
  const [mapStyle, setMapStyle] = useState("dark");
  const [isLocating, setIsLocating] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialCenter =
      userLocation || center || currentUser || koramangalaCenter;

    const map = L.map(mapRef.current, {
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      zoomControl: false,
    }).setView(
      [
        Number(initialCenter.lat) || koramangalaCenter.lat,
        Number(initialCenter.lng) || koramangalaCenter.lng,
      ],
      14
    );

    const styleConfig = MAP_STYLES.dark;
    tileLayerRef.current = L.tileLayer(styleConfig.url, {
      ...styleConfig.options,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      userMarkerRef.current = null;
      userAccuracyCircleRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    if (Number.isFinite(Number(userLocation.lat))) {
      map.flyTo([Number(userLocation.lat), Number(userLocation.lng)], 15, {
        duration: 1.2,
      });
    }
  }, [userLocation]);

  // Handle tile style changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const styleConfig = MAP_STYLES[mapStyle] || MAP_STYLES.dark;
    tileLayerRef.current = L.tileLayer(styleConfig.url, {
      ...styleConfig.options,
    }).addTo(map);
  }, [mapStyle]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    spots.forEach((spot) => {
      const lat = Number(spot.lat);
      const lng = Number(spot.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: createSpotMarker(spot),
        title: spot.name,
      });

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      const typeMeta = getTypeMeta(spot.type);

      const popupContent = `
        <div class="uber-popup-card">
          <div class="uber-popup-header">
            <span class="uber-popup-tag">${typeMeta.label}</span>
            <span class="uber-popup-rating">★ ${Number(spot.avgRating || 4.5).toFixed(1)}</span>
          </div>
          <h4 class="uber-popup-title">${spot.name}</h4>
          <p class="uber-popup-address">${spot.address || "Bengaluru"}</p>
          <div class="uber-popup-meta">
            <span>₹${spot.priceMin || 0} – ₹${spot.priceMax || 0}</span>
            <span>•</span>
            <span>${spot.openTime || "08:00"} - ${spot.closeTime || "23:00"}</span>
          </div>
          <div class="uber-popup-actions">
            <a
              href="${googleMapsUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="uber-popup-directions-btn"
            >
              Get Directions
            </a>
            <button type="button" class="uber-popup-detail-btn" id="popup-btn-${spot.id}">
              Details
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: "uber-leaflet-popup",
      });

      marker.on("popupopen", () => {
        const btn = document.getElementById(`popup-btn-${spot.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.preventDefault();
            onSpotClick?.(spot);
          };
        }
      });

      marker.on("click", () => {
        map.flyTo([lat, lng], 16, { duration: 1.0 });
      });

      marker.addTo(markersLayer);
    });
  }, [spots, onSpotClick]);

  // User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation && Number.isFinite(Number(userLocation.lat))) {
      const lat = Number(userLocation.lat);
      const lng = Number(userLocation.lng);
      const accuracy = Math.max(
        20,
        Math.min(Number(userLocation.accuracy) || 40, 300)
      );

      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = L.circle([lat, lng], {
          radius: accuracy,
          color: "#06C167",
          weight: 1,
          fillColor: "#06C167",
          fillOpacity: 0.08,
          interactive: false,
        }).addTo(map);
      } else {
        userAccuracyCircleRef.current.setLatLng([lat, lng]);
        userAccuracyCircleRef.current.setRadius(accuracy);
      }

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([lat, lng], {
          icon: userLocationIcon,
          zIndexOffset: 2000,
          title: "Your location",
        }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [userLocation]);

  // GPS Locate Action
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const newLoc = { lat: latitude, lng: longitude, accuracy };
        setUserLocation?.(newLoc);
        setIsLocating(false);
        setBannerVisible(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, {
            duration: 1.2,
          });
        }
      },
      (err) => {
        console.error("Locate error:", err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="map-card-wrapper">
      {/* Top floating bar */}
      <div className="map-floating-bar">
        {bannerVisible && !userLocation && (
          <div className="map-floating-banner">
            <span>Enable location to show spots near you</span>
            <button
              type="button"
              className="map-btn-enable-loc"
              onClick={handleLocateMe}
              disabled={isLocating}
            >
              {isLocating ? "Locating..." : "Enable GPS"}
            </button>
          </div>
        )}

        {/* Map style switcher */}
        <div className="map-floating-controls">
          <div className="map-style-menu-wrap">
            <button
              type="button"
              className="map-ctrl-btn"
              onClick={() => setStyleMenuOpen((v) => !v)}
              title="Change Map Theme"
            >
              {MAP_STYLES[mapStyle]?.label || "Dark"}
            </button>
            {styleMenuOpen && (
              <div className="map-style-dropdown">
                {Object.entries(MAP_STYLES).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    className={`map-style-option ${mapStyle === key ? "active" : ""}`}
                    onClick={() => {
                      setMapStyle(key);
                      setStyleMenuOpen(false);
                    }}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="map-ctrl-btn"
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Center on my location"
          >
            <IconCrosshair size={14} />
            <span>{isLocating ? "Locating..." : "Locate"}</span>
          </button>
        </div>
      </div>

      {/* Zoom controls on right */}
      <div className="map-zoom-controls">
        <button
          type="button"
          className="map-zoom-btn"
          onClick={handleZoomIn}
          title="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="map-zoom-btn"
          onClick={handleZoomOut}
          title="Zoom out"
        >
          −
        </button>
      </div>

      {/* Add Spot CTA on bottom right */}
      {onAddSpot && (
        <button
          type="button"
          className="map-add-spot-btn"
          onClick={onAddSpot}
          title="Add a new spot"
        >
          <IconPlus size={16} />
          <span>Add Spot</span>
        </button>
      )}

      <div id="map-container" ref={mapRef} />

      {/* Legend */}
      <div className="map-legend" aria-label="Map legend">
        <span><i className="map-legend-user" /> Your location</span>
        <span><i className="map-legend-spot" /> Spot pin</span>
        <span className="map-spots-count">{spots.length} spots</span>
      </div>
    </div>
  );
}
