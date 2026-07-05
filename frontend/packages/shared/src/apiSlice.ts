import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Platform } from 'react-native'; 
import { 
  UserProfile, RestaurantSummary, RestaurantDetail, EtaResult,
  Booking, OfferInboxItem, Campaign, TransportMode, BudgetTier
} from './types';

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window === 'undefined' && typeof Platform !== 'undefined') {
    return Platform.OS === 'android' ? 'http://10.0.2.2:3001/api/v1' : 'http://localhost:3001/api/v1';
  }
  return 'http://localhost:3001/api/v1';
};

export const tableApi = createApi({
  reducerPath: 'tableApi',
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as { auth?: { userId: string | null } };
      const userId = state.auth?.userId;
      
      if (userId) {
        headers.set('X-User-Id', userId);
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

    getProfile: builder.query<UserProfile, {userId: string}>({
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

    getRestaurantCampaigns: builder.query<{ campaigns: Campaign[] }, string>({
      query: (restaurantId: string) => `/restaurants/${restaurantId}/campaigns`,
      providesTags: ['Campaigns'],
    }),
  }),
});

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