const { AppError } = require("../errors");

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

function validateBudgetTier(value) {
  if (!BUDGET_TIERS.has(value)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "budgetTier must be one of TIER_1, TIER_2, TIER_3"
    );
  }
}

function validateDietaryTags(value) {
  if (!Array.isArray(value) || !value.every((tag) => typeof tag === "string")) {
    throw new AppError(400, "VALIDATION_ERROR", "dietaryTags must be an array of strings");
  }
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

module.exports = {
  BUDGET_TIERS,
  TRANSPORT_MODES,
  DEFAULT_RADIUS_M,
  DEFAULT_TRANSPORT_MODE,
  parseLatLng,
  parseRadiusM,
  parseTransportMode,
  parseBodyLatLng,
  validateBudgetTier,
  validateDietaryTags,
  requireNonEmptyString,
};
