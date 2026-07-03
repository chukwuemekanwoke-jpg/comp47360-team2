import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  UserProfile, RestaurantSummary, RestaurantDetail, EtaResult,
  Booking, OfferInboxItem, Campaign, TransportMode, BudgetTier
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
  tagTypes: ['User', 'Restaurants', 'Bookings', 'Offers', 'Campaigns', 'Floorplan', 'Analytics'],
  
  endpoints: (builder) => ({
    // --- API Contract 4.1 Health ---
    getHealth: builder.query<{ status: string }, void>({
      query: (): { url: string} => {
        return { url: '/status'};
      },
    }),

    // ---  API Contract 4.2 Users & Onboarding ---
    createUser: builder.mutation<UserProfile, { userId: string; displayName: string }>({
      query: ({userId , ...body}) => ({
        url: '/users',
        method: 'POST',
        body,
        headers: {
          'X-User-Id': userId
        }
      }),
      invalidatesTags: ['User'],
    }),

    updatePreferences: builder.mutation<UserProfile, { userId:string, budgetTier: BudgetTier; dietaryTags: string[]; lastLat?: number; lastLng?: number }>({
      query: ({userId, ...body}) => ({
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
      providesTags: (_result, _error, id: string) => [{ type: 'Restaurants', id }],
    }),

    getRestaurantEta: builder.query<EtaResult, { restaurantId: string; lat: number; lng: number; mode?: TransportMode }>({
      query: ({ restaurantId, lat, lng, mode = 'walking' }: { restaurantId: string; lat: number; lng: number; mode?: TransportMode }) => ({
        url: `/restaurants/${restaurantId}/eta`,
        params: { lat, lng, mode },
      }),
      keepUnusedDataFor: 300, 
    }),

    // --- API Contract 4.5 Bookings ---
    createBooking: builder.mutation<Booking, { userId:string; restaurantId: string; transportMode: TransportMode; userLat: number; userLng: number; offerId: string | null }>({
      query: ({ userId, ...body }) => ({
        url: '/bookings',
        method: 'POST',
        body,
        headers: {
          'X-User-Id': userId,
        },
      }),
      invalidatesTags: ['Bookings', 'Restaurants', 'Offers'],
    }),

    getMyBookings: builder.query<{ bookings: Booking[] }, string>({
      query: (userId: string) => ({
        url: '/users/me/bookings',
        method: 'GET',
        headers: {
          'X-User-Id': userId,
        },
      }),
      providesTags: ['Bookings'],
    }),

    cancelBooking: builder.mutation<Booking, string>({
      query: (bookingId: string) => ({
        url: `/bookings/${bookingId}/cancel`,
        method: 'POST',
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
      query: (restaurantId: string) => `/restaurants/${restaurantId}/campaigns/active`,
      providesTags: ['Campaigns'],
    }),

    // --- NEW: API Contract 4.8 Merchant Web Dashboard ---
    
    // ==========================================
    // !!! MOCK DATA START (FOR DEMO PURPOSES) !!!
    // ==========================================
    getLiveBookings: builder.query<{ bookings: Booking[] }, string>({
      // COMMENTED OUT FOR DEMO: query: (restaurantId: string) => `/restaurants/${restaurantId}/bookings`,
      queryFn: () => {
        return {
          data: {
            bookings: [
              { id: 'b1', guestName: 'Alice', time: '19:00', partySize: 2, status: 'confirmed' },
              { id: 'b2', guestName: 'Bob', time: '20:30', partySize: 4, status: 'pending' }
            ]
          }
        };
      },
      providesTags: ['Bookings'],
    }),
    // ==========================================
    // !!! MOCK DATA END !!!
    // ==========================================

    updateRestaurantSettings: builder.mutation<any, { restaurantId: string; settings: any }>({
      query: ({ restaurantId, settings }) => ({
        url: `/restaurants/${restaurantId}/settings`,
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Restaurants'],
    }),

    // ==========================================
    // !!! MOCK DATA START (FOR DEMO PURPOSES) !!!
    // ==========================================
    getAnalytics: builder.query<any, string>({
      // COMMENTED OUT FOR DEMO: query: (restaurantId: string) => `/restaurants/${restaurantId}/analytics`,
      queryFn: () => {
        return {
          data: {
            totalRevenue: 4500,
            activeCampaigns: 2,
            occupancyRate: 85,
            popularTimes: ['18:00', '19:00', '20:00']
          }
        };
      },
      providesTags: ['Analytics'],
    }),
    // ==========================================
    // !!! MOCK DATA END !!!
    // ==========================================

    // ==========================================
    // !!! MOCK DATA START (FOR DEMO PURPOSES) !!!
    // ==========================================
    getFloorPlan: builder.query<any, string>({
      // COMMENTED OUT FOR DEMO: query: (restaurantId: string) => `/restaurants/${restaurantId}/floorplan`,
      queryFn: () => {
        return {
          data: {
            // Updated to use defaultLabel/customLabel to match RoomConfigPanel.jsx
            rooms: [
              { id: 'r1', defaultLabel: 'Room 1', customLabel: 'Main Dining', tableCount: 3 },
              { id: 'r2', defaultLabel: 'Room 2', customLabel: 'Patio', tableCount: 2 }
            ],
            // Un-nested tables into a separate top-level array to match MerchantDashboard.jsx
            tables: [
              { id: 't1', label: 'Table-1', type: 'Square', capacity: 4, status: 'Occupied', room: 'Main Dining' },
              { id: 't2', label: 'Table-2', type: 'Round', capacity: 2, status: 'Available', room: 'Main Dining' },
              { id: 't3', label: 'Table-3', type: 'Square', capacity: 6, status: 'Available', room: 'Main Dining' },
              { id: 't4', label: 'Table-4', type: 'Square', capacity: 4, status: 'Available', room: 'Patio' },
              { id: 't5', label: 'Table-5', type: 'Round', capacity: 2, status: 'Occupied', room: 'Patio' }
            ]
          }
        };
      },
      providesTags: ['Floorplan'],
    }),
    // ==========================================
    // !!! MOCK DATA END !!!
    // ==========================================

    // ==========================================
    // !!! MOCK MUTATIONS START (FOR DEMO PURPOSES) !!!
    // ==========================================
    
    createRoom: builder.mutation<any, { restaurantId: string; roomData: any }>({
      // COMMENTED OUT FOR DEMO: query: ({ restaurantId, roomData }) => ({ url: `/restaurants/${restaurantId}/rooms`, method: 'POST', body: roomData }),
      queryFn: (args) => {
        // Simulate network delay and return the injected data with a fake ID
        return { data: { id: `mock-room-${Date.now()}`, ...args.roomData } };
      }
    }),

    updateRoom: builder.mutation<any, { roomId: string; roomData: any }>({
      // COMMENTED OUT FOR DEMO: query: ({ roomId, roomData }) => ({ url: `/rooms/${roomId}`, method: 'PUT', body: roomData }),
      queryFn: (args) => ({ data: args.roomData })
    }),

    deleteRoom: builder.mutation<any, string>({
      // COMMENTED OUT FOR DEMO: query: (roomId: string) => ({ url: `/rooms/${roomId}`, method: 'DELETE' }),
      queryFn: () => ({ data: { success: true } })
    }),

    createTable: builder.mutation<any, { restaurantId: string; tableData: any }>({
      // COMMENTED OUT FOR DEMO: query: ({ restaurantId, tableData }) => ({ url: `/restaurants/${restaurantId}/tables`, method: 'POST', body: tableData }),
      queryFn: (args) => {
        return { data: { id: `mock-table-${Date.now()}`, ...args.tableData } };
      }
    }),

    updateTable: builder.mutation<any, { tableId: string; tableData: any }>({
      // COMMENTED OUT FOR DEMO: query: ({ tableId, tableData }) => ({ url: `/tables/${tableId}`, method: 'PUT', body: tableData }),
      queryFn: (args) => ({ data: args.tableData })
    }),

    deleteTable: builder.mutation<any, string>({
      // COMMENTED OUT FOR DEMO: query: (tableId: string) => ({ url: `/tables/${tableId}`, method: 'DELETE' }),
      queryFn: () => ({ data: { success: true } })
    }),

    // ==========================================
    // !!! MOCK MUTATIONS END !!!
    // ==========================================
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
  
  // --- NEW: Merchant Web Dashboard Hooks ---
  useGetLiveBookingsQuery,
  useUpdateRestaurantSettingsMutation,
  useGetAnalyticsQuery,
  useGetFloorPlanQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
} = tableApi;