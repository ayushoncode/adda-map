export const palette = {
  bg: "#0F1117",
  card: "#1A1D27",
  border: "#2A2D3A",
  text: "#F0F0F0",
  muted: "#8A8D9A",
  chai: "#E8A020",
  biryani: "#1D9E75",
  streetFood: "#F97316",
  thali: "#F4C430",
  snacks: "#F59E0B",
  desserts: "#F472B6",
  southIndian: "#14B8A6",
  northIndian: "#EF4444",
  fastFood: "#FB7185",
  juiceDrinks: "#38BDF8",
  danger: "#E25563",
  happening: "#FF4444",
  gem: "#9B59B6",
  night: "#1F3A5F",
  budget: "#1D9E75",
};

export const spotTypes = [
  { value: "chai", label: "Chai", fullLabel: "Chai ☕", emoji: "☕", color: palette.chai },
  { value: "biryani", label: "Biryani", fullLabel: "Biryani 🍛", emoji: "🍛", color: palette.biryani },
  { value: "street-food", label: "Street Food", fullLabel: "Street Food 🌮", emoji: "🌮", color: palette.streetFood },
  { value: "thali", label: "Thali", fullLabel: "Thali 🍱", emoji: "🍱", color: palette.thali },
  { value: "snacks", label: "Snacks", fullLabel: "Snacks 🥪", emoji: "🥪", color: palette.snacks },
  { value: "desserts", label: "Desserts", fullLabel: "Desserts 🍨", emoji: "🍨", color: palette.desserts },
  { value: "south-indian", label: "South Indian", fullLabel: "South Indian 🥘", emoji: "🥘", color: palette.southIndian },
  { value: "north-indian", label: "North Indian", fullLabel: "North Indian 🫕", emoji: "🫕", color: palette.northIndian },
  { value: "fast-food", label: "Fast Food", fullLabel: "Fast Food 🍔", emoji: "🍔", color: palette.fastFood },
  { value: "juice-drinks", label: "Juice & Drinks", fullLabel: "Juice & Drinks 🥤", emoji: "🥤", color: palette.juiceDrinks },
];

export const spotTypeMap = Object.fromEntries(spotTypes.map((entry) => [entry.value, entry]));

export const koramangalaCenter = {
  lat: 12.9352,
  lng: 77.6245,
};

export const levelConfig = [
  { max: 5, label: "Food Explorer", icon: "🗺️", color: "#E8A020" },
  { max: 15, label: "Street Scout", icon: "🔍", color: "#1D9E75" },
  { max: 30, label: "Adda Legend", icon: "🌟", color: "#A26BFF" },
  { max: Infinity, label: "City Champion", icon: "👑", color: "#FFD76A" },
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
  if (!value) return "just now";
  const then = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hr ago`;
  if (days === 1) return "yesterday";
  return `${days} days ago`;
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
  if (meters < 1000) return `${Math.round(meters / 50) * 50}m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
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

export const isBudgetBite = (spot) => Number(spot?.priceMax || 0) <= 40;

export const initials = (name = "AM") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export const filterTint = (filter) => {
  const typeMatch = spotTypes.find((entry) => entry.fullLabel === filter);
  if (typeMatch) return typeMatch.color;
  if (filter === "Happening Now 🔥") return palette.happening;
  if (filter === "Hidden Gem 💎") return palette.gem;
  if (filter === "Night Owl 🦉") return palette.night;
  if (filter === "Budget Bites 💸") return palette.budget;
  return palette.chai;
};

export const getTypeMeta = (type) => spotTypeMap[type] || spotTypeMap.chai;

export const getTypeColor = (type) => getTypeMeta(type).color;

export const formatAreaLabel = (area, fallback = "Your area") => {
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
    tags.push({ label: "🔥 Happening Now", color: palette.happening });
  }
  if (isHiddenGem(spot)) {
    tags.push({ label: "💎 Hidden Gem", color: palette.gem });
  }
  if (closesAfterTen(spot.openTime, spot.closeTime)) {
    tags.push({ label: "🌙 Open Late", color: palette.night });
  }
  if (isBudgetBite(spot)) {
    tags.push({ label: "💸 Under ₹40", color: palette.budget });
  }
  if (Number(spot?.localLoveCount || 0) > 0) {
    tags.push({
      label: `✅ ${spot.localLoveCount} locals love this`,
      color: "#52C97A",
    });
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
