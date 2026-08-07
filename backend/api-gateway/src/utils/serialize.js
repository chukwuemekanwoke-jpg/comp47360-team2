function toUserJson(row) {
  const user = {
    id: row.id,
    displayName: row.display_name,
    budgetTier: row.budget_tier,
    dietaryTags: row.dietary_tags ?? [],
    preferredCuisines: row.preferred_cuisines ?? [],
    diningStyles: row.dining_styles ?? [],
    requiresWheelchairAccess: row.requires_wheelchair_access ?? false,
    requiresSensoryFriendly: row.requires_sensory_friendly ?? false,
    createdAt: row.created_at.toISOString(),
  };

  if (row.last_lat != null) {
    user.lastLat = Number(row.last_lat);
  }
  if (row.last_lng != null) {
    user.lastLng = Number(row.last_lng);
  }
  if (row.email != null) {
    user.email = row.email;
  }

  return user;
}

function toRestaurantSummary(row) {
  const summary = {
    id: row.id,
    name: row.name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    neighborhood: row.neighborhood,
    availableTableCount: row.available_table_count,
    capacity: row.capacity,
    cuisine: row.cuisine,
    busynessScore: row.busyness_score != null ? Number(row.busyness_score) : 0,
    rating: row.rating != null ? Number(row.rating) : null,
    reviews: row.reviews != null ? Number(row.reviews) : null,
    isWheelchairAccessible: row.is_wheelchair_accessible,
    sensoryFriendly: row.sensory_friendly,
  };

  if (row.distance_meters != null) {
    summary.distanceMeters = Math.round(Number(row.distance_meters));
  }

  return summary;
}

function toRestaurantDetail(row) {
  const detail = {
    ...toRestaurantSummary(row),
    addressLine: row.address_line,
    holdWindowMinutes: row.hold_window_minutes,
  };

  if (row.phone != null) {
    detail.phone = row.phone;
  }

  return detail;
}

function toCampaignJson(row, now = new Date()) {
  const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
  const secondsRemaining = expiresAt
    ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
    : null;

  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    status: row.status,
    tableQuota: row.table_quota,
    tablesClaimed: row.tables_claimed,
    discountPercent: row.discount_percent,
    createdAt: row.created_at.toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    secondsRemaining,
  };
}

function toOfferInboxItem(row, now = new Date()) {
  const expiresAt = new Date(row.expires_at);
  const secondsRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
  const canAccept = row.status === "pending" && secondsRemaining > 0;

  return {
    id: row.id,
    campaignId: row.campaign_id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    status: row.status,
    discountPercent: row.discount_percent,
    expiresAt: expiresAt.toISOString(),
    secondsRemaining,
    canAccept,
  };
}

function toManagerOfferItem(row, now = new Date()) {
  const expiresAt = new Date(row.expires_at);
  const secondsRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

  return {
    id: row.id,
    campaignId: row.campaign_id,
    status: row.status,
    expiresAt: expiresAt.toISOString(),
    secondsRemaining,
    acceptedAt: row.accepted_at ? new Date(row.accepted_at).toISOString() : null,
  };
}

function toBookingJson(row) {
  const booking = {
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    offerId: row.offer_id,
    campaignId: row.campaign_id,
    status: row.status,
    transportMode: row.transport_mode,
    etaMinutes: row.eta_minutes,
    holdExpiresAt: row.hold_expires_at.toISOString(),
  };

  if (row.confirmed_at) {
    booking.confirmedAt = row.confirmed_at.toISOString();
  }

  if (row.cancelled_at) {
    booking.cancelledAt = row.cancelled_at.toISOString();
  }

  if (row.eta_source != null) {
    booking.source = row.eta_source;
  }

  return booking;
}

function toRestaurantBookingJson(row) {
  return {
    ...toBookingJson(row),
    userDisplayName: row.user_display_name,
  };
}

function toRevpashJson(summary) {
  return {
    restaurantId: summary.restaurantId,
    window: summary.window,
    revenue: roundMoney(summary.revenue),
    availableSeatHours: roundMoney(summary.availableSeatHours),
    revpash: roundMoney(summary.revpash),
  };
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

module.exports = {
  toUserJson,
  toRestaurantSummary,
  toRestaurantDetail,
  toCampaignJson,
  toOfferInboxItem,
  toManagerOfferItem,
  toBookingJson,
  toRestaurantBookingJson,
  toRevpashJson,
};
