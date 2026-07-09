// --- ENUMS --- // Types made up a small number of literal/categorical values
export type BudgetTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type TransportMode = 'walking' | 'driving' | 'transit' | 'cycling';
export type OfferStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type CampaignStatus = 'active' | 'completed' | 'cancelled';
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
  // Not on the restaurants table yet — added when POST /restaurants lands
  // (see pending-backend-handoff memory / handoff spec).
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

// -- mobile specific state -- //
