import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { formatDistance, getCoordinatesFromArea, getDistance, isOpenNow, koramangalaCenter } from "../utils";

const MAP_STYLE_STORAGE_KEY = "adda-map-style";
const MAP_STYLE_ORDER = ["dark", "light", "satellite"];
const MAP_STYLES = {
  dark: {
    label: "🌑 Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    options: {
      attribution: "© CartoDB",
      subdomains: "abcd",
      maxZoom: 19,
    },
  },
  light: {
    label: "☀️ Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    options: {
      attribution: "© CartoDB",
      subdomains: "abcd",
      maxZoom: 19,
    },
  },
  satellite: {
    label: "🛰 Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution: "© Esri",
      maxZoom: 19,
    },
  },
};

const formatMarkerDistance = (distanceKm) => `${distanceKm.toFixed(1)}km`;

const createSpotIcon = (type, distanceKm) => {
  const isBiryani = type === "biryani";
  const emoji = isBiryani ? "🍛" : "☕";
  const color = isBiryani ? "#1D9E75" : "#E8A020";
  const shadow = isBiryani ? "rgba(29,158,117,0.6)" : "rgba(232,160,32,0.6)";
  const distance = distanceKm !== null ? formatMarkerDistance(distanceKm) : "";

  return L.divIcon({
    html: `<div style="
      background:${color};
      width:56px;
      height:56px;
      border-radius:50%;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      border:3px solid white;
      box-shadow:0 4px 12px ${shadow};
      gap:1px;
    ">
      <span style="font-size:20px;line-height:1">${emoji}</span>
      <span style="font-size:9px;font-weight:700;color:white;line-height:1">${distance}</span>
    </div>`,
    className: "",
    iconSize: [56, 56],
    iconAnchor: [28, 28],
    popupAnchor: [0, -32],
  });
};

const userLocationIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 0 8px rgba(59,130,246,0.24);animation:userPulseGlow 2s infinite"></div>`,
  className: "",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const getPopupMarkup = (spot, distanceText = "") => {
  const avgRating = Number(spot.avgRating || 0).toFixed(1);
  const reviewCount = Number(spot.reviewCount || 0);
  const status = isOpenNow(spot.openTime, spot.closeTime) ? "Open" : "Closed";

  return `
    <div style="background:#1A1D27;color:#F0F0F0;border-radius:12px;padding:12px;min-width:160px;border:1px solid #2A2D3A">
      <div style="font-weight:600;font-size:14px;margin-bottom:4px">${spot.name}</div>
      <div style="color:#E8A020;font-size:12px">★ ${avgRating} · ${reviewCount} reviews</div>
      <div style="color:#8A8D9A;font-size:12px;margin-top:4px">₹${spot.priceMin || 0}–₹${spot.priceMax || 0}</div>
      <div style="color:${status === "Open" ? "#7EE0B8" : "#FF9CA5"};font-size:12px;margin-top:4px">${status}</div>
      ${distanceText ? `<div style="color:#8A8D9A;font-size:12px;margin-top:4px">${distanceText}</div>` : ""}
    </div>
  `;
};

export default function Map({ spots = [], center, userLocation, setUserLocation, userArea, currentUser, onSpotClick }) {
  const mapRef = useRef(null);
  const mapInitialized = useRef(false);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const exactLocationRef = useRef(null);
  const spotsRef = useRef(spots);
  const onSpotClickRef = useRef(onSpotClick);
  const renderUserLocationRef = useRef(() => {});
  const renderSpotsRef = useRef(() => {});
  const [isLocating, setIsLocating] = useState(false);
  const [locationBannerVisible, setLocationBannerVisible] = useState(true);
  const [currentStyle, setCurrentStyle] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const savedStyle = window.localStorage.getItem(MAP_STYLE_STORAGE_KEY);
    return MAP_STYLE_ORDER.includes(savedStyle) ? savedStyle : "dark";
  });

  spotsRef.current = spots;
  onSpotClickRef.current = onSpotClick;

  useEffect(() => {
    if (mapInitialized.current) return;

    const container = document.getElementById("map-container");
    if (!container) return;

    mapInitialized.current = true;

    const initialCenter = userLocation || center || currentUser || koramangalaCenter;
    const mapInstance = L.map("map-container", {
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      scrollWheelZoom: true,
    });

    mapRef.current = mapInstance;

    const initialStyle = MAP_STYLES[currentStyle] || MAP_STYLES.dark;
    tileLayerRef.current = L.tileLayer(initialStyle.url, initialStyle.options).addTo(mapInstance);

    markersLayerRef.current = L.layerGroup().addTo(mapInstance);
    mapInstance.setView(
      [Number(initialCenter.lat) || koramangalaCenter.lat, Number(initialCenter.lng) || koramangalaCenter.lng],
      13
    );

    renderUserLocationRef.current = (lat, lng, accuracy = 0) => {
      if (!mapRef.current) return;

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }

      userMarkerRef.current = L.marker([lat, lng], {
        icon: userLocationIcon,
        zIndexOffset: 1000,
      }).addTo(mapRef.current);

      accuracyCircleRef.current = L.circle([lat, lng], {
        radius: accuracy,
        color: "#1D9E75",
        fillColor: "#1D9E75",
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(mapRef.current);
    };

    renderSpotsRef.current = (originLocation) => {
      if (!markersLayerRef.current || !mapRef.current) return;

      markersLayerRef.current.clearLayers();

      spotsRef.current.forEach((spot) => {
        const spotLat = Number(spot.lat);
        const spotLng = Number(spot.lng);

        if (Number.isNaN(spotLat) || Number.isNaN(spotLng)) return;

        const distanceMeters = originLocation
          ? getDistance(originLocation.lat, originLocation.lng, spotLat, spotLng)
          : null;
        const distanceKm = distanceMeters !== null ? distanceMeters / 1000 : null;

        const marker = L.marker([spotLat, spotLng], {
          icon: createSpotIcon(spot.type, distanceKm),
        });

        marker.bindPopup(
          getPopupMarkup(spot, distanceMeters !== null ? formatDistance(distanceMeters) : ""),
          { className: "custom-popup" }
        );

        marker.on("click", () => {
          mapRef.current?.flyTo([spotLat, spotLng], 17, {
            duration: 1.2,
            easeLinearity: 0.1,
          });

          if (typeof onSpotClickRef.current === "function") {
            onSpotClickRef.current(spot);
          }
        });

        marker.addTo(markersLayerRef.current);
      });
    };

    const startingLocation =
      userLocation && typeof userLocation.lat === "number" && typeof userLocation.lng === "number"
        ? userLocation
        : typeof currentUser?.lat === "number" && typeof currentUser?.lng === "number"
          ? { lat: currentUser.lat, lng: currentUser.lng }
          : null;

    if (startingLocation) {
      mapInstance.setView([startingLocation.lat, startingLocation.lng], 15);
      renderUserLocationRef.current(startingLocation.lat, startingLocation.lng);
    }

    renderSpotsRef.current(startingLocation);

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }

      if (tileLayerRef.current && tileLayerRef.current.remove) {
        tileLayerRef.current.remove();
        tileLayerRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      markersLayerRef.current = null;
      mapInitialized.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const exactLocation = exactLocationRef.current;
    const nextLocation = exactLocation || (
      userLocation && typeof userLocation.lat === "number" && typeof userLocation.lng === "number"
        ? { lat: userLocation.lat, lng: userLocation.lng, accuracy: 0 }
        : typeof currentUser?.lat === "number" && typeof currentUser?.lng === "number"
          ? { lat: currentUser.lat, lng: currentUser.lng, accuracy: 0 }
          : null
    );

    if (!nextLocation) {
      renderSpotsRef.current(null);
      return;
    }

    mapRef.current.setView([nextLocation.lat, nextLocation.lng], exactLocation ? 16 : 15);
    renderUserLocationRef.current(nextLocation.lat, nextLocation.lng, nextLocation.accuracy || 0);
    renderSpotsRef.current({ lat: nextLocation.lat, lng: nextLocation.lng });
  }, [currentUser?.lat, currentUser?.lng, spots, userLocation]);

  const fallbackToUserArea = async () => {
    const fallbackCenter = userArea ? await getCoordinatesFromArea(userArea) : center || koramangalaCenter;
    exactLocationRef.current = null;
    mapRef.current?.setView([fallbackCenter.lat, fallbackCenter.lng], 13);
    renderSpotsRef.current(fallbackCenter);
    if (typeof setUserLocation === "function") {
      setUserLocation(fallbackCenter);
    }
  };

  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      console.error("GPS error:", new Error("Geolocation is not supported in this browser."));
      void fallbackToUserArea();
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        console.log("Location accuracy:", accuracy, "meters");
        exactLocationRef.current = { lat: latitude, lng: longitude, accuracy };
        mapRef.current?.setView([latitude, longitude], 16);
        renderUserLocationRef.current(latitude, longitude, accuracy);
        renderSpotsRef.current({ lat: latitude, lng: longitude });
        setUserLocation?.({ lat: latitude, lng: longitude });
        setLocationBannerVisible(false);
        setIsLocating(false);
      },
      (err) => {
        console.error("GPS error:", err);
        setIsLocating(false);
        void fallbackToUserArea();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const switchMapStyle = () => {
    if (!mapRef.current || !tileLayerRef.current) return;

    try {
      tileLayerRef.current.remove();
    } catch (error) {
      console.error("Style switch remove error:", error);
    }

    const nextStyle =
      MAP_STYLE_ORDER[(MAP_STYLE_ORDER.indexOf(currentStyle) + 1 + MAP_STYLE_ORDER.length) % MAP_STYLE_ORDER.length];
    const nextConfig = MAP_STYLES[nextStyle] || MAP_STYLES.dark;

    tileLayerRef.current = L.tileLayer(nextConfig.url, nextConfig.options).addTo(mapRef.current);
    setCurrentStyle(nextStyle);
    window.localStorage.setItem(MAP_STYLE_STORAGE_KEY, nextStyle);
  };

  return (
    <div className="map-shell">
      {locationBannerVisible ? (
        <div className="map-location-banner">
          <span>📍 Allow location access for better results</span>
          <button type="button" className="map-location-button" onClick={handleEnableLocation} disabled={isLocating}>
            {isLocating ? "Locating..." : "Enable Location"}
          </button>
        </div>
      ) : null}
      <button type="button" className="map-style-button" onClick={switchMapStyle}>
        {MAP_STYLES[currentStyle]?.label || "🗺 Style"}
      </button>
      <div id="map-container" style={{ height: "55vh", width: "100%" }} />
    </div>
  );
}
