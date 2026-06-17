import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Pulled in router navigation utilities

// Archetypes for automatic generation of table structures
const TABLE_TYPES = ['Round', 'Square', 'Rectangular', 'Booth'];

export default function MerchantDashboard() {
  const navigate = useNavigate(); // Initialized the navigator hook

  // ─── Global Tab Navigation State ─────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('floor'); 
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('Week'); 
  const [isLive, setIsLive] = useState(true);
  const [restaurantName] = useState("Joe's Pizza Broadway");
  
  // Inline configuration toggle state for the layout workspace
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // ─── Dynamic Room & Table Blueprint Configuration State ──────────────────
  const [roomConfig, setRoomConfig] = useState([
    { id: 'room-1', defaultLabel: 'Main Floor', customLabel: 'Main Floor', tableCount: 7, isActive: true },
    { id: 'room-2', defaultLabel: 'Terrace', customLabel: 'Terrace', tableCount: 3, isActive: true },
    { id: 'room-3', defaultLabel: 'Bar & Lounge', customLabel: 'Bar & Lounge', tableCount: 3, isActive: true },
  ]);

  // Generate complete table database structure dynamically based on the current configuration state
  const tables = useMemo(() => {
    let generatedTables = [];
    let tableIndexGlobal = 1;

    roomConfig.forEach((room) => {
      if (!room.isActive) return;

      for (let i = 0; i < room.tableCount; i++) {
        const typeIndex = i % TABLE_TYPES.length;
        const capacity = (typeIndex + 1) * 2; 
        const labelPrefix = room.customLabel.split(' ').map(w => w[0]).join('').toUpperCase() || 'T';
        
        generatedTables.push({
          id: `dynamic-t-${tableIndexGlobal}`,
          label: `${labelPrefix}${i + 1}`,
          type: TABLE_TYPES[typeIndex],
          capacity: capacity,
          status: i === 1 ? 'Reserved' : i === 2 && room.id === 'room-3' ? 'Unavailable' : 'Available',
          zone: room.customLabel
        });
        tableIndexGlobal++;
      }
    });

    return generatedTables;
  }, [roomConfig]);

  // Derived tracking to set the first available active room as selection fallback
  const activeZones = useMemo(() => roomConfig.filter(r => r.isActive).map(r => r.customLabel), [roomConfig]);
  const [selectedZoneOverride, setSelectedZoneOverride] = useState(null);

  const activeZone = useMemo(() => {
    if (selectedZoneOverride && activeZones.includes(selectedZoneOverride)) {
      return selectedZoneOverride;
    }
    return activeZones[0] || '';
  }, [activeZones, selectedZoneOverride]);

  // Table Canvas & Overlay States
  const [selectedTable, setSelectedTable] = useState(null);
  const [overlayActiveTab, setOverlayActiveTab] = useState('discount'); 

  // Dynamic Pricing Tier States
  const [discountPercent, setDiscountPercent] = useState(15);
  const [timeWindow, setTimeWindow] = useState(30);
  
  // Local Table Inline Properties States
  const [editLabel, setEditLabel] = useState('');
  const [editCapacity, setEditCapacity] = useState(4);
  const [editType, setEditType] = useState('Round');
  const [editStatus, setEditStatus] = useState('Available');

  // Restaurant Profile Settings States
  const [uploadedMenu, setUploadedMenu] = useState(null);
  const [accessibility, setAccessibility] = useState({
    wheelchairEntrance: true,
    accessibleParking: false,
    wheelchairBathrooms: true,
    brailleMenu: false,
    stepFreeEntry: true,
    largePrintMenu: true,
    hearingLoop: false,
    assistanceDogs: true
  });
  const [allergens, setAllergens] = useState({
    nuts: false,
    peanuts: false,
    gluten: true,
    dairy: true,
    soy: false,
    shellfish: false,
    eggs: false,
    fish: false
  });

  // Table Availability Shifts Data
  const [tableSchedules, setTableSchedules] = useState({
    default: [{ time: "6:00 PM", status: "Available" }, { time: "7:30 PM", status: "Available" }, { time: "9:00 PM", status: "Available" }]
  });

  const [reservations] = useState([
    { id: 101, guest: "Alexander Wright", covers: 2, time: "7:30 PM", status: "Confirmed", notes: "Window table requested" },
    { id: 102, guest: "Sophia Laurent", covers: 4, time: "6:00 PM", status: "Seated", notes: "Allergy: Gluten Free" },
    { id: 103, guest: "Marcus Vance", covers: 2, time: "9:00 PM", status: "Pending", notes: "Celebrating Anniversary" }
  ]);

  // Dynamic Metrics computed on selected timeframe filter
  const timeframeMetrics = useMemo(() => {
    switch (analyticsTimeframe) {
      case 'Today':
        return { covers: "142", revenue: "€2,840", growth: "+6.2%", newDiners: "24%", returnDiners: "76%" };
      case 'Month':
        return { covers: "5,410", revenue: "€174,900", growth: "+11.4%", newDiners: "35%", returnDiners: "65%" };
      case 'Week':
      default:
        return { covers: "1,240", revenue: "€42,150", growth: "+8.0%", newDiners: "32%", returnDiners: "68%" };
    }
  }, [analyticsTimeframe]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleOpenOverlay = (table) => {
    setSelectedTable(table);
    setOverlayActiveTab('discount'); 
    setEditLabel(table.label);
    setEditCapacity(table.capacity);
    setEditType(table.type);
    setEditStatus(table.status);
  };

  const handleSaveTableDetails = (e) => {
    e.preventDefault();
    setSelectedTable(null);
  };

  const toggleSlotStatus = (timeSlotText) => {
    const tableId = selectedTable.id;
    const currentSchedule = tableSchedules[tableId] || JSON.parse(JSON.stringify(tableSchedules.default));
    const updatedSchedule = currentSchedule.map(slot => slot.time === timeSlotText ? { ...slot, status: slot.status === 'Available' ? 'Booked' : 'Available' } : slot);
    setTableSchedules(prev => ({ ...prev, [tableId]: updatedSchedule }));
  };

  const handleBroadcastFlashDiscount = () => {
    alert(`⚡ Broadcast successful! A ${discountPercent}% Flash Deal pushed to active app users.`);
    setSelectedTable(null);
  };

  const handleAddRoom = () => {
    const newId = `room-${Date.now()}`;
    const roomNumber = roomConfig.length + 1;
    setRoomConfig(prev => [...prev, { 
      id: newId, 
      defaultLabel: `Room ${roomNumber}`, 
      customLabel: `Room ${roomNumber}`, 
      tableCount: 4, 
      isActive: true 
    }]);
  };

  const handleRemoveRoom = (id) => {
    if (roomConfig.length <= 1) {
      alert("You must have at least one room configured.");
      return;
    }
    
    const roomToRemove = roomConfig.find(r => r.id === id);
    setRoomConfig(prev => prev.filter(room => room.id !== id));
    
    if (roomToRemove && selectedZoneOverride === roomToRemove.customLabel) {
      setSelectedZoneOverride(null);
    }
  };

  const handleUpdateRoomStatus = (id) => {
    setRoomConfig(prev => prev.map(room => room.id === id ? { ...room, isActive: !room.isActive } : room));
  };

  const handleUpdateRoomName = (id, newName) => {
    setRoomConfig(prev => prev.map(room => room.id === id ? { ...room, customLabel: newName } : room));
  };

  const handleUpdateRoomTableCount = (id, value) => {
    setRoomConfig(prev => prev.map(room => room.id === id ? { ...room, tableCount: Math.max(1, Math.min(10, room.tableCount + value)) } : room));
  };

  const filteredTables = useMemo(() => tables.filter(t => t.zone === activeZone), [tables, activeZone]);
  const activeTableSchedule = useMemo(() => selectedTable ? (tableSchedules[selectedTable.id] || tableSchedules.default) : [], [selectedTable, tableSchedules]);

  const ALLERGEN_META = [
    { key: 'gluten', label: 'Gluten', icon: '🌾', desc: 'Contains ingredients with wheat, rye, barley, or oats.' },
    { key: 'dairy', label: 'Dairy', icon: '🥛', desc: 'Contains milk, butter, cheese, or cream elements.' },
    { key: 'nuts', label: 'Tree Nuts', icon: '🥜', desc: 'Contains almonds, walnuts, pecans, or pistachios.' },
    { key: 'peanuts', label: 'Peanuts', icon: '🥜', desc: 'Contains peanuts or dynamic peanut oil derivatives.' },
    { key: 'soy', label: 'Soy', icon: '🫘', desc: 'Contains soy sauces, tofu, or soybean extracts.' },
    { key: 'shellfish', label: 'Shellfish', icon: '🦐', desc: 'Contains shrimp, crab, lobster, or mollusks.' },
    { key: 'eggs', label: 'Eggs', icon: '🍳', desc: 'Contains whole eggs or egg-derived ingredients.' },
    { key: 'fish', label: 'Fish', icon: '🐟', desc: 'Contains finfish products, savory stocks, or sauces.' },
  ];

  return (
    <div className="bg-[#0A0A0A] min-h-[calc(100vh-73px)] text-zinc-100 p-6 md:p-8 font-sans relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* GLOBAL CONTROL HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl gap-4 shadow-xl">
          <div>
            <span className="text-sm font-mono tracking-widest text-amber-400 uppercase">Tablé Slate // Merchant Desk</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-1">{restaurantName}</h1>
          </div>
          
          <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
            <div className="text-right">
              <p className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Live Booking Engine</p>
              <p className={`text-sm font-semibold ${isLive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isLive ? 'ACCEPTING APP BOOKINGS' : 'OFFLINE / FULL CAPACITY'}
              </p>
            </div>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-all duration-300 ${isLive ? 'bg-emerald-500 justify-end' : 'bg-zinc-700 justify-start'}`}
            >
              <div className="bg-black w-6 h-6 rounded-full shadow-md" />
            </button>
          </div>
        </div>

        {/* NAVIGATION CONTROL HEADER */}
        <div className="flex border-b border-zinc-800 gap-6 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('floor')}
            className={`pb-4 text-base font-medium tracking-wide transition-all border-b-2 whitespace-nowrap ${activeTab === 'floor' ? 'border-amber-400 text-white font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            📋 Room and Table Layout
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-4 text-base font-medium tracking-wide transition-all border-b-2 whitespace-nowrap ${activeTab === 'analytics' ? 'border-amber-400 text-white font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-base font-medium tracking-wide transition-all border-b-2 whitespace-nowrap ${activeTab === 'settings' ? 'border-amber-400 text-white font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            ⚙️ Restaurant Settings
          </button>
        </div>

        {/* ─── TAB VIEW WORKSPACE ─────────────────────────────────────────── */}
        
        {/* VIEW 1: ROOM AND TABLE LAYOUT */}
        {activeTab === 'floor' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start animate-fadeIn">
            
            {/* Live Activity Sidecard Column */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="border-b border-zinc-800 pb-4">
                  <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">⚡ Live Activity Log</h2>
                  <p className="text-sm text-zinc-500 mt-1">Real-time trace reporting of client check-ins.</p>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {reservations.map((res) => (
                    <div key={res.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2 text-sm hover:border-zinc-700 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white text-base">{res.guest}</h4>
                          <p className="text-zinc-400 font-mono mt-0.5 text-sm">{res.time} — {res.covers} Covers</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-mono border uppercase bg-zinc-900 text-zinc-400 border-zinc-800">{res.status}</span>
                      </div>
                      {res.notes && <p className="text-zinc-500 bg-zinc-900/40 border border-zinc-850 p-2 rounded italic text-xs">"{res.notes}"</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* INTEGRATED ALERT BANNER CARD */}
              <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/40 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-3 shadow-xl animate-fadeIn">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/25 uppercase">
                    Automated Optimizer Alert
                  </span>
                  <h4 className="text-base font-serif font-bold text-amber-500 mt-3">Quiet Period Detected</h4>
                  <p className="text-xs text-zinc-400 leading-normal mt-1">
                    Cover your margins during this slow hour by launching real-time walk-in deals to app users walking down your street.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => navigate('/explore')} 
                  className="w-full text-center py-2.5 bg-zinc-950 border border-zinc-850 hover:border-emerald-500/40 rounded-xl font-mono text-xs text-emerald-400 font-bold transition-all shadow-inner flex items-center justify-center gap-1.5"
                >
                  ACTIVATE NOW &rarr;
                </button>
              </div>
            </div>

            {/* Matrix Core Card Area */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-white">🗺️ Room and Table Layout</h2>
                    <p className="text-sm text-zinc-500 mt-0.5">Select a table node asset to issue live flash discounts, toggle shift block timers, or alter labels.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                    {/* Expandable Configuration Drawer Trigger Toggle */}
                    <button 
                      onClick={() => setIsConfigOpen(!isConfigOpen)}
                      className={`px-4 py-2 text-sm font-mono font-semibold rounded-xl border transition-all flex items-center gap-2 ${isConfigOpen ? 'bg-amber-400 text-black border-transparent shadow-md' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-amber-400'}`}
                    >
                      🛠️ {isConfigOpen ? 'Hide Configuration' : 'Configure Rooms'}
                    </button>

                    <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      {activeZones.length === 0 ? (
                        <span className="text-sm p-2 text-zinc-500 italic">No active rooms</span>
                      ) : (
                        activeZones.map((zoneName) => (
                          <button 
                            key={zoneName} 
                            onClick={() => setSelectedZoneOverride(zoneName)} 
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeZone === zoneName ? 'bg-amber-400 text-black font-semibold shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
                          >
                            {zoneName}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* INLINE EXPANDABLE WORKSPACE PANEL: ROOMS AND TABLES SETUP */}
                {isConfigOpen && (
                  <div className="p-5 bg-zinc-950/60 border border-zinc-850 rounded-xl space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-start border-b border-zinc-850 pb-4">
                      <div>
                        <h3 className="text-lg font-serif font-bold text-white">🏢 Rooms and Tables</h3>
                        <p className="text-sm text-zinc-500 mt-0.5">Dynamically add zones, toggle layout views, or customize table capacity scales (1-10).</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleAddRoom}
                          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-sm font-mono font-semibold rounded-lg transition-all"
                        >
                          + Add Room
                        </button>
                        <button 
                          onClick={() => setIsConfigOpen(false)}
                          className="px-3 py-1.5 bg-zinc-900/40 border border-zinc-850 hover:text-zinc-200 text-zinc-400 text-sm font-mono rounded-lg transition-all"
                        >
                          ✕ Dismiss
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {roomConfig.map((room) => (
                        <div key={room.id} className={`p-4 rounded-xl border transition-all ${room.isActive ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-900/10 border-zinc-900 opacity-50'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            
                            {/* Switch + Name Editing inputs */}
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleUpdateRoomStatus(room.id)}
                                className={`w-10 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${room.isActive ? 'bg-amber-400 flex justify-end' : 'bg-zinc-800 flex justify-start'}`}
                              >
                                <div className="bg-black w-5 h-5 rounded-full" />
                              </button>
                              <div>
                                <span className="text-sm font-mono text-zinc-500 block">{room.defaultLabel}</span>
                                <input 
                                  type="text" 
                                  value={room.customLabel} 
                                  disabled={!room.isActive}
                                  onChange={(e) => handleUpdateRoomName(room.id, e.target.value)}
                                  className="bg-transparent text-white text-base font-semibold border-b border-transparent hover:border-zinc-700 focus:border-amber-400 focus:outline-none py-0.5 transition-all w-36 sm:w-48 disabled:opacity-50"
                                />
                              </div>
                            </div>

                            {/* Stepper Counters and Delete Actions */}
                            <div className="flex items-center gap-4 self-end sm:self-auto">
                              <span className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Tables</span>
                              <div className={`flex items-center border rounded-lg overflow-hidden mr-2 ${room.isActive ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-900 bg-zinc-950 opacity-40'}`}>
                                <button 
                                  type="button" 
                                  disabled={!room.isActive || room.tableCount <= 1}
                                  onClick={() => handleUpdateRoomTableCount(room.id, -1)} 
                                  className="px-3 py-1.5 font-bold text-zinc-400 hover:bg-zinc-950 transition-all disabled:opacity-50 text-sm"
                                >
                                  -
                                </button>
                                <span className="font-mono text-white text-sm font-bold px-3 min-w-[32px] text-center">
                                  {room.tableCount}
                                </span>
                                <button 
                                  type="button" 
                                  disabled={!room.isActive || room.tableCount >= 10}
                                  onClick={() => handleUpdateRoomTableCount(room.id, 1)} 
                                  className="px-3 py-1.5 font-bold text-zinc-400 hover:bg-zinc-950 transition-all disabled:opacity-50 text-sm"
                                >
                                  +
                                </button>
                              </div>
                              
                              <button 
                                type="button" 
                                onClick={() => handleRemoveRoom(room.id)}
                                className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-850 hover:border-rose-500/50 text-zinc-500 hover:text-rose-400 flex items-center justify-center transition-all text-sm"
                                title="Remove Room"
                              >
                                ✕
                              </button>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table Canvas Assets Render Engine Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredTables.map((table) => {
                    let statusClasses = "bg-zinc-950 text-zinc-400 border-zinc-850 hover:border-zinc-700 shadow-inner";
                    if (table.status === 'Available') statusClasses = "bg-emerald-950/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-950/20 hover:border-emerald-500/40 shadow-inner";
                    if (table.status === 'Reserved') statusClasses = "bg-amber-950/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 shadow-inner";
                    if (table.status === 'Unavailable') statusClasses = "bg-zinc-900/30 text-zinc-600 border-zinc-900 opacity-40";

                    return (
                      <div key={table.id} onClick={() => handleOpenOverlay(table)} className={`h-32 rounded-xl border p-4 flex flex-col justify-between cursor-pointer transition-all ${statusClasses}`}>
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-base font-bold text-white">{table.label}</span>
                          {table.status === 'Available' && <span className="text-[10.5px] font-mono bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/20 uppercase tracking-wider animate-pulse">Empty</span>}
                        </div>
                        <div className="flex justify-center">
                          <div className={`h-10 flex items-center justify-center font-mono text-sm border tracking-wider ${table.type === 'Round' ? 'w-10 rounded-full' : 'w-16 rounded-md'} border-current/10 bg-current/5`}>{table.capacity}P</div>
                        </div>
                        <div className="text-[11.5px] font-mono text-zinc-500 flex justify-between items-center">
                          <span>{table.type} Structure</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        </div>
                      </div>
                    );
                  })}
                  {activeZones.length > 0 && filteredTables.length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl font-mono text-sm">
                      This room is currently empty. Adjust settings inside the setup configuration panel above.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: ANALYTICS INSIGHTS SUITE */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fadeIn">
            {/* TIMEFRAME FILTERS CONTROL BAR */}
            <div className="flex justify-between items-center bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-xl">
              <div>
                <h3 className="text-base font-semibold text-white">Insights & performance tracking</h3>
              </div>
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-850">
                {['Today', 'Week', 'Month'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setAnalyticsTimeframe(t)}
                    className={`px-3 py-1 text-sm rounded transition-all ${analyticsTimeframe === t ? 'bg-[#00f2fe]/10 text-[#00f2fe] font-medium border border-[#00f2fe]/20 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    This {t}
                  </button>
                ))}
              </div>
            </div>

            {/* PERFORMANCE METRIC HOVER CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Covers This Period", value: timeframeMetrics.covers, sub: timeframeMetrics.growth, subColor: "text-emerald-400" },
                { label: "Total Revenue", value: timeframeMetrics.revenue, sub: "▲ +8%", subColor: "text-emerald-400" },
                { label: "New Diners %", value: timeframeMetrics.newDiners, sub: "Since last period", subColor: "text-zinc-500" },
                { label: "Return Diners %", value: timeframeMetrics.returnDiners, sub: "+2.4%", subColor: "text-amber-400" }
              ].map((card, i) => (
                <div key={i} className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-5 rounded-xl space-y-2 shadow-xl hover:border-zinc-700 transition-all">
                  <p className="text-zinc-500 text-sm uppercase tracking-wider font-mono">{card.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-serif font-bold text-white">{card.value}</span>
                    <span className={`text-sm font-mono ${card.subColor}`}>{card.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CHARTS WORKSPACE GRAPH GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CHART A: COVERS OVER TIME */}
              <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-5 rounded-xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <h4 className="text-base font-semibold text-zinc-200">Covers Over Time</h4>
                  <span className="text-sm font-mono text-[#00f2fe]">Live Feed</span>
                </div>
                <div className="h-44 flex items-end justify-between pt-6 px-2 relative bg-zinc-950/40 rounded-xl border border-zinc-850 p-2">
                  <svg className="absolute inset-0 w-full h-full p-2 overflow-visible" preserveAspectRatio="none">
                    <path d="M 10 130 Q 80 110 150 70 T 320 110 T 480 30 T 600 10" fill="none" stroke="#00f2fe" strokeWidth="2.5" />
                    <path d="M 10 130 Q 80 110 150 70 T 320 110 T 480 30 T 600 10 L 600 170 L 10 170 Z" fill="url(#grad)" opacity="0.05" />
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#00f2fe" /><stop offset="100%" stopColor="#0A0A0A" /></linearGradient>
                    </defs>
                  </svg>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <span key={day} className="text-[11.5px] font-mono text-zinc-500 z-10">{day}</span>
                  ))}
                </div>
              </div>

              {/* CHART B: REVENUE TIMEFRAME GRAPH */}
              <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-5 rounded-xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <h4 className="text-base font-semibold text-zinc-200">Revenue Distribution</h4>
                  <div className="flex gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1 text-[#00f2fe]"><span className="w-2 h-2 bg-[#00f2fe] rounded-full" /> Current</span>
                    <span className="flex items-center gap-1 text-zinc-600"><span className="w-2 h-2 bg-zinc-700 rounded-full" /> Previous</span>
                  </div>
                </div>
                <div className="h-44 flex items-end justify-around pt-4 bg-zinc-950/40 rounded-xl border border-zinc-850 p-2">
                  {[
                    { label: '6am-11am', curr: 30, prev: 20 },
                    { label: '11am-4pm', curr: 75, prev: 60 },
                    { label: '4pm-9pm', curr: 95, prev: 80 },
                    { label: '9pm-12am', curr: 55, prev: 40 },
                  ].map((bar, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 w-full max-w-[80px]">
                      <div className="w-full flex justify-center items-end gap-1.5 h-28">
                        <div className="w-3 bg-zinc-800 rounded-t" style={{ height: `${bar.prev}%` }} />
                        <div className="w-3 bg-[#00f2fe] rounded-t" style={{ height: `${bar.curr}%` }} />
                      </div>
                      <span className="text-[10.5px] font-mono text-zinc-500 whitespace-nowrap">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 3: SETTINGS WORKSPACE */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
            
            {/* Left Sidebar Actions */}
            <div className="space-y-6 lg:col-span-1">
              {/* Menu Upload Box Area */}
              <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div>
                  <h3 className="text-lg font-serif font-bold text-white">📖 Digital Menu Library</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">Upload asset streams to broadcast details directly to customer mobile profile views.</p>
                </div>
                <div className="border-2 border-dashed border-zinc-800 rounded-xl p-6 text-center hover:border-zinc-600 transition-all bg-zinc-950/50 flex flex-col items-center justify-center min-h-[160px] relative shadow-inner">
                  <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => e.target.files?.[0] && setUploadedMenu(e.target.files[0].name)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  <span className="text-3xl mb-2">📋</span>
                  <p className="text-sm font-medium text-zinc-300">Drag & drop or browse local files</p>
                  {uploadedMenu && <div className="mt-4 px-3 py-1.5 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-[13px] font-mono rounded-lg">✓ Synced: {uploadedMenu}</div>}
                </div>
              </div>
            </div>

            {/* Core Blueprint Parameters Layout Area */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Accessibility Feature Block Wrapper */}
              <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div>
                  <h3 className="text-xl font-serif font-bold text-white">♿ Dining Accessibility Features</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">Help diners find your establishment. Verified features build community loyalty across customer feeds.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'wheelchairEntrance', label: 'Wheelchair Access (Entrance)', desc: 'Entrance is leveled or ramped for seamless building approach.' },
                    { key: 'accessibleParking', label: 'Accessible Parking Spots', desc: 'Designated spacious loading bays positioned directly next to building pathways.' },
                    { key: 'wheelchairBathrooms', label: 'Wheelchair-Accessible Bathrooms', desc: 'Wide stalls equipped with stable handrails inside guest layouts.' },
                    { key: 'brailleMenu', label: 'Braille Menu Assets Available', desc: 'Standard physical food listings provided completely in Braille translation.' },
                    { key: 'stepFreeEntry', label: 'Step-Free Floor Transitions', desc: 'Zero interior structural staircases needed to navigate core zones.' },
                    { key: 'largePrintMenu', label: 'Large Print Menu Options', desc: 'High-contrast text alternatives utilizing prominent font layout dimensions.' },
                    { key: 'hearingLoop', label: 'Induction Hearing Loop', desc: 'Audio frequency transmission support accessible to assistive hearing devices.' },
                    { key: 'assistanceDogs', label: 'Assistance Dogs Welcome', desc: 'Certified service animals permitted throughout all indoor zones.' }
                  ].map((item) => (
                    <div key={item.key} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex items-start justify-between gap-4 hover:border-zinc-700 transition-all">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-zinc-200">{item.label}</p>
                        <p className="text-[13px] text-zinc-500 leading-normal">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAccessibility(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className={`w-10 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${accessibility[item.key] ? 'bg-emerald-400 flex justify-end' : 'bg-zinc-800 flex justify-start'}`}
                      >
                        <div className="bg-black w-5 h-5 rounded-full" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergen Registry Block */}
              <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div>
                  <h3 className="text-xl font-serif font-bold text-white">⚠️ Core Menu Allergen Registry</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">Flag ingredients actively handled in your kitchen matrix to auto-alert sensitive app users.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ALLERGEN_META.map((item) => (
                    <div key={item.key} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex items-start justify-between gap-4 hover:border-zinc-700 transition-all">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </p>
                        <p className="text-[13px] text-zinc-500 leading-normal">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAllergens(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className={`w-10 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${allergens[item.key] ? 'bg-rose-500 flex justify-end' : 'bg-zinc-800 flex justify-start'}`}
                      >
                        <div className="bg-black w-5 h-5 rounded-full" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-4 border-t border-zinc-800 mt-4">
                  <button type="button" onClick={() => alert("Settings successfully saved.")} className="px-6 py-2.5 bg-emerald-400 text-black font-bold rounded-xl text-sm font-mono uppercase tracking-wider transition-all shadow-md hover:bg-white">Save Changes</button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ─── DYNAMIC POPUP MODAL OVERLAY ─────────────────────────────────── */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 bg-zinc-950 border-b border-zinc-850 flex justify-between items-center">
              <div>
                <span className="text-[11.5px] font-mono tracking-widest text-amber-400 uppercase block">Yield Control Center</span>
                <h3 className="text-xl font-serif font-bold text-white">Table Asset Control: {selectedTable.label}</h3>
              </div>
              <button onClick={() => setSelectedTable(null)} className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-sm flex items-center justify-center transition-all">✕</button>
            </div>

            <div className="flex border-b border-zinc-850 bg-zinc-950 text-sm font-mono font-bold tracking-wider uppercase">
              <button onClick={() => setOverlayActiveTab('discount')} className={`flex-1 py-3 transition-all border-b-2 text-center ${overlayActiveTab === 'discount' ? 'border-amber-400 text-amber-300 bg-zinc-900/40' : 'border-transparent text-zinc-500'}`}>⚡ Flash Deal</button>
              <button onClick={() => setOverlayActiveTab('slots')} className={`flex-1 py-3 transition-all border-b-2 text-center ${overlayActiveTab === 'slots' ? 'border-amber-400 text-amber-300 bg-zinc-900/40' : 'border-transparent text-zinc-500'}`}>🕒 Shift Schedule</button>
              <button onClick={() => setOverlayActiveTab('settings')} className={`flex-1 py-3 transition-all border-b-2 text-center ${overlayActiveTab === 'settings' ? 'border-amber-400 text-amber-300 bg-zinc-900/40' : 'border-transparent text-zinc-500'}`}>⚙️ Setup</button>
            </div>

            <div className="p-6 bg-zinc-900">
              {overlayActiveTab === 'discount' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11.5px] font-mono uppercase tracking-wider text-zinc-400 block">Select Discount Tier</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 15, 20, 25].map((pct) => (
                        <button key={pct} type="button" onClick={() => setDiscountPercent(pct)} className={`py-3 rounded-xl border font-mono text-base font-bold text-center transition-all ${discountPercent === pct ? 'bg-amber-400 border-transparent text-black shadow-md' : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700'}`}>{pct}%</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11.5px] font-mono uppercase tracking-wider text-zinc-400 block">Claim Window</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[15, 30, 45].map((mins) => (
                        <button key={mins} type="button" onClick={() => setTimeWindow(mins)} className={`py-2 rounded-xl border font-mono text-sm text-center transition-all ${timeWindow === mins ? 'bg-zinc-950 border-amber-400 text-amber-300 shadow-sm' : 'bg-zinc-950/40 border-zinc-850 text-zinc-500'}`}>{mins} Mins</button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-850">
                    <button type="button" onClick={handleBroadcastFlashDiscount} className="w-full py-3.5 bg-amber-400 text-black rounded-xl text-sm font-mono font-bold uppercase tracking-wider transition-all shadow-md hover:bg-amber-300">Broadcast Live Deal</button>
                  </div>
                </div>
              )}

              {overlayActiveTab === 'slots' && (
                <div className="space-y-4">
                  <div className="space-y-2 pt-2">
                    {activeTableSchedule.map((slot, index) => (
                      <div key={index} className="flex justify-between items-center bg-zinc-950 border border-zinc-850 p-3 rounded-xl shadow-inner">
                        <span className="text-base font-mono font-bold text-white">{slot.time}</span>
                        <button type="button" onClick={() => toggleSlotStatus(slot.time)} className={`px-4 py-1.5 rounded-lg text-sm font-mono font-bold transition-all border ${slot.status === 'Available' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}>{slot.status === 'Available' ? '✓ Open' : '✕ Blocked'}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {overlayActiveTab === 'settings' && (
                <form onSubmit={handleSaveTableDetails} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11.5px] font-mono uppercase text-zinc-500 block">Label Display</label>
                    <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-amber-400 font-mono shadow-inner text-base" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11.5px] font-mono uppercase text-zinc-500 block">Layout Archetype</label>
                    <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 focus:outline-none text-sm shadow-inner">
                      <option value="Round">Round Table</option>
                      <option value="Square">Square Table</option>
                      <option value="Rectangular">Rectangular Table</option>
                      <option value="Booth">Lounge Booth</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11.5px] font-mono uppercase text-zinc-500 block">Seating Capacity</label>
                    <div className="flex items-center border border-zinc-850 bg-zinc-950 rounded-lg overflow-hidden justify-between shadow-inner">
                      <button type="button" onClick={() => setEditCapacity(Math.max(1, editCapacity - 1))} className="px-3 py-1.5 font-bold text-zinc-400 hover:bg-zinc-900 text-sm">-</button>
                      <span className="font-mono text-zinc-200 text-sm font-bold">{editCapacity} Seats</span>
                      <button type="button" onClick={() => setEditCapacity(editCapacity + 1)} className="px-3 py-1.5 font-bold text-zinc-400 hover:bg-zinc-900 text-sm">+</button>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-850">
                    <button type="submit" className="w-full py-3 bg-[#ebd8c3] text-black text-sm font-mono font-bold rounded-xl uppercase tracking-wider hover:bg-white transition-all shadow-md">Save Table</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}