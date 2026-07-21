const { AppError } = require("../errors");

const REVPASH_WINDOWS = new Set(["today", "week", "month"]);
const DEFAULT_PARTY_SIZE = 2;
const DEFAULT_DURATION_MINUTES = 90;
const DEFAULT_OPENS_AT = "11:00";
const DEFAULT_CLOSES_AT = "22:00";

function cuisineBenchmarkCheck(cuisine) {
  switch ((cuisine || "").toLowerCase()) {
    case "french":
      return 85;
    case "italian":
      return 68;
    case "japanese":
      return 55;
    case "thai":
      return 42;
    case "cafe":
      return 32;
    case "american":
      return 48;
    default:
      return 45;
  }
}

function neighborhoodPremium(neighborhood) {
  if (["Midtown", "Midtown East", "Theater District", "Upper East Side"].includes(neighborhood)) {
    return 1.1;
  }
  if (["Hell's Kitchen", "Murray Hill", "Koreatown"].includes(neighborhood)) {
    return 1.05;
  }
  return 1;
}

function benchmarkAvgCheck(cuisine, neighborhood = null) {
  const base = cuisineBenchmarkCheck(cuisine);
  const premium = neighborhood ? neighborhoodPremium(neighborhood) : 1;
  return Math.round(base * premium * 100) / 100;
}

function computeCheckAmount(partySize, avgCheckPerCover, discountPercent = 0) {
  const multiplier = 1 - Number(discountPercent) / 100;
  return Math.round(partySize * Number(avgCheckPerCover) * multiplier * 100) / 100;
}

function parsePartySize(value) {
  if (value === undefined || value === null) {
    return DEFAULT_PARTY_SIZE;
  }

  const partySize = Number(value);
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
    throw new AppError(400, "VALIDATION_ERROR", "partySize must be an integer between 1 and 20");
  }

  return partySize;
}

function parseLocalTime(value, fieldName) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(400, "VALIDATION_ERROR", `${fieldName} must be a string time (HH:MM)`);
  }

  const trimmed = value.trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(trimmed)) {
    throw new AppError(400, "VALIDATION_ERROR", `${fieldName} must use HH:MM or HH:MM:SS format`);
  }

  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function parseRevpashWindow(value) {
  const window = (value ?? "today").toString().toLowerCase();
  if (!REVPASH_WINDOWS.has(window)) {
    throw new AppError(400, "VALIDATION_ERROR", "window must be one of: today, week, month");
  }
  return window;
}

function isOffPeakLocalHour(hour) {
  const normalized = Number(hour);
  if (!Number.isFinite(normalized)) {
    return false;
  }

  // Typical lull windows: late morning, mid-afternoon, or after 9pm local.
  return (normalized >= 14 && normalized < 17) || normalized >= 21 || normalized < 11;
}

function computeRevpashLiftPercent(organicRevpash, dealRevpash) {
  const organic = Number(organicRevpash);
  const deal = Number(dealRevpash);

  if (organic <= 0) {
    return deal > 0 ? 100 : 0;
  }

  return Math.round(((deal - organic) / organic) * 10000) / 100;
}

function computeRevpash(revenue, seatHours) {
  const hours = Number(seatHours);
  if (!Number.isFinite(hours) || hours <= 0) {
    return 0;
  }

  return Math.round((Number(revenue) / hours) * 100) / 100;
}

module.exports = {
  REVPASH_WINDOWS,
  DEFAULT_PARTY_SIZE,
  DEFAULT_DURATION_MINUTES,
  DEFAULT_OPENS_AT,
  DEFAULT_CLOSES_AT,
  benchmarkAvgCheck,
  computeCheckAmount,
  parsePartySize,
  parseLocalTime,
  parseRevpashWindow,
  isOffPeakLocalHour,
  computeRevpashLiftPercent,
  computeRevpash,
};
