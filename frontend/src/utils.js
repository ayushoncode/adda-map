export const palette = {
  bg: "#000000",
  surface: "#0A0A0A",
  card: "#141414",
  cardHover: "#1C1C1C",
  border: "#262626",
  borderHighlight: "#383838",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  subtle: "#666666",
  accent: "#FFFFFF", // Uber signature crisp white CTA
  accentGreen: "#06C167", // Uber Eats / ride verified green
  restaurant: "#FFFFFF",
  hotel: "#E5E5E5",
  cafe: "#D4D4D8",
  chai: "#E4E4E7",
  biryani: "#F4F4F5",
  streetFood: "#E0E0E0",
  thali: "#D1D5DB",
  snacks: "#E5E7EB",
  desserts: "#F3F4F6",
  southIndian: "#E5E5E5",
  northIndian: "#D4D4D8",
  fastFood: "#F4F4F5",
  juiceDrinks: "#E4E4E7",
  danger: "#E11900", // Uber alert red
  happening: "#FFFFFF",
  gem: "#FFFFFF",
  night: "#06C167",
  budget: "#FFFFFF",
};

export const spotTypes = [
  { value: "restaurant", label: "Restaurants", fullLabel: "Restaurants", color: "#FFFFFF" },
  { value: "hotel", label: "Hotels & Stays", fullLabel: "Hotels", color: "#FFFFFF" },
  { value: "cafe", label: "Cafes & Coffee", fullLabel: "Cafes", color: "#FFFFFF" },
  { value: "chai", label: "Chai & Tea", fullLabel: "Chai & Tea", color: "#FFFFFF" },
  { value: "biryani", label: "Biryani Centers", fullLabel: "Biryani", color: "#FFFFFF" },
  { value: "street-food", label: "Street Food", fullLabel: "Street Food", color: "#FFFFFF" },
  { value: "south-indian", label: "South Indian", fullLabel: "South Indian", color: "#FFFFFF" },
  { value: "north-indian", label: "North Indian & Dhabas", fullLabel: "North Indian", color: "#FFFFFF" },
  { value: "fast-food", label: "Burgers & Rolls", fullLabel: "Fast Food", color: "#FFFFFF" },
  { value: "desserts", label: "Desserts & Bakeries", fullLabel: "Desserts", color: "#FFFFFF" },
  { value: "thali", label: "Meals & Thali", fullLabel: "Thali", color: "#FFFFFF" },
  { value: "juice-drinks", label: "Juices & Drinks", fullLabel: "Juices", color: "#FFFFFF" },
];

export const spotTypeMap = Object.fromEntries(spotTypes.map((entry) => [entry.value, entry]));

export const koramangalaCenter = {
  lat: 12.9352,
  lng: 77.6245,
};

export const levelConfig = [
  { max: 5, label: "Explorer", icon: "•", color: "#A0A0A0" },
  { max: 15, label: "Scout", icon: "••", color: "#D4D4D8" },
  { max: 30, label: "Adda Pro", icon: "•••", color: "#FFFFFF" },
  { max: Infinity, label: "Legend", icon: "••••", color: "#FFFFFF" },
];

export const getLevelFromSpots = (spotsCount = 0) =>
  levelConfig.find((entry) => spotsCount <= entry.max) || levelConfig[levelConfig.length - 1];

export const getNextLevelTarget = (spotsCount = 0) => {
  const next = levelConfig.find((entry) => spotsCount < entry.max);
  return next?.max === Infinity ? spotsCount : next?.max || spotsCount;
};

export const getSpotsToNextLevel = (spotsCount = 0) => {
  const next = levelConfig.find((entry) => spotsCount < entry.max);
  if (!next || next.max === Infinity) return 0;
  return Math.max(0, next.max - spotsCount);
};

export const timeAgo = (value) => {
  if (!value) return "Just now";
  const then = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

export const haversineKm = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some((value) => typeof value !== "number")) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getDistance = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some((value) => typeof value !== "number")) return null;
  const r = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistance = (meters) => {
  if (typeof meters !== "number") return "Nearby";
  if (meters < 1000) return `${Math.round(meters / 50) * 50} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const parseTimeToMinutes = (time) => {
  const [hours, minutes] = String(time || "0:0").split(":").map(Number);
  return hours * 60 + minutes;
};

export const isOpenNow = (openTime, closeTime) => {
  const current = new Date();
  const now = current.getHours() * 60 + current.getMinutes();
  const open = parseTimeToMinutes(openTime);
  const close = parseTimeToMinutes(closeTime);
  if (open === close) return true;
  if (close < open) return now >= open || now <= close;
  return now >= open && now <= close;
};

export const closesAfterTen = (openTime, closeTime) => {
  const open = parseTimeToMinutes(openTime);
  const close = parseTimeToMinutes(closeTime);
  return close >= 22 * 60 || close < open;
};

export const isNightOwlSpot = (spot) =>
  closesAfterTen(spot?.openTime, spot?.closeTime) && isOpenNow(spot?.openTime, spot?.closeTime);

export const isHappeningNow = (spot) => {
  if (!spot?.lastReviewAt) return false;
  return Date.now() - new Date(spot.lastReviewAt).getTime() <= 2 * 60 * 60 * 1000;
};

export const isActiveWithin24Hours = (spot) => {
  if (!spot?.lastReviewAt) return false;
  return Date.now() - new Date(spot.lastReviewAt).getTime() <= 24 * 60 * 60 * 1000;
};

export const isHiddenGem = (spot) => {
  const avgRating = Number(spot?.avgRating || 0);
  const reviewCount = Number(spot?.reviewCount || 0);
  return avgRating >= 4.3 && reviewCount < 20 && reviewCount > 3;
};

export const isBudgetBite = (spot) => Number(spot?.priceMax || 0) <= 60;

export const initials = (name = "U") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export const filterTint = (filter) => {
  return "#FFFFFF";
};

export const getTypeMeta = (type) => spotTypeMap[type] || spotTypeMap.restaurant || {
  label: type ? type.toUpperCase() : "FOOD SPOT",
  fullLabel: type ? type.toUpperCase() : "FOOD SPOT",
  color: "#FFFFFF",
};

export const getTypeColor = (type) => "#FFFFFF";

export const formatAreaLabel = (area, fallback = "Bangalore") => {
  const parts = String(area || "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && !/^\d+$/.test(part) && part.toLowerCase() !== "india");

  if (!parts.length) return fallback;
  if (parts.length === 1) return parts[0];
  return `${parts[0]}, ${parts[1]}`;
};

export const getCityKey = (area) => {
  const label = formatAreaLabel(area, "");
  if (!label) return "";
  const [first, second] = label.split(",").map((part) => part?.trim()).filter(Boolean);
  return String(second || first || "").toLowerCase();
};

export const getSpotTags = (spot) => {
  const tags = [];
  if (isHappeningNow(spot)) {
    tags.push({ label: "Popular Now", color: "#FFFFFF" });
  }
  if (isHiddenGem(spot)) {
    tags.push({ label: "Hidden Gem", color: "#FFFFFF" });
  }
  if (closesAfterTen(spot.openTime, spot.closeTime)) {
    tags.push({ label: "Open Late", color: "#06C167" });
  }
  if (isBudgetBite(spot)) {
    tags.push({ label: "Budget Friendly", color: "#FFFFFF" });
  }
  return tags;
};

export const getCoordinatesFromArea = async (area) => {
  const query = String(area || "").trim();
  if (!query) return koramangalaCenter;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed with status ${response.status}`);
    }

    const results = await response.json();
    const match = results?.[0];
    if (!match?.lat || !match?.lon) {
      return koramangalaCenter;
    }

    return {
      lat: Number(match.lat),
      lng: Number(match.lon),
    };
  } catch {
    return koramangalaCenter;
  }
};
