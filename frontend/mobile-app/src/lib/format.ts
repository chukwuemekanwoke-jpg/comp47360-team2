// Display formatters shared by the restaurant surfaces (card list, map
// callouts, map sheets). Kept platform-neutral — no react-native imports — so
// the leaflet popup on web can use them too.

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Compact review counts so a much-reviewed venue can't push the rating out of
// a card's name row: 362 stays as-is, 1815 reads "1.8k", 24300 reads "24k".
export function formatReviewCount(reviews: number): string {
  if (reviews < 1000) return `${reviews}`;
  const thousands = reviews / 1000;
  // 9.95k up would render as "10.0k", so drop the decimal at that point.
  return thousands < 9.95 ? `${thousands.toFixed(1)}k` : `${Math.round(thousands)}k`;
}

// The rating half of "★ 4.7 (1.8k)", for the two surfaces that can't use the
// RatingBadge component: the native map Callout (rasterised by
// react-native-maps, where vector icons render blank on Android) and the
// leaflet popup (plain HTML). Returns null when the enrichment import hasn't
// supplied a rating yet, so callers can skip the row entirely.
export function formatRating(rating: number | null, reviews: number | null): string | null {
  if (rating == null) return null;
  const count = reviews != null ? ` (${formatReviewCount(reviews)})` : "";
  return `★ ${rating.toFixed(1)}${count}`;
}
