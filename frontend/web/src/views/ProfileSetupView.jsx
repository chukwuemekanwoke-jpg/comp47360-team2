import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OnboardingService } from '../services/OnboardingService';

const ALLERGEN_META = [
  { key: 'treeNutsPeanuts', label: 'Tree Nuts & Peanuts', icon: '🥜' },
  { key: 'glutenWheat', label: 'Gluten / Wheat', icon: '🌾' },
  { key: 'dairy', label: 'Dairy', icon: '🥛' },
  { key: 'crustaceansShellfish', label: 'Crustaceans & Shellfish', icon: '🦞' }
];

const ACCESSIBILITY_OPTIONS = [
  'wheelchairEntrance',
  'wheelchairBathrooms',
  'stepFreeEntry',
  'hearingLoop',
  'accessibleParking',
  'brailleMenu',
  'largePrintMenu',
  'assistanceDogs'
];

const PRESET_CUISINES = [
  'American', 'Chinese', 'Indian', 'Italian', 'Thai', 
  'French', 'Japanese', 'Mediterranean', 'Mexican', 'Spanish'
];

export default function ProfileSetupView() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract email parameter passed during registration redirection
  const queryParams = new URLSearchParams(location.search);
  const adminEmail = queryParams.get('email') || 'preview-venue@table.com';

  const [rooms, setRooms] = useState([
    { id: 'zone-1', defaultLabel: 'Main Dining Room', customLabel: 'Main Dining Room' },
    { id: 'zone-2', defaultLabel: 'Dining Area 2', customLabel: 'Dining Area 2' }
  ]);

  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [customCuisine, setCustomCuisine] = useState('');

  const [accessibility, setAccessibility] = useState({
    wheelchairEntrance: false,
    wheelchairBathrooms: false,
    stepFreeEntry: false,
    hearingLoop: false,
    accessibleParking: false,
    brailleMenu: false,
    largePrintMenu: false,
    assistanceDogs: false
  });

  const [allergens, setAllergens] = useState({
    treeNutsPeanuts: false,
    glutenWheat: false,
    dairy: false,
    crustaceansShellfish: false
  });

  const [uiState, setUiState] = useState({ error: '', success: '', isSubmitting: false });

  // Room Configuration Actions
  const handleAddRoom = () => {
    const nextId = `zone-${Date.now()}`;
    const count = rooms.length + 1;
    setRooms([...rooms, { id: nextId, defaultLabel: `Dining Area ${count}`, customLabel: `Dining Area ${count}` }]);
  };

  const handleRemoveRoom = (id) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  const handleRoomNameChange = (id, val) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, customLabel: val } : r));
  };

  // Cuisine Array Handlers (Hard Max capped at 5 variants)
  const handleToggleCuisine = (cuisine) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine));
    } else {
      if (selectedCuisines.length >= 5) {
        setUiState({ ...uiState, error: 'Maximum configuration limits reached. Select up to five cuisine classifications.' });
        return;
      }
      setSelectedCuisines([...selectedCuisines, cuisine]);
      setUiState({ ...uiState, error: '' });
    }
  };

  const handleAddCustomCuisine = (e) => {
    e.preventDefault();
    const cleanValue = customCuisine.trim();
    if (!cleanValue) return;
    if (selectedCuisines.length >= 5) {
      setUiState({ ...uiState, error: 'Maximum configuration limits reached. Select up to five cuisine classifications.' });
      return;
    }
    if (!selectedCuisines.includes(cleanValue)) {
      setSelectedCuisines([...selectedCuisines, cleanValue]);
    }
    setCustomCuisine('');
    setUiState({ ...uiState, error: '' });
  };

  const handleProfileSubmit = async () => {
    setUiState({ error: '', success: '', isSubmitting: true });
    
    if (selectedCuisines.length === 0) {
      setUiState({ error: 'Please allocate at least one cuisine classification vector.', success: '', isSubmitting: false });
      return;
    }

    try {
      await OnboardingService.saveRestaurantProfile({
        email: adminEmail,
        rooms: rooms.map(r => ({ id: r.id, name: r.customLabel || r.defaultLabel })),
        cuisines: selectedCuisines,
        accessibility,
        allergens
      });

      setUiState({ error: '', success: 'Venue blueprint saved successfully! Redirecting to management control matrix...', isSubmitting: false });
      setTimeout(() => navigate('/merchant'), 2000);
    } catch (err) {
      setUiState({ error: err.message || 'Failed to sync merchant metrics.', success: '', isSubmitting: false });
    }
  };

  return (
    <div className="fixed inset-0 top-[90px] w-full bg-[#0A0A0A] text-white font-sans overflow-y-scroll z-40">
      <div className="max-w-4xl mx-auto p-8 box-border space-y-8 pb-32">
        
        {/* Banner Navigation Title Context */}
        <div className="border-b border-[#1F2936] pb-6">
          <span className="text-xs font-mono font-bold tracking-widest text-[#e29c36] uppercase block">Initial Infrastructure Assignment</span>
          <h1 className="text-3xl font-black mt-1">Configure Venue Spatial Framework</h1>
          <p className="text-sm text-slate-400 mt-1">Populating setup profiles for verified registration administrator: <span className="text-slate-200 font-mono font-bold">{adminEmail}</span></p>
        </div>

        {uiState.error && <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-xs font-mono">⚠️ {uiState.error}</div>}
        {uiState.success && <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono">🎉 {uiState.success}</div>}

        {/* COMPONENT 1: ROOMS MAPPING GENERATOR */}
        <div className="bg-[#12171E] border border-[#1F2936] rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">🎛️ Rooms</h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">Specify the amount of rooms in your restaurant. Not exactly sure how many you have? Don't worry, you can change things in the Settings Menu</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between p-4 bg-[#0B0F14] border border-[#1F2936] rounded-xl">
                <div className="flex-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">{room.defaultLabel}</span>
                  <input 
                    type="text" 
                    value={room.customLabel} 
                    onChange={(e) => handleRoomNameChange(room.id, e.target.value)}
                    className="bg-transparent border-none text-sm font-bold font-mono text-slate-100 focus:outline-none w-full p-0"
                  />
                </div>
                <button onClick={() => handleRemoveRoom(room.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-all text-xs ml-2 border border-zinc-800">✕</button>
              </div>
            ))}
          </div>
          <button onClick={handleAddRoom} className="w-full py-2.5 bg-[#171E26] hover:bg-[#1F2936] border border-[#1F2936] text-slate-300 font-mono font-bold text-xs rounded-xl uppercase tracking-wider transition-colors">Add Room</button>
        </div>

        {/* COMPONENT 2: CUISINE TAG ALLOCATION (MAX 5) */}
        <div className="bg-[#12171E] border border-[#1F2936] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold font-mono text-slate-100">🍱 Type of Cuisine</h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">Choose up to five distinct cuisines. Selected tags: <span className="text-[#e29c36] font-bold font-sans">{selectedCuisines.length}/5</span></p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {PRESET_CUISINES.map((cuisine) => {
              const isSelected = selectedCuisines.includes(cuisine);
              return (
                <button
                  key={cuisine}
                  onClick={() => handleToggleCuisine(cuisine)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                    isSelected ? 'bg-[#e29c36] text-slate-950 border-[#e29c36]' : 'bg-[#0B0F14] text-slate-400 border-[#1F2936] hover:text-white'
                  }`}
                >
                  {cuisine} {isSelected && '✓'}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleAddCustomCuisine} className="flex gap-2 max-w-sm pt-2">
            <input 
              type="text" 
              value={customCuisine} 
              onChange={(e) => setCustomCuisine(e.target.value)}
              placeholder="Add Custom Tag (e.g. Vegan Tapas)" 
              className="flex-1 bg-[#0B0F14] border border-[#1F2936] rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none"
            />
            <button type="submit" className="px-4 bg-[#1F2936] border border-[#2D3A4B] text-xs font-mono uppercase font-bold rounded-xl tracking-wider hover:bg-zinc-700">Add</button>
          </form>
        </div>

        {/* COMPONENT 3: PHYSICAL ACCESSIBILITY REGISTRY */}
        <div className="bg-[#12171E] border border-[#1F2936] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold font-mono text-slate-100">♿ Physical Accessibility Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACCESSIBILITY_OPTIONS.map((key) => (
              <div 
                key={key} 
                onClick={() => setAccessibility(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-all ${
                  accessibility[key] ? 'bg-purple-950/20 border-purple-500/40' : 'bg-[#0B0F14] border-[#1F2936]'
                }`}
              >
                <p className="text-xs font-bold text-slate-200 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-all ${accessibility[key] ? 'bg-purple-500 justify-end' : 'bg-zinc-800 justify-start'}`}>
                  <div className="bg-white w-3 h-3 rounded-full shadow-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMPONENT 4: SYSTEMIC ALLERGEN MATRIX */}
        <div className="bg-[#12171E] border border-[#1F2936] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold font-mono text-slate-100">🧪 Allergen Safety Profiles</h3>
          <div className="grid grid-cols-1 gap-4">
            {ALLERGEN_META.map((allergen) => (
              <div 
                key={allergen.key}
                onClick={() => setAllergens(prev => ({ ...prev, [allergen.key]: !prev[allergen.key] }))}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  allergens[allergen.key] ? 'bg-[#e29c36]/10 border-[#e29c36]/40' : 'bg-[#0B0F14] border-[#1F2936]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{allergen.icon}</span>
                  <h4 className="text-xs font-bold text-slate-200">{allergen.label}</h4>
                </div>
                <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-all ${allergens[allergen.key] ? 'bg-[#e29c36] justify-end' : 'bg-zinc-800 justify-start'}`}>
                  <div className="bg-white w-3 h-3 rounded-full shadow-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMPLETE ONBOARDING BUTTON */}
        <div className="pt-4">
          <button
            onClick={handleProfileSubmit}
            disabled={uiState.isSubmitting}
            className="w-full py-4 bg-[#e29c36] hover:bg-[#d18b25] text-slate-950 font-black font-mono text-sm rounded-xl transition-all uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uiState.isSubmitting ? 'Syncing Profile Configurations...' : 'Finalize Profile Setup & Enter Dashboard'}
          </button>
        </div>

      </div>
    </div>
  );
}