// --- ENUMS --- // Types made up a small number of literal/categorical values
export type BudgetTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type TransportMode = 'walking' | 'driving' | 'transit' | 'cycling';
export type OfferStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type CampaignStatus = 'active' | 'completed' | 'cancelled' | 'expired';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

// --- SHARED DOMAIN TYPES ---
export interface ApiError {
  error: {
    code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR';
    message: string;
    details: Record<string, any>;
  };
}

export interface UserProfile {
  id: string;
  displayName: string;
  budgetTier: BudgetTier | null;
  dietaryTags: string[];
  createdAt: string;
  lastLat?: number;
  lastLng?: number;
}

export interface RestaurantSummary {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  neighborhood: string;
  availableTableCount: number;
  busynessScore: number;
  distanceMeters: number;
  isWheelchairAccessible: boolean;
  sensoryFriendly: boolean;
  capacity: number;
  cuisine: string;
}

export interface RestaurantDetail extends RestaurantSummary {
  addressLine: string;
  holdWindowMinutes: number;
  phone?: string;
}

export interface EtaResult {
  restaurantId: string;
  transportMode: TransportMode;
  etaMinutes: number;
  holdWindowMinutes: number;
  canBook: boolean;
  message: string;
}

export interface OfferInboxItem {
  id: string;
  campaignId: string;
  restaurantId: string;
  restaurantName: string;
  status: OfferStatus;
  discountPercent: number;
  expiresAt: string;
  secondsRemaining: number;
  canAccept: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  restaurantId: string;
  offerId: string | null;
  campaignId: string | null;
  status: BookingStatus;
  transportMode: TransportMode;
  etaMinutes: number;
  holdExpiresAt: string;
  confirmedAt: string;
  // Joined for restaurant-facing views (GET /restaurants/:id/bookings) — not
  // present on the consumer-facing GET /users/me/bookings response.
  userDisplayName?: string;
}

export interface Campaign {
  id: string;
  restaurantId: string;
  status: CampaignStatus;
  tableQuota: number;
  tablesClaimed: number;
  discountPercent: number;
  createdAt: string;
  expiresAt?: string | null;
  secondsRemaining?: number | null;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  userId: string;
  restaurantId: string | null;
}

// Manager-facing view of a single offer sent as part of a campaign — same
// underlying `offers` row as OfferInboxItem, but joined to the recipient's
// display name instead of the restaurant name (which the manager already
// knows, since this is scoped to their own restaurant/campaign).
export interface ManagerOfferItem {
  id: string;
  campaignId: string;
  userDisplayName: string;
  status: OfferStatus;
  expiresAt: string;
  secondsRemaining: number;
  acceptedAt: string | null;
}

export type RevpashWindow = 'today' | 'week' | 'month';

export interface RevpashSummary {
  restaurantId: string;
  window: RevpashWindow;
  revenue: number;
  availableSeatHours: number;
  revpash: number;
}

// Per-campaign RevPASH lift comparison — Phase 2 of the RevPASH rollout,
// blocked on TABL-118 (no schema/route exists yet, see RISK_REGISTER R-09).
export interface CampaignRevpashLift {
  campaignId: string;
  organicRevpash: number;
  dealRevpash: number;
  liftPercent: number;
  offPeak: boolean;
}

// Password recovery — no reset_token column, email-sending infra, or routes
// exist anywhere yet (see handoff spec). Both endpoints return this generic
// shape; the backend intentionally gives the same response whether or not
// the email matches an account, to avoid leaking which emails are registered.
export interface PasswordResetResult {
  message: string;
}

// Served at runtime rather than baked into the frontend build, so the key
// (held in GCP Secret Manager) can be rotated without a redeploy and never
// sits in source control or a compiled bundle. It's still visible in the
// browser once used, same as any Maps JS key — the real restriction is the
// HTTP-referrer allowlist configured on the key itself in GCP Console.
export interface MapsConfig {
  apiKey: string;
}

// -- mobile specific state -- //
