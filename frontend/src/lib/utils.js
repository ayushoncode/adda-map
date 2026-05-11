export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatTimeAgo(value) {
  const date = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  if (hours < 48) return 'yesterday';
  return `${Math.floor(hours / 24)} days ago`;
}

export function isOpenNow(openTime, closeTime) {
  if (!openTime || !closeTime) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

export function getLevelMeta(user = {}) {
  const spots = user.spotsCount || 0;
  if (spots <= 5) return { label: 'Chai Scout', accent: '#E8A020' };
  if (spots <= 15) return { label: 'Biryani Hunter', accent: '#1D9E75' };
  if (spots <= 30) return { label: 'Street Food Legend', accent: '#8F5BFF' };
  return { label: 'Area Champion', accent: 'linear-gradient(135deg, #E8A020, #FFD700)' };
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
