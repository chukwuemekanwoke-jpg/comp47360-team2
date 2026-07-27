const { AppError } = require("../errors");
const { resolveNeighborhoodCentroid } = require("./neighborhoodCentroids");
const {
  DEFAULT_CLOSES_AT,
  DEFAULT_OPENS_AT,
  parseLocalTime,
  parsePartySize,
} = require("./revpash");
const {
  DEFAULT_FLASH_DEAL_TTL_MINUTES,
  MIN_FLASH_DEAL_TTL_MINUTES,
  MAX_FLASH_DEAL_TTL_MINUTES,
} = require("../services/candidateUsers");

const BUDGET_TIERS = new Set(["TIER_1", "TIER_2", "TIER_3"]);
const TRANSPORT_MODES = new Set(["walking", "driving", "transit", "cycling"]);
const DEFAULT_RADIUS_M = 1500;
const DEFAULT_TRANSPORT_MODE = "walking";

function parseCoordinate(value, name) {
  if (value === undefined || value === null || value === "") {
    throw new AppError(400, "VALIDATION_ERROR", `Missing required query parameter: ${name}`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError(400, "VALIDATION_ERROR", `Invalid ${name}: must be a number`);
  }

  return parsed;
}

function parseLatLng(lat, lng) {
  const parsedLat = parseCoordinate(lat, "lat");
  const parsedLng = parseCoordinate(lng, "lng");

  if (parsedLat < -90 || parsedLat > 90) {
    throw new AppError(400, "VALIDATION_ERROR", "lat must be between -90 and 90");
  }
  if (parsedLng < -180 || parsedLng > 180) {
    throw new AppError(400, "VALIDATION_ERROR", "lng must be between -180 and 180");
  }

  return { lat: parsedLat, lng: parsedLng };
}

function parseRadiusM(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_RADIUS_M;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "radiusM must be a positive integer");
  }

  return parsed;
}

function parseOptionalNeighborhood(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(400, "VALIDATION_ERROR", "neighborhood must be a string");
  }

  const neighborhood = value.trim();
  if (!neighborhood) {
    throw new AppError(400, "VALIDATION_ERROR", "neighborhood must not be empty");
  }

  return neighborhood;
}

function hasCoordinate(value) {
  return value !== undefined && value !== null && value !== "";
}

function parseNearbyQuery({ lat, lng, radiusM, neighborhood }) {
  const parsedRadiusM = parseRadiusM(radiusM);
  const parsedNeighborhood = parseOptionalNeighborhood(neighborhood);
  const hasLat = hasCoordinate(lat);
  const hasLng = hasCoordinate(lng);

  if (parsedNeighborhood && !hasLat && !hasLng) {
    const origin = resolveNeighborhoodCentroid(parsedNeighborhood);
    if (!origin) {
      throw new AppError(404, "NOT_FOUND", `Unknown neighborhood: ${parsedNeighborhood}`);
    }

    return {
      lat: origin.lat,
      lng: origin.lng,
      radiusM: parsedRadiusM,
      neighborhood: parsedNeighborhood,
      geocoded: true,
    };
  }

  if (!hasLat || !hasLng) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "lat and lng are required unless neighborhood is provided"
    );
  }

  return {
    ...parseLatLng(lat, lng),
    radiusM: parsedRadiusM,
    neighborhood: parsedNeighborhood,
    geocoded: false,
  };
}

function validateBudgetTier(value) {
  if (!BUDGET_TIERS.has(value)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "budgetTier must be one of TIER_1, TIER_2, TIER_3"
    );
  }
}

function validateStringArray(value, fieldName) {
  if (
    !Array.isArray(value)
    || !value.every((item) => typeof item === "string" && item.trim() !== "")
  ) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      `${fieldName} must be an array of non-empty strings`
    );
  }
}

function validateDietaryTags(value) {
  validateStringArray(value, "dietaryTags");
}

function validatePreferredCuisines(value) {
  validateStringArray(value, "preferredCuisines");
}

function validateDiningStyles(value) {
  validateStringArray(value, "diningStyles");
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, "VALIDATION_ERROR", `${fieldName} is required`);
  }
  return value.trim();
}

function parseTransportMode(value) {
  const mode = value ?? DEFAULT_TRANSPORT_MODE;
  if (!TRANSPORT_MODES.has(mode)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "mode must be one of walking, driving, transit, cycling"
    );
  }
  return mode;
}

function parseBodyLatLng(userLat, userLng) {
  if (userLat === undefined || userLng === undefined) {
    throw new AppError(400, "VALIDATION_ERROR", "userLat and userLng are required");
  }
  return parseLatLng(userLat, userLng);
}

function validateCampaignBody(body) {
  const { tableQuota, discountPercent, ttlMinutes } = body ?? {};

  if (!Number.isInteger(tableQuota) || tableQuota <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "tableQuota must be a positive integer");
  }

  if (!Number.isInteger(discountPercent) || discountPercent < 10 || discountPercent > 50) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "discountPercent must be an integer between 10 and 50"
    );
  }

  let resolvedTtlMinutes = DEFAULT_FLASH_DEAL_TTL_MINUTES;
  if (ttlMinutes !== undefined && ttlMinutes !== null) {
    if (
      !Number.isInteger(ttlMinutes)
      || ttlMinutes < MIN_FLASH_DEAL_TTL_MINUTES
      || ttlMinutes > MAX_FLASH_DEAL_TTL_MINUTES
    ) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        `ttlMinutes must be an integer between ${MIN_FLASH_DEAL_TTL_MINUTES} and ${MAX_FLASH_DEAL_TTL_MINUTES}`
      );
    }
    resolvedTtlMinutes = ttlMinutes;
  }

  return {
    tableQuota,
    discountPercent,
    ttlMinutes: resolvedTtlMinutes,
    ttlSeconds: resolvedTtlMinutes * 60,
  };
}

function parseOptionalBoolean(value, fieldName) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new AppError(400, "VALIDATION_ERROR", `${fieldName} must be a boolean`);
  }
  return value;
}

function validateCreateRestaurantBody(body) {
  const payload = body ?? {};
  const name = requireNonEmptyString(payload.name, "name");
  const addressLine = requireNonEmptyString(payload.addressLine, "addressLine");
  const phone = requireNonEmptyString(payload.phone, "phone");
  const cuisine = requireNonEmptyString(payload.cuisine, "cuisine");
  const { lat, lng } = parseLatLng(payload.latitude, payload.longitude);

  let neighborhood = null;
  if (payload.neighborhood !== undefined && payload.neighborhood !== null) {
    if (typeof payload.neighborhood !== "string") {
      throw new AppError(400, "VALIDATION_ERROR", "neighborhood must be a string");
    }
    neighborhood = payload.neighborhood.trim() || null;
  }

  const result = {
    name,
    addressLine,
    phone,
    cuisine,
    latitude: lat,
    longitude: lng,
    neighborhood,
    isWheelchairAccessible: parseOptionalBoolean(
      payload.isWheelchairAccessible,
      "isWheelchairAccessible"
    ) ?? false,
    sensoryFriendly: parseOptionalBoolean(payload.sensoryFriendly, "sensoryFriendly") ?? false,
    opensAt: parseLocalTime(payload.opensAt, "opensAt") ?? DEFAULT_OPENS_AT,
    closesAt: parseLocalTime(payload.closesAt, "closesAt") ?? DEFAULT_CLOSES_AT,
  };

  if (result.opensAt >= result.closesAt) {
    throw new AppError(400, "VALIDATION_ERROR", "closesAt must be after opensAt");
  }

  return result;
}

function validateRestaurantSettingsBody(body) {
  const payload = body ?? {};
  const isWheelchairAccessible = parseOptionalBoolean(
    payload.isWheelchairAccessible,
    "isWheelchairAccessible"
  );
  const sensoryFriendly = parseOptionalBoolean(payload.sensoryFriendly, "sensoryFriendly");

  if (isWheelchairAccessible === undefined && sensoryFriendly === undefined) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "At least one of isWheelchairAccessible or sensoryFriendly is required"
    );
  }

  const updates = {};
  if (isWheelchairAccessible !== undefined) {
    updates.is_wheelchair_accessible = isWheelchairAccessible;
  }
  if (sensoryFriendly !== undefined) {
    updates.sensory_friendly = sensoryFriendly;
  }

  return updates;
}

const BOOKING_STATUSES = new Set([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

function parseBookingStatus(value) {
  if (typeof value !== "string" || !BOOKING_STATUSES.has(value)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "status must be one of pending, confirmed, cancelled, completed, no_show"
    );
  }
  return value;
}

module.exports = {
  BUDGET_TIERS,
  TRANSPORT_MODES,
  DEFAULT_RADIUS_M,
  DEFAULT_TRANSPORT_MODE,
  parseLatLng,
  parseRadiusM,
  parseOptionalNeighborhood,
  parseNearbyQuery,
  parseTransportMode,
  parseBodyLatLng,
  validateCampaignBody,
  validateCreateRestaurantBody,
  validateRestaurantSettingsBody,
  validateBudgetTier,
  validateDietaryTags,
  validatePreferredCuisines,
  validateDiningStyles,
  requireNonEmptyString,
  parsePartySize,
  parseBookingStatus,
};
