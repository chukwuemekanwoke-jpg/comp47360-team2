import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCreateRestaurantMutation } from '../../../packages/shared/src/apiSlice.ts';
import { isValidLatitude, isValidLongitude, isValidPhone } from '../utils/validation';
import RestaurantLocationPicker from '../components/RestaurantLocationPicker';

const ACCESSIBILITY_FLAGS = [
  { key: 'isWheelchairAccessible', icon: '♿', label: 'Wheelchair Accessible' },
  { key: 'sensoryFriendly', icon: '🧘', label: 'Sensory Friendly' },
];

export default function RestaurantSetupView() {
  const navigate = useNavigate();
  const { userId, authToken, setSession } = useAuth();
  const [createRestaurant, { isLoading: isSubmitting }] = useCreateRestaurantMutation();

  const [formData, setFormData] = useState({
    name: '',
    addressLine: '',
    phone: '',
    latitude: '',
    longitude: '',
    cuisine: '',
  });
  const [accessibility, setAccessibility] = useState({
    isWheelchairAccessible: false,
    sensoryFriendly: false,
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = ({ latitude, longitude, addressLine }) => {
    setFormData((prev) => ({ ...prev, latitude, longitude, addressLine: addressLine ?? prev.addressLine }));
  };

  const handleToggleAccessibility = (key) => {
    setAccessibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.cuisine.trim()) {
      setError('Restaurant name and cuisine are required.');
      return;
    }

    if (!formData.addressLine.trim()) {
      setError('Search an address or drop a pin on the map to set your location.');
      return;
    }

    if (!formData.phone.trim() || !isValidPhone(formData.phone)) {
      setError('Enter a valid phone number (7-15 digits).');
      return;
    }

    // isValidLatitude/Longitude reject blank input explicitly — Number('')
    // is 0, not NaN, so a plain range check alone would silently accept an
    // empty field as valid coordinates (0, 0).
    if (!isValidLatitude(formData.latitude)) {
      setError('Latitude must be a number between -90 and 90.');
      return;
    }

    if (!isValidLongitude(formData.longitude)) {
      setError('Longitude must be a number between -180 and 180.');
      return;
    }

    try {
      const restaurant = await createRestaurant({
        name: formData.name.trim(),
        addressLine: formData.addressLine.trim(),
        phone: formData.phone.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        cuisine: formData.cuisine.trim(),
        ...accessibility,
      }).unwrap();

      setSession({ userId, token: authToken, restaurantId: restaurant.id });
      navigate('/merchant');
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to create your restaurant.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-table-canvas text-table-text font-sans antialiased pb-24">
      <div className="max-w-2xl mx-auto px-6 pt-12 space-y-8">
        <div>
          <span className="text-xs font-mono font-bold tracking-wider text-table-offer uppercase block">
            Step 2 of 2
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-1">Add Your Restaurant</h1>
          <p className="text-sm text-table-textMuted mt-2">
            This creates the venue you will manage on the dashboard.
          </p>
        </div>

        {error && (
          <div role="alert" className="p-4 bg-table-danger/10 border border-table-danger/20 text-table-danger rounded-xl text-xs font-mono flex items-center gap-2">
            {error}
          </div>
        )}

        {/* noValidate: see LoginView for why — our own validation owns the UX. */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-[11px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5 font-bold">
                Restaurant Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Osteria Example"
                className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-3 text-sm text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-primary transition-colors"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-[11px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5 font-bold">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(212) 555-0100"
                className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-3 text-sm text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-primary transition-colors"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5 font-bold">
                Restaurant Location
              </label>
              <RestaurantLocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                addressLine={formData.addressLine}
                onChange={handleLocationChange}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="cuisine" className="block text-[11px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5 font-bold">
                Cuisine
              </label>
              <input
                id="cuisine"
                type="text"
                name="cuisine"
                value={formData.cuisine}
                onChange={handleInputChange}
                placeholder="Italian, Sushi, French Bistro..."
                className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-3 text-sm text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-primary transition-colors"
                disabled={isSubmitting}
              />
            </div>
          </section>

          <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-table-textMuted">
              Accessibility
            </h2>
            <div className="flex flex-col gap-3">
              {ACCESSIBILITY_FLAGS.map(({ key, icon, label }) => (
                <button
                  key={key}
                  type="button"
                  role="switch"
                  aria-checked={accessibility[key]}
                  onClick={() => handleToggleAccessibility(key)}
                  disabled={isSubmitting}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-mono font-medium transition-colors ${
                    accessibility[key]
                      ? 'bg-table-primary/10 border-table-primary/30 text-table-primary'
                      : 'bg-table-canvas border-table-border text-table-textSubtle'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      accessibility[key] ? 'bg-table-primary' : 'bg-table-interactive'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-table-canvas transition-transform ${
                        accessibility[key] ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-table-primary hover:bg-table-primaryHover text-table-canvas font-black font-mono text-sm rounded-xl transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-table-primary/10"
          >
            {isSubmitting ? 'Creating restaurant...' : 'Create Restaurant & Enter Dashboard'}
          </button>
        </form>

        <div className="text-center">
          <Link to="/" className="text-xs font-mono text-table-textSubtle hover:text-table-text transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
