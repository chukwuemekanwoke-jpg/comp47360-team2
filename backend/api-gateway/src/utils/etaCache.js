const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map();

function roundCoord(value) {
  return Number(value).toFixed(4);
}

function cacheKey(restaurantId, lat, lng, mode) {
  return `${restaurantId}:${roundCoord(lat)}:${roundCoord(lng)}:${mode}`;
}

function getCachedEta(restaurantId, lat, lng, mode) {
  const key = cacheKey(restaurantId, lat, lng, mode);
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCachedEta(restaurantId, lat, lng, mode, value) {
  const key = cacheKey(restaurantId, lat, lng, mode);
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

module.exports = { getCachedEta, setCachedEta, CACHE_TTL_MS };
