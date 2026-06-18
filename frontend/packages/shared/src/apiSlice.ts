import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  UserProfile, RestaurantSummary, RestaurantDetail, EtaResult,
  Booking, OfferInboxItem, Campaign, TransportMode, BudgetTier
} from './types';

export const tableApi = createApi({
  reducerPath: 'tableApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3001/api/v1', // Fallback to Local
    prepareHeaders: (headers, { getState }) => {
      // Access apps auth state dynamically. Replace with actual slice location if needed.
      const state = getState() as { auth?: { userId: string | null } };
      const userId = state.auth?.userId;
      
      if (userId) {
        headers.set('X-User-Id', userId);
      }
      return headers;
    },
  }),
  // Tags track cache relationships so mutations trigger automatic data updates
  tagTypes: ['User', 'Restaurants', 'Bookings', 'Offers', 'Campaigns'],
  
  endpoints: (builder) => ({
    // --- API Contract 4.1 Health ---
    getHealth: builder.query<{ status: string }, void>({
      query: () => ({ url: '/health', baseUrl: 'http://localhost:3001' }), // Ignores prefix context
    }),

    // ---  API Contract 4.2 Users & Onboarding ---
    createUser: builder.mutation<UserProfile, { displayName: string }>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    updatePreferences: builder.mutation<UserProfile, { budgetTier: BudgetTier; dietaryTags: string[]; lastLat?: number; lastLng?: number }>({
      query: (body) => ({
        url: '/users/me/preferences',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User', 'Restaurants'], // Forces map refresh when preferences change
    }),

    getProfile: builder.query<UserProfile, void>({
      query: () => '/users/me',
      providesTags: ['User'], // Provides user tag (State updated when invalidated: updatePreferences [invalidate] --> getProfile [provides])
    }),

    // --- API Contract 4.3 Discovery ---
    getNearbyRestaurants: builder.query<{ origin: { lat: number; lng: number }; radiusM: number; restaurants: RestaurantSummary[] }, { lat: number; lng: number; radiusM?: number; neighborhood?: string }>({
      query: ({ lat, lng, radiusM = 1500, neighborhood }) => ({
        url: '/restaurants/nearby',
        params: neighborhood ? { lat, lng, radiusM, neighborhood } : { lat, lng, radiusM },
      }),
      providesTags: ['Restaurants'],
    }),

    // --- API Contract 4.4 Restaurant Detail & ETA ---
    getRestaurantDetail: builder.query<RestaurantDetail, string>({
      query: (restaurantId) => `/restaurants/${restaurantId}`,
      providesTags: (_result, _error, id) => [{ type: 'Restaurants', id }],
    }),

    getRestaurantEta: builder.query<EtaResult, { restaurantId: string; lat: number; lng: number; mode?: TransportMode }>({
      query: ({ restaurantId, lat, lng, mode = 'walking' }) => ({
        url: `/restaurants/${restaurantId}/eta`,
        params: { lat, lng, mode },
      }),
      // Caches for exactly 5 minutes as per Contract Section 4.4 implementation notes
      keepUnusedDataFor: 300, 
    }),

    // --- API Contract 4.5 Bookings ---
    createBooking: builder.mutation<Booking, { restaurantId: string; transportMode: TransportMode; userLat: number; userLng: number; offerId: string | null }>({
      query: (body) => ({
        url: '/bookings',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Bookings', 'Restaurants', 'Offers'],
    }),

    getMyBookings: builder.query<{ bookings: Booking[] }, void>({
      query: () => '/users/me/bookings',
      providesTags: ['Bookings'],
    }),

    cancelBooking: builder.mutation<Booking, string>({
      query: (bookingId) => ({
        url: `/bookings/${bookingId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Bookings', 'Restaurants', 'Offers'],
    }),

    // --- API Contract 4.6 Offers Inbox ---
    getOffersInbox: builder.query<{ offers: OfferInboxItem[] }, { status?: 'pending' } | void>({
      query: (params) => ({
        url: '/users/me/offers',
        params: params?.status ? { status: params.status } : undefined,
      }),
      providesTags: ['Offers'],
    }),

    acceptOffer: builder.mutation<{ offerId: string; status: 'accepted'; booking: Booking }, string>({
      query: (offerId) => ({
        url: `/offers/${offerId}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['Offers', 'Bookings', 'Restaurants'],
    }),

    // --- API Contract 4.7 B-Side Campaigns ---
    createCampaign: builder.mutation<Campaign, { restaurantId: string; tableQuota: number; discountPercent: number }>({
      query: ({ restaurantId, ...body }) => ({
        url: `/restaurants/${restaurantId}/campaigns`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Campaigns'],
    }),

    getRestaurantCampaigns: builder.query<{ campaigns: Campaign[] }, string>({
      query: (restaurantId) => `/restaurants/${restaurantId}/campaigns`,
      providesTags: ['Campaigns'],
    }),
  }),
});

// Auto-generated runtime React Hooks
export const {
  useGetHealthQuery,
  useCreateUserMutation,
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
  useGetRestaurantCampaignsQuery,
} = tableApi;