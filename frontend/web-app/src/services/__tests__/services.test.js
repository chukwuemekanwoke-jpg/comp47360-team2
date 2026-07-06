import { MerchantService } from '../MerchantService';
import { OnboardingService } from '../OnboardingService';
import MapService from '../MapService';

function jsonResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('MerchantService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches live bookings with the merchant user header and normalizes the bookings array', async () => {
    fetch.mockResolvedValueOnce(
      jsonResponse({
        bookings: [{ id: 'booking-1', guestName: 'Ava Chen', partySize: 2 }],
      })
    );

    const bookings = await MerchantService.getLiveBookings('restaurant-1', 'manager-1');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/v1/restaurants/restaurant-1/bookings',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'manager-1',
        },
      }
    );
    expect(bookings).toEqual([{ id: 'booking-1', guestName: 'Ava Chen', partySize: 2 }]);
  });

  it('returns null for an unavailable active campaign instead of throwing', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}, false, 404));

    await expect(MerchantService.getActiveCampaign('restaurant-1')).resolves.toBeNull();
  });

  it('serializes flash campaign broadcasts for the merchant campaigns endpoint', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ id: 'campaign-1', discountPercent: 25 }));

    const campaign = await MerchantService.broadcastFlashCampaign(
      'restaurant-1',
      'nearby-diners',
      25
    );

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/v1/restaurants/restaurant-1/campaigns/flash',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAudienceId: 'nearby-diners', discountPercent: 25 }),
      }
    );
    expect(campaign).toEqual({ id: 'campaign-1', discountPercent: 25 });
  });
});

describe('OnboardingService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps restaurant registration form fields to the backend auth payload', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockResolvedValueOnce(
      jsonResponse({
        token: 'jwt-token',
        userId: 'manager-1',
        restaurantId: 'restaurant-1',
      })
    );

    const result = await OnboardingService.registerRestaurant({
      email: 'merchant@table.com',
      password: 'password',
      restaurantName: 'Mercer Room',
      restaurantAddress: '12 Mercer Street',
      cuisineType: 'Omakase',
      lat: 40.73,
      lng: -73.99,
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/v1/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: 'merchant@table.com',
          password: 'password',
          name: 'Mercer Room',
          address_line: '12 Mercer Street',
          cuisine_type: 'Omakase',
          latitude: 40.73,
          longitude: -73.99,
        }),
      })
    );
    expect(result).toEqual({
      token: 'jwt-token',
      userId: 'manager-1',
      restaurantId: 'restaurant-1',
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('persists restaurant profile setup with manager auth and backend field names', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await expect(
      OnboardingService.saveRestaurantProfile({
        restaurantId: 'restaurant-1',
        userId: 'manager-1',
        rooms: [{ id: 1, customLabel: 'Main Dining' }],
        cuisines: ['Omakase'],
        accessibility: { wheelchair: true, sensory: false },
        allergens: { nuts: true },
      })
    ).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/v1/restaurants/restaurant-1/profile',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-User-Id': 'manager-1',
        },
        body: JSON.stringify({
          rooms: [{ id: 1, customLabel: 'Main Dining' }],
          cuisines: ['Omakase'],
          is_wheelchair_accessible: true,
          sensory_friendly: false,
          allergens: { nuts: true },
        }),
      })
    );
  });
});

describe('MapService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes a map model, tracks markers, clears them, and destroys safely', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const map = MapService.initializeMap('merchant-radar', [-73.99, 40.73], 15);
    const marker = MapService.addRadarMarker(map, {
      id: 'guest-101',
      coordinates: [-73.9845, 40.7585],
      title: 'Active diner',
    });

    expect(map).toMatchObject({
      containerId: 'merchant-radar',
      center: [-73.99, 40.73],
      zoom: 15,
      destroyed: false,
    });
    expect(marker).toEqual({
      id: 'guest-101',
      coordinates: [-73.9845, 40.7585],
      title: 'Active diner',
    });
    expect(map.markers).toHaveLength(1);

    MapService.clearAllMarkers(map);
    expect(map.markers).toEqual([]);

    MapService.destroyMapInstance(map);
    expect(map.destroyed).toBe(true);
    expect(MapService.addRadarMarker(map, { title: 'Ignored after destroy' })).toBeNull();
  });

  it('rejects initialization without a target container id', () => {
    expect(() => MapService.initializeMap()).toThrow(
      'Map initialization container target element ID is required.'
    );
  });
});
