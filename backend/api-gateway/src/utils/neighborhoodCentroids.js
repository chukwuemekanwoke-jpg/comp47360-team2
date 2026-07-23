// Manhattan neighbourhood centroids for Story 2.2 manual search fallback.
// Mirrors frontend/mobile-app/src/components/ManhattanAreaPicker.tsx so the
// mobile client can eventually drop its duplicate lookup table.
const MANHATTAN_CENTROIDS = [
  { names: ["manhattan"], lat: 40.7831, lng: -73.9712 },
  { names: ["financial district"], lat: 40.7075, lng: -74.0113 },
  { names: ["tribeca"], lat: 40.7163, lng: -74.0086 },
  { names: ["chinatown"], lat: 40.7158, lng: -73.997 },
  { names: ["lower east side"], lat: 40.715, lng: -73.9843 },
  { names: ["soho"], lat: 40.7233, lng: -74.003 },
  { names: ["greenwich village"], lat: 40.7336, lng: -74.0027 },
  { names: ["east village"], lat: 40.7265, lng: -73.9815 },
  { names: ["chelsea"], lat: 40.7465, lng: -74.0014 },
  { names: ["gramercy"], lat: 40.7368, lng: -73.9845 },
  { names: ["midtown", "midtown east", "theater district"], lat: 40.7549, lng: -73.984 },
  { names: ["hell's kitchen", "hells kitchen"], lat: 40.7638, lng: -73.9918 },
  { names: ["upper east side"], lat: 40.7736, lng: -73.9566 },
  { names: ["upper west side"], lat: 40.787, lng: -73.9754 },
  { names: ["harlem"], lat: 40.8116, lng: -73.9465 },
  { names: ["koreatown", "murray hill"], lat: 40.7484, lng: -73.9857 },
];

function normalizeNeighborhood(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveNeighborhoodCentroid(neighborhood) {
  const query = normalizeNeighborhood(neighborhood);

  for (const entry of MANHATTAN_CENTROIDS) {
    if (entry.names.some((name) => name === query)) {
      return { lat: entry.lat, lng: entry.lng, label: entry.names[0] };
    }
  }

  for (const entry of MANHATTAN_CENTROIDS) {
    const match = entry.names.find((name) => name.includes(query) || query.includes(name));
    if (match) {
      return { lat: entry.lat, lng: entry.lng, label: match };
    }
  }

  return null;
}

module.exports = { MANHATTAN_CENTROIDS, resolveNeighborhoodCentroid, normalizeNeighborhood };
