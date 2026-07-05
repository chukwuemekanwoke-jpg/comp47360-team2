// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OnboardingService } from '../services/OnboardingService';

const PRESET_CUISINES = [
  'Italian',
  'Sushi',
  'French Bistro',
  'Mexican',
  'American Progressive',
  'Indian Contemporary',
  'Mediterranean',
  'Thai',
  'Japanese Tavern',
  'Steakhouse'
];

const ACCESSIBILITY_OPTIONS = [
  { key: 'stepFreeEntry', label: 'Step Free Entry' },
  { key: 'spaciousRestroom', label: 'Spacious Restroom' },
  { key: 'lowNoiseLevel', label: 'Low Noise Level' },
  { key: 'brailleMenuAvailable', label: 'Braille Menu Available' },
  { key: 'wideDoorways', label: 'Wide Doorways' },
  { key: 'accessibleParking', label: 'Accessible Parking' }
];

const ALLERGEN_OPTIONS = [
  { key: 'peanutSafe', label: 'Peanut Safe Zone', icon: '🥜' },
  { key: 'treeNutSafe', label: 'Tree Nut Safe Zone', icon: '🌲' },
  { key: 'dairyFree', label: 'Dairy Free Options', icon: '🥛' },
  { key: 'glutenSensitive', label: 'Gluten Sensitive Accommodation', icon: '🌾' }
];

export default function ProfileSetupView() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const adminEmail = queryParams.get('email') || 'preview-venue@table.com';

  const [rooms, setRooms] = useState([
    { id: 'room-1', defaultLabel: 'MAIN DINING ROOM', customLabel: 'Main Dining Room' },
    { id: 'room-2', defaultLabel: 'PATIO ENCLOSURE', customLabel: 'Patio Enclosure' }
  ]);

  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [customCuisine, setCustomCuisine] = useState('');

  const [accessibility, setAccessibility] = useState({
    stepFreeEntry: false,
    spaciousRestroom: false,
    lowNoiseLevel: false,
    brailleMenuAvailable: false,
    wideDoorways: false,
    accessibleParking: false
  });

  const [allergens, setAllergens] = useState({
    peanutSafe: false,
    treeNutSafe: false,
    dairyFree: false,
    glutenSensitive: false
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddRoom = () => {
    const newId = `room-${Date.now()}`;
    const roomCount = rooms.length + 1;
    setRooms([
      ...rooms,
      {
        id: newId,
        defaultLabel: `DINING AREA ${roomCount}`,
        customLabel: `Dining Area ${roomCount}`
      }
    ]);
  };

  const handleRemoveRoom = (id) => {
    setRooms(rooms.filter((room) => room.id !== id));
  };

  const handleRoomLabelChange = (id, value) => {
    setRooms(
      rooms.map((room) => (room.id === id ? { ...room, customLabel: value } : room))
    );
  };

  const handleToggleCuisine = (cuisine) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter((item) => item !== cuisine));
    } else {
      if (selectedCuisines.length >= 5) {
        setError('Maximum configuration limits reached. Select up to five cuisine classifications.');
        return;
      }
      setSelectedCuisines([...selectedCuisines, cuisine]);
      setError('');
    }
  };

  const handleAddCustomCuisine = (e) => {
    e.preventDefault();
    const cleanCuisine = customCuisine.trim();
    if (!cleanCuisine) return;

    if (selectedCuisines.length >= 5) {
      setError('Maximum configuration limits reached. Select up to five cuisine classifications.');
      return;
    }

    if (!selectedCuisines.includes(cleanCuisine)) {
      setSelectedCuisines([...selectedCuisines, cleanCuisine]);
    }
    setCustomCuisine('');
    setError('');
  };

  const handleToggleAccessibility = (key) => {
    setAccessibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleAllergen = (key) => {
    setAllergens((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmitProfile = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (selectedCuisines.length === 0) {
      setError('Please allocate at least one cuisine classification vector.');
      setIsSubmitting(false);
      return;
    }

    try {
      await OnboardingService.saveRestaurantProfile({
        email: adminEmail,
        rooms: rooms.map((r) => ({ id: r.id, name: r.customLabel || r.defaultLabel })),
        cuisines: selectedCuisines,
        accessibility,
        allergens
      });

      setSuccess('Venue blueprint saved successfully! Redirecting to management control matrix...');
      setTimeout(() => {
        navigate('/merchant');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to sync merchant metrics.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-table-canvas text-table-text font-sans antialiased pb-24">
      <div className="max-w-5xl mx-auto px-6 pt-12 space-y-8">
        
        {/* Top Header Section */}
        <div>
          <span className="text-xs font-mono font-bold tracking-wider text-table-offer uppercase block">
            Initial Infrastructure Assignment
          </span>
          <h1 className="text-4xl font-black tracking-tight mt-1">
            Configure Venue Spatial Framework
          </h1>
          <p className="text-sm text-table-textMuted mt-2">
            Populating setup profiles for verified registration administrator:{' '}
            <span className="text-table-text font-mono bg-table-surface px-2 py-0.5 rounded border border-table-border">
              {adminEmail}
            </span>
          </p>
        </div>

        {/* Dynamic Alerts */}
        {error && (
          <div className="p-4 bg-table-danger/10 border border-table-danger/20 text-table-danger rounded-xl text-xs font-mono flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-table-success/10 border border-table-success/20 text-table-success rounded-xl text-xs font-mono flex items-center gap-2">
            <span>✓</span> {success}
          </div>
        )}

        {/* Section 1: Rooms Blueprint Container */}
        <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-3">
            <span className="text-lg text-table-textMuted">⛶</span>
            <div>
              <h2 className="text-base font-bold font-mono text-table-text">
                Rooms and Operational Tables Blueprint
              </h2>
              <p className="text-xs font-mono text-table-textSubtle mt-0.5">
                Specify active dining floor structures to allocate operational space metrics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between p-4 bg-table-canvas border border-table-border rounded-xl focus-within:border-table-primary/50 transition-colors"
              >
                <div className="flex-1 mr-4">
                  <label className="text-[10px] font-mono font-bold text-table-textSubtle block uppercase tracking-wider mb-0.5">
                    {room.defaultLabel}
                  </label>
                  <input
                    type="text"
                    value={room.customLabel}
                    onChange={(e) => handleRoomLabelChange(room.id, e.target.value)}
                    className="bg-transparent border-none text-base font-medium text-table-text focus:outline-none w-full p-0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRoom(room.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-table-textSubtle hover:text-table-danger hover:bg-table-danger/10 border border-table-border/50 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddRoom}
            className="w-full py-3 bg-table-interactive hover:bg-table-border border border-table-border text-table-textMuted hover:text-table-text font-mono font-bold text-xs rounded-xl uppercase tracking-widest transition-all"
          >
            + Append New Spatial Room Zone
          </button>
        </section>

        {/* Section 2: Cuisine Tags Matrix */}
        <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-3">
            <span className="text-lg">🍱</span>
            <div>
              <h2 className="text-base font-bold font-mono text-table-text">
                Specialized Cuisine Tags Assignment
              </h2>
              <p className="text-xs font-mono text-table-textSubtle mt-0.5">
                Choose up to five distinct cuisines. Selected tags:{' '}
                <span className="text-table-offer font-bold font-mono">
                  {selectedCuisines.length}/5
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_CUISINES.map((cuisine) => {
              const isSelected = selectedCuisines.includes(cuisine);
              return (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => handleToggleCuisine(cuisine)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-medium border transition-colors ${
                    isSelected
                      ? 'bg-table-primary text-table-canvas border-table-primary font-bold'
                      : 'bg-table-canvas text-table-textMuted border-table-border hover:border-table-textSubtle'
                  }`}
                >
                  {cuisine} {isSelected && '✓'}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleAddCustomCuisine} className="flex gap-3 max-w-md pt-2">
            <input
              type="text"
              value={customCuisine}
              onChange={(e) => setCustomCuisine(e.target.value)}
              placeholder="Add Custom Tag (e.g. Vegan Tapas)"
              className="flex-1 bg-table-interactive border border-table-border rounded-xl px-4 py-2.5 text-sm text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-primary/50"
            />
            <button
              type="submit"
              className="px-5 bg-table-interactive border border-table-border text-xs font-mono uppercase font-bold rounded-xl tracking-wider hover:bg-table-border text-table-text transition-colors"
            >
              Add
            </button>
          </form>
        </section>

        {/* Section 3: Physical Accessibility Grid */}
        <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-3">
            <span className="text-lg text-table-primary">♿</span>
            <div>
              <h2 className="text-base font-bold font-mono text-table-text">
                Physical Accessibility Matrix
              </h2>
              <p className="text-xs font-mono text-table-textSubtle mt-0.5">
                Establish verified access markers for mapping algorithms.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACCESSIBILITY_OPTIONS.map((item) => {
              const isToggled = accessibility[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => handleToggleAccessibility(item.key)}
                  className="flex justify-between items-center p-4 bg-table-canvas border border-table-border rounded-xl cursor-pointer select-none hover:border-table-border/80 transition-colors"
                >
                  <span className="text-sm font-medium text-table-text">
                    {item.label}
                  </span>
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      isToggled ? 'bg-table-primary' : 'bg-table-interactive'
                    }`}
                  >
                    <div
                      className={`bg-table-text w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        isToggled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: Kitchen Safety Allergen Stacks */}
        <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-3">
            <span className="text-lg text-table-offer">🧪</span>
            <div>
              <h2 className="text-base font-bold font-mono text-table-text">
                Allergen Safety Profiles
              </h2>
              <p className="text-xs font-mono text-table-textSubtle mt-0.5">
                Configure active health guardrails for kitchen ticket formatting systems.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ALLERGEN_OPTIONS.map((allergen) => {
              const isToggled = allergens[allergen.key];
              return (
                <div
                  key={allergen.key}
                  onClick={() => handleToggleAllergen(allergen.key)}
                  className="flex justify-between items-center p-4 bg-table-canvas border border-table-border rounded-xl cursor-pointer select-none hover:border-table-border/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg bg-table-interactive w-9 h-9 flex items-center justify-center rounded-xl border border-table-border/50">
                      {allergen.icon}
                    </span>
                    <span className="text-sm font-medium text-table-text">
                      {allergen.label}
                    </span>
                  </div>
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      isToggled ? 'bg-table-primary' : 'bg-table-interactive'
                    }`}
                  >
                    <div
                      className={`bg-table-text w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        isToggled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Submit Commit Action Trigger */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSubmitProfile}
            disabled={isSubmitting}
            className="w-full py-4 bg-table-primary hover:bg-table-primaryHover text-table-canvas font-black font-mono text-sm rounded-xl transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-table-primary/10"
          >
            {isSubmitting ? 'Syncing Infrastructure Metrics...' : 'Finalize Profile Setup & Enter Dashboard'}
          </button>
        </div>

      </div>
    </div>
  );
}