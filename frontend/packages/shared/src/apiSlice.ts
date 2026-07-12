import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  UserProfile, RestaurantSummary, RestaurantDetail, EtaResult,
  Booking, OfferInboxItem, Campaign, TransportMode, BudgetTier, BookingStatus,
  RevpashSummary, RevpashWindow, AuthSession, ManagerOfferItem, CampaignRevpashLift,
  PasswordResetResult
} from './types';

// --- CROSS-PLATFORM URL RESOLVER ---
const getBaseUrl = () => {
  // 1. VITE (Web Dashboard) 
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  }

  // 2. EXPO / NODE (Mobile App)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  }

  // 3. DEFAULT FALLBACKS
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return 'http://localhost:3001/api/v1';
  }

  return 'http://localhost:3001/api/v1';
};

export const tableApi = createApi({
  reducerPath: 'tableApi',
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as { auth?: { userId: string | null } };
      let userId = state.auth?.userId;
      
      // --- HYBRID WEB/MOBILE AUTH LINK PERSISTENCE ---
      // FIXED: Now matching AuthContext.js exact key
      if (!userId && typeof window !== 'undefined') {
        userId = localStorage.getItem('table_user_id'); 
      }
      
      if (userId) {
        headers.set('X-User-Id', userId);
      }

      // FIXED: Now matching AuthContext.js exact key
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('table_merchant_token');
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }
      
      return headers;
    },
  }),
  tagTypes: ['User', 'Restaurants', 'Bookings', 'Offers', 'Campaigns'],
  
  endpoints: (builder) => ({
    // --- API Contract 4.1 Health ---
    getHealth: builder.query<{ status: string }, void>({
      query: () => ({ url: '/status' }),
    }),

    // ---  API Contract 4.2 Users & Onboarding ---
    // POST /users has no auth requirement — user doesn't exist yet
    createUser: builder.mutation<UserProfile, { displayName: string }>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // Real JWT merchant sign-up — POST /auth/register, no auth header needed.
    register: builder.mutation<AuthSession, { email: string; password: string; displayName?: string }>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // Real JWT sign-in — POST /auth/login, no auth header needed.
    login: builder.mutation<AuthSession, { email: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    updatePreferences: builder.mutation<UserProfile, { userId: string; budgetTier: BudgetTier; dietaryTags: string[]; lastLat?: number; lastLng?: number }>({
      query: ({ userId, ...body }: { userId: string; budgetTier: BudgetTier; dietaryTags: string[]; lastLat?: number; lastLng?: number }) => ({
        url: '/users/me/preferences',
        method: 'PATCH',
        body,
        headers: {
          'X-User-Id': userId
        }
      }),
      invalidatesTags: ['User', 'Restaurants'],
    }),

    getProfile: builder.query<UserProfile, string>({
      query: (userId: string) => ({
        url: '/users/me',
        method: 'GET',
        headers: {
          'X-User-Id': userId
        }
      }),
      providesTags: ['User'],
    }),

    // --- API Contract 4.3 Discovery ---
    getNearbyRestaurants: builder.query<{ origin: { lat: number; lng: number }; radiusM: number; restaurants: RestaurantSummary[] }, { lat: number; lng: number; radiusM?: number; neighborhood?: string }>({
      query: ({ lat, lng, radiusM = 1500, neighborhood }: { lat: number; lng: number; radiusM?: number; neighborhood?: string }) => ({
        url: '/restaurants/nearby',
        params: neighborhood ? { lat, lng, radiusM, neighborhood } : { lat, lng, radiusM },
      }),
      providesTags: ['Restaurants'],
    }),

    // --- API Contract 4.4 Restaurant Detail & ETA ---
    getRestaurantDetail: builder.query<RestaurantDetail, string>({
      query: (restaurantId: string) => `/restaurants/${restaurantId}`,
      providesTags: (_result: RestaurantDetail | undefined, _error: unknown, id: string) => [{ type: 'Restaurants', id }],
    }),

    getRestaurantEta: builder.query<EtaResult, { restaurantId: string; lat: number; lng: number; mode?: TransportMode }>({
      query: ({ restaurantId, lat, lng, mode = 'walking' }: { restaurantId: string; lat: number; lng: number; mode?: TransportMode }) => ({
        url: `/restaurants/${restaurantId}/eta`,
        params: { lat, lng, mode },
      }),
      keepUnusedDataFor: 300, 
    }),

    // --- API Contract 4.5 Bookings ---
    createBooking: builder.mutation<Booking, { userId: string; restaurantId: string; transportMode: TransportMode; userLat: number; userLng: number; offerId: string | null }>({
      query: ({ userId, ...body }: { userId: string; restaurantId: string; transportMode: TransportMode; userLat: number; userLng: number; offerId: string | null }) => ({
        url: '/bookings',
        method: 'POST',
        body,
        headers: {
          'X-User-Id': userId,
        },
      }),
      invalidatesTags: ['Bookings', 'Restaurants', 'Offers'],
    }),

    getMyBookings: builder.query<{ bookings: Booking[] }, { userId: string }>({
      query: ({ userId }: { userId: string }) => ({
        url: '/users/me/bookings',
        method: 'GET',
        headers: { 'X-User-Id': userId },
      }),
      providesTags: ['Bookings'],
    }),

    cancelBooking: builder.mutation<Booking, { bookingId: string; userId: string }>({
      query: ({ bookingId, userId }) => ({
        url: `/bookings/${bookingId}/cancel`,
        method: 'POST',
        headers: { 'X-User-Id': userId },
      }),
      invalidatesTags: ['Bookings', 'Restaurants', 'Offers'],
    }),

    // --- API Contract 4.6 Offers Inbox ---
    getOffersInbox: builder.query<{ offers: OfferInboxItem[] }, { status?: 'pending' } | void>({
      query: (params: { status?: 'pending' } | void) => ({
        url: '/users/me/offers',
        params: params?.status ? { status: params.status } : undefined,
      }),
      providesTags: ['Offers'],
    }),

    acceptOffer: builder.mutation<{ offerId: string; status: 'accepted'; booking: Booking }, string>({
      query: (offerId: string) => ({
        url: `/offers/${offerId}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['Offers', 'Bookings', 'Restaurants'],
    }),

    // --- API Contract 4.7 B-Side Campaigns ---
    createCampaign: builder.mutation<Campaign, { restaurantId: string; tableQuota: number; discountPercent: number }>({
      query: ({ restaurantId, ...body }: { restaurantId: string; tableQuota: number; discountPercent: number }) => ({
        url: `/restaurants/${restaurantId}/campaigns`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Campaigns'],
    }),

    getActiveCampaign: builder.query<{ campaign: Campaign | null }, string>({
      query: (restaurantId: string) => `/restaurants/${restaurantId}/campaigns/active`,
      providesTags: ['Campaigns'],
    }),

    // Pending backend: GET /restaurants/:id/campaigns/:campaignId/offers
    getCampaignOffers: builder.query<{ offers: ManagerOfferItem[] }, { restaurantId: string; campaignId: string }>({
      query: ({ restaurantId, campaignId }) => `/restaurants/${restaurantId}/campaigns/${campaignId}/offers`,
      providesTags: ['Offers'],
    }),

    getCampaignHistory: builder.query<{ campaigns: Campaign[] }, string>({
      query: (restaurantId: string) => `/restaurants/${restaurantId}/campaigns`,
      providesTags: ['Campaigns'],
    }),

    cancelCampaign: builder.mutation<Campaign, { restaurantId: string; campaignId: string }>({
      query: ({ restaurantId, campaignId }) => ({
        url: `/restaurants/${restaurantId}/campaigns/${campaignId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Campaigns'],
    }),

    createRestaurant: builder.mutation<
      RestaurantDetail,
      {
        name: string;
        addressLine: string;
        phone: string;
        latitude: number;
        longitude: number;
        cuisine: string;
        neighborhood?: string;
        isWheelchairAccessible?: boolean;
        sensoryFriendly?: boolean;
      }
    >({
      query: (body) => ({
        url: '/restaurants',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Restaurants'],
    }),

    updateRestaurantSettings: builder.mutation<
      RestaurantDetail,
      { restaurantId: string; isWheelchairAccessible?: boolean; sensoryFriendly?: boolean }
    >({
      query: ({ restaurantId, ...body }) => ({
        url: `/restaurants/${restaurantId}/settings`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Restaurants', id: arg.restaurantId }],
    }),

    getRestaurantBookings: builder.query<{ bookings: Booking[] }, string>({
      query: (restaurantId: string) => `/restaurants/${restaurantId}/bookings`,
      providesTags: ['Bookings'],
    }),

    // Pending backend: PATCH /bookings/:id/status
    updateBookingStatus: builder.mutation<Booking, { bookingId: string; status: BookingStatus }>({
      query: ({ bookingId, status }) => ({
        url: `/bookings/${bookingId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Bookings'],
    }),

    // Pending backend: GET /restaurants/:id/revpash
    getRevpash: builder.query<RevpashSummary, { restaurantId: string; window?: RevpashWindow }>({
      query: ({ restaurantId, window = 'today' }) => ({
        url: `/restaurants/${restaurantId}/revpash`,
        params: { window },
      }),
      providesTags: (_result, _error, arg) => [{ type: 'Restaurants', id: arg.restaurantId }],
    }),

    // Needs GET /restaurants/:id/campaigns/:campaignId/revpash-lift on the
    // backend (see handoff spec) — Phase 2 of the RevPASH rollout, per-campaign
    // organic-vs-deal RevPASH comparison. Blocked on TABL-118 (RISK_REGISTER
    // R-09): no RevPASH schema/route exists anywhere yet, so this always 404s.
    getCampaignRevpashLift: builder.query<CampaignRevpashLift, { restaurantId: string; campaignId: string }>({
      query: ({ restaurantId, campaignId }) => `/restaurants/${restaurantId}/campaigns/${campaignId}/revpash-lift`,
      providesTags: (_result, _error, arg) => [{ type: 'Campaigns', id: arg.campaignId }],
    }),

    // Needs POST /auth/forgot-password on the backend (see handoff spec) —
    // generates a reset token and emails a reset link. No reset_token column,
    // email-sending infra, or route exists anywhere yet.
    forgotPassword: builder.mutation<PasswordResetResult, { email: string }>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    // Needs POST /auth/reset-password on the backend (see handoff spec) —
    // validates the token from the emailed link and sets a new password.
    resetPassword: builder.mutation<PasswordResetResult, { token: string; newPassword: string }>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),

  }),
});

export const {
  useGetHealthQuery,
  useCreateUserMutation,
  useRegisterMutation,
  useLoginMutation,
  useUpdatePreferencesMutation,
  useGetProfileQuery,
  useGetNearbyRestaurantsQuery,
  useGetRestaurantDetailQuery,
  useGetRestaurantEtaQuery,
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useCancelBookingMutation,
  useGetOffersInboxQuery,
  useAcceptOfferMutation,
  useCreateCampaignMutation,
  useGetActiveCampaignQuery,
  useGetCampaignOffersQuery,
  useGetCampaignHistoryQuery,
  useCancelCampaignMutation,
  useUpdateRestaurantSettingsMutation,
  useGetRestaurantBookingsQuery,
  useUpdateBookingStatusMutation,
  useGetRevpashQuery,
  useCreateRestaurantMutation,
  useGetCampaignRevpashLiftQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = tableApi;