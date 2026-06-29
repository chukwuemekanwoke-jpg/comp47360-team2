import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for protective routing
import DashboardHeader from '../components/DashboardHeader';
import ActivityLog from '../components/ActivityLog';
import TableGrid from '../components/TableGrid';
import AnalyticsView from '../components/AnalyticsView';
import SettingsPanel from '../components/SettingsPanel';
import TableControl from '../components/TableControl';
import OccupancyMeter from '../components/OccupancyMeter';
import BookingsView from '../components/BookingsView';
import { MerchantService } from '../services/MerchantService';
import { useMerchantSocket } from '../hooks/useMerchantSocket';
import { useAuth } from '../context/AuthContext'; // Global secure identity context

const ALLERGEN_META = [
  { key: 'nuts', label: 'Tree Nuts & Peanuts', icon: '🥜', desc: 'Food may contain nuts' },
  { key: 'gluten', label: 'Gluten / Wheat', icon: '🌾', desc: 'Food may contain wheat, barley or rye.' },
  { key: 'dairy', label: 'Dairy', icon: '🥛', desc: 'Food may contain dairy products.' },
  { key: 'shellfish', label: 'Crustaceans & Shellfish', icon: '🦞', desc: 'Food may contain shellfish.' }
];

export default function MerchantDashboard() {
  const navigate = useNavigate();

  // Sourcing identity metrics safely with a fallback to prevent destructure crashes
  const { isAuthenticated, restaurantId, logout } = useAuth() || {};

  // -------------------------------------------------------------------------
  // 🚧 DEVELOPMENT-ONLY AUTOMATIC BYPASS LOOP
  // -------------------------------------------------------------------------
  // This hook ensures that if you end up on this page during local development
  // without logging in, it won't force-redirect you back out. It provides a
  // visual warning in your console while letting you inspect your layout work.
  useEffect(() => {
    if (!isAuthenticated || !restaurantId) {
      console.warn(
        "⚠️ [DEV NOTICE]: No active production session token discovered. " +
        "If you are using the AuthContext.jsx Dev Bypass, make sure you hard-refresh (Ctrl+F5) " +
        "so the fake keys register in LocalStorage!"
      );
      
      // UNCOMMENT the line below when you want to enforce strict production login redirection:
      // navigate('/');
    }
  }, [isAuthenticated, restaurantId, navigate]);
  // -------------------------------------------------------------------------

  const [activeTab, setActiveTab] = useState('floor');
  const [isLive, setIsLive] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState("Restaurant Control Panel");
  const [activeCampaign, setActiveCampaign] = useState(null);

  const [reservations, setReservations] = useState([
    { id: 1, guest: 'Marcus Aurelius', time: '19:30', eta_minutes: 12, transport_mode: 'walking', status: 'confirmed', notes: 'Anniversary celebration. Prefer window table.' },
    { id: 2, guest: 'Senecca Elder', time: '20:00', eta_minutes: 4, transport_mode: 'driving', status: 'pending', notes: 'Severe tree nut allergy registry alert.' },
    { id: 3, guest: 'Hypatia Alexandria', time: '20:45', eta_minutes: 25, transport_mode: 'transit', status: 'confirmed', notes: null }
  ]);

  const [roomConfig, setRoomConfig] = useState([
    { id: 1, defaultLabel: 'Room 1', customLabel: '', tableCount: 5 },
    { id: 2, defaultLabel: 'Room 2', customLabel: '', tableCount: 3 },
    { id: 3, defaultLabel: 'Room 3', customLabel: '', tableCount: 4 }
  ]);

  const [activeZone, setActiveZone] = useState('Room 1');

  const [tables, setTables] = useState([
    { id: 1, label: 'Table-1', type: 'Square', capacity: 2, status: 'Available', room: 'Room 1' },
    { id: 2, label: 'Table-2', type: 'Round', capacity: 4, status: 'Reserved', room: 'Room 1', reservedTime: '20:00' },
    { id: 3, label: 'Table-3', type: 'Rectangular', capacity: 6, status: 'Unavailable', room: 'Room 1' },
    { id: 4, label: 'Table-1', type: 'Square', capacity: 2, status: 'Available', room: 'Room 2' },
    { id: 5, label: 'Table-2', type: 'Booth', capacity: 4, status: 'Reserved', room: 'Room 2', reservedTime: '19:30' }
  ]);

  const [activeFlashDeals, setActiveFlashDeals] = useState({});
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('Today');
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  
  const [timeframeMetrics, setTimeframeMetrics] = useState({
    covers: "0",
    growth: "—",
    revenue: "$0.00",
    newDiners: "0%",
    returnDiners: "0%"
  });

  const [uploadedMenu, setUploadedMenu] = useState(null);
  
  const [accessibility, setAccessibility] = useState({
    wheelchairEntrance: true,
    accessibleParking: false,
    wheelchairBathrooms: true,
    brailleMenu: false,
    stepFreeEntry: true,
    largePrintMenu: true,
    hearingLoop: false,
    assistanceDogs: true,
    sensoryFriendly: false
  });

  const [allergens, setAllergens] = useState({
    nuts: true,
    gluten: true,
    dairy: true,
    shellfish: false
  });

  const [selectedTable, setSelectedTable] = useState(null);
  const [overlayActiveTab, setOverlayActiveTab] = useState('discount');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [timeWindow, setTimeWindow] = useState(30);
  const [editLabel, setEditLabel] = useState('');
  const [editType, setEditType] = useState('Square');
  const [editCapacity, setEditCapacity] = useState(4);
  const [activeTableSchedule, setActiveTableSchedule] = useState([
    { time: '5:00 PM - 7:00 PM', status: 'Available' },
    { time: '7:00 PM - 9:00 PM', status: 'Available' },
    { time: '9:00 PM - 11:00 PM', status: 'Available' }
  ]);

  // WebSocket Live Updates Stream Mutators
  const handleIncomingBookingStream = useCallback((updatedBooking) => {
    setReservations(prev => {
      const exists = prev.some(b => b.id === updatedBooking.id);
      if (exists) {
        return prev.map(b => b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b);
      }
      return [updatedBooking, ...prev];
    });
  }, []);

  const handleIncomingTableStream = useCallback((updatedTable) => {
    setTables(prev => prev.map(t => t.id === updatedTable.id ? { ...t, ...updatedTable } : t));
  }, []);

  // Initialize Real-Time Synchronization Link with dynamic context ID
  const { isConnected } = useMerchantSocket(restaurantId, {
    onBookingUpdate: handleIncomingBookingStream,
    onTableStateUpdate: handleIncomingTableStream
  });

  // Base Initialization Hook - Synchronizes structural business configurations from DB context
  useEffect(() => {
    if (!restaurantId) return;

    async function fetchDatabaseState() {
      try {
        const details = await MerchantService.getRestaurantDetails(restaurantId);
        if (details && details.name) {
          setRestaurantName(details.name);
          setAccessibility(prev => ({
            ...prev,
            wheelchairEntrance: details.is_wheelchair_accessible ?? prev.wheelchairEntrance,
            sensoryFriendly: details.sensory_friendly ?? prev.sensoryFriendly
          }));
        }
        
        const layoutData = await MerchantService.getFloorPlan(restaurantId);
        if (layoutData) {
          if (layoutData.rooms && layoutData.rooms.length > 0) setRoomConfig(layoutData.rooms);
          if (layoutData.tables && layoutData.tables.length > 0) setTables(layoutData.tables);
          if (layoutData.rooms && layoutData.rooms.length > 0) {
            const primaryZone = layoutData.rooms[0].customLabel || layoutData.rooms[0].defaultLabel;
            setActiveZone(primaryZone);
          }
        }

        const campaign = await MerchantService.getActiveCampaign(restaurantId);
        if (campaign) setActiveCampaign(campaign);

        const freshBookings = await MerchantService.getLiveBookings(restaurantId);
        if (freshBookings && freshBookings.length > 0) setReservations(freshBookings);

      } catch (err) {
        console.warn("Backend API gateway offline. Serving baseline local test mockups.", err.message);
      }
    }
    fetchDatabaseState();
  }, [restaurantId]);

  // Aggregated Analytics Selector Fetch Sync Handler
  useEffect(() => {
    if (!restaurantId || activeTab !== 'analytics') return;

    async function fetchAnalytics() {
      setIsAnalyticsLoading(true);
      try {
        const data = await MerchantService.getAnalytics(restaurantId, analyticsTimeframe);
        if (data) setTimeframeMetrics(data);
      } catch (err) {
        console.warn(`Analytics aggregation for ${analyticsTimeframe} offline. Serving localized mock fallbacks.`, err.message);
        const fallbackMocks = {
          'Today': { covers: "142", growth: "▲ +12.4%", revenue: "$4,850.00", newDiners: "38%", returnDiners: "62%" },
          'Week': { covers: "1,105", growth: "▲ +5.2%", revenue: "$38,400.00", newDiners: "42%", returnDiners: "58%" },
          'Month': { covers: "4,892", growth: "▼ -1.1%", revenue: "$165,200.00", newDiners: "35%", returnDiners: "65%" }
        };
        setTimeframeMetrics(fallbackMocks[analyticsTimeframe] || fallbackMocks['Today']);
      } finally {
        setIsAnalyticsLoading(false);
      }
    }
    
    fetchAnalytics();
  }, [analyticsTimeframe, activeTab, restaurantId]);

  const handleSaveVenueSettings = async () => {
    try {
      await MerchantService.updateRestaurantSettings(restaurantId, {
        is_wheelchair_accessible: accessibility.wheelchairEntrance,
        sensory_friendly: accessibility.sensoryFriendly
      });
      alert("⚡ SUCCESS: Operational criteria successfully synchronized across application servers.");
    } catch (err) {
      console.error("Configuration persistence fault:", err);
      alert(`⚠️ API Connection issue. Profile fallback updated locally only: ${err.message}`);
    }
  };

  const activeZones = useMemo(() => {
    return roomConfig.map(room => room.customLabel || room.defaultLabel);
  }, [roomConfig]);

  const filteredTables = useMemo(() => {
    return tables.filter(table => table.room === activeZone);
  }, [tables, activeZone]);

  const occupancyData = useMemo(() => {
    const data = {};
    activeZones.forEach(zone => {
      data[zone] = { available: 0, total: 0 };
    });

    tables.forEach(table => {
      const roomName = table.room;
      if (data[roomName]) {
        data[roomName].total += 1;
        if (table.status === 'Available') {
          data[roomName].available += 1;
        }
      }
    });
    return data;
  }, [tables, activeZones]);

  const handleUpdateRoomName = async (id, newName) => {
    try {
      await MerchantService.updateRoom(id, { customLabel: newName });
    } catch (err) {
      console.warn("Granular endpoint skipped. Syncing locally.", err.message);
    }
    setRoomConfig(roomConfig.map(room => room.id === id ? { ...room, customLabel: newName } : room));
  };

  const handleRemoveRoom = async (id) => {
    try {
      await MerchantService.deleteRoom(id);
    } catch (err) {
      console.warn("Granular endpoint skipped. Dropping locally.", err.message);
    }
    const targets = roomConfig.filter(room => room.id !== id);
    setRoomConfig(targets);
    if (targets.length > 0) {
      setActiveZone(targets[0].customLabel || targets[0].defaultLabel);
    }
  };

  const handleAddRoom = async () => {
    const nextId = roomConfig.length > 0 ? Math.max(...roomConfig.map(r => r.id)) + 1 : 1;
    const newRoomName = `Room ${nextId}`;
    const payload = { id: nextId, defaultLabel: newRoomName, customLabel: '', tableCount: 0 };

    try {
      const committedRoom = await MerchantService.createRoom(restaurantId, payload);
      if (committedRoom && committedRoom.id) {
        setRoomConfig([...roomConfig, committedRoom]);
        setActiveZone(committedRoom.customLabel || committedRoom.defaultLabel);
        return;
      }
    } catch (err) {
      console.warn("Database createRoom endpoint offline. Forking mock local index.", err.message);
    }

    setRoomConfig([...roomConfig, payload]);
    setActiveZone(newRoomName);
  };

  const handleAllotNewTable = async (roomName) => {
    const nextId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    const tableIndex = tables.filter(t => t.room === roomName).length + 1;
    const payload = { 
      id: nextId, 
      label: `Table-${tableIndex}`, 
      type: 'Square', 
      capacity: 4, 
      status: 'Available', 
      room: roomName 
    };

    try {
      const committedTable = await MerchantService.createTable(restaurantId, payload);
      if (committedTable && committedTable.id) {
        setTables([...tables, committedTable]);
        return;
      }
    } catch (err) {
      console.warn("Database createTable endpoint offline. Defaulting locally.", err.message);
    }

    setTables([...tables, payload]);
  };

  const handleRemoveTable = async (tableId) => {
    try {
      await MerchantService.deleteTable(tableId);
    } catch (err) {
      console.warn("Database deleteTable endpoint unreachable.", err.message);
    }
    setTables(prevTables => prevTables.filter(t => t.id !== tableId));
  };

  const handleAdjustTableCapacity = async (tableId, change) => {
    const targetTable = tables.find(t => t.id === tableId);
    if (!targetTable) return;
    const targetCapacity = Math.max(1, targetTable.capacity + change);

    try {
      await MerchantService.updateTable(tableId, { ...targetTable, capacity: targetCapacity });
    } catch (err) {
      console.warn("Database updateTable capacity sync failure.", err.message);
    }

    setTables(prevTables => prevTables.map(t => 
      t.id === tableId ? { ...t, capacity: targetCapacity } : t
    ));
  };

  const handleUpdateTableLabel = async (tableId, newLabel) => {
    const targetTable = tables.find(t => t.id === tableId);
    try {
      await MerchantService.updateTable(tableId, { ...targetTable, label: newLabel });
    } catch (err) {
      console.warn("Database updateTable label sync failure.", err.message);
    }

    setTables(tables.map(t => t.id === tableId ? { ...t, label: newLabel } : t));
  };

  const handleOpenOverlay = (table) => {
    setSelectedTable(table);
    setEditLabel(table.label);
    setEditType(table.type);
    setEditCapacity(table.capacity);
    setOverlayActiveTab('discount');
  };

  const handleBroadcastFlashDiscount = async () => {
    try {
      const databaseCampaign = await MerchantService.broadcastFlashCampaign(
        restaurantId, 
        1, 
        discountPercent
      );
      
      setActiveCampaign(databaseCampaign);
      const expiry = new Date(Date.now() + timeWindow * 60000);
      setActiveFlashDeals(prev => ({ ...prev, [selectedTable.id]: expiry }));
      
      alert(`⚡ SUCCESS: Campaign broadcasted live to user inboxes. ID: ${databaseCampaign.id}`);
      setSelectedTable(null);
    } catch (err) {
      console.error("Campaign broadcast failed:", err);
      const expiry = new Date(Date.now() + timeWindow * 60000);
      setActiveFlashDeals(prev => ({ ...prev, [selectedTable.id]: expiry }));
      alert(`⚠️ API Gateway offline. Simulated local voucher fallback activated for ${discountPercent}%.`);
      setSelectedTable(null);
    }
  };

  const toggleSlotStatus = (timeSlot) => {
    setActiveTableSchedule(activeTableSchedule.map(slot => 
      slot.time === timeSlot ? { ...slot, status: slot.status === 'Available' ? 'Blocked' : 'Available' } : slot
    ));
  };

  const handleSaveTableDetails = async (e) => {
    e.preventDefault();
    const updatedProperties = { label: editLabel, type: editType, capacity: editCapacity };
    
    try {
      await MerchantService.updateTable(selectedTable.id, { ...selectedTable, ...updatedProperties });
    } catch (err) {
      console.error("Failed to commit advanced table specs to DB context:", err);
    }

    setTables(tables.map(t => t.id === selectedTable.id ? { ...t, ...updatedProperties } : t));
    setSelectedTable(null);
  };

  // Secure validation gate if session criteria resolves falsy
  if (!restaurantId) {
    return (
      <div className="h-screen w-full bg-[#0B0F14] flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#e29c36] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs tracking-widest text-slate-400 uppercase">Validating merchant workspace credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0B0F14] text-slate-100 font-sans antialiased flex flex-col overflow-hidden">
      {/* Upper Global Command Module */}
      <div className="flex-none p-4 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-1 bg-[#12171E] p-1 rounded-xl border border-[#1F2936]">
            <button 
              onClick={() => setActiveTab('floor')} 
              className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'floor' ? 'bg-[#e29c36] text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🗺️ Floor
            </button>
            <button 
              onClick={() => setActiveTab('bookings')} 
              className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'bookings' ? 'bg-[#3b82f6] text-white font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📅 Bookings
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'analytics' ? 'bg-[#171E26] text-[#33e1cc]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📊 Analytics
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-[#171E26] text-purple-400 font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              ⚙️ Settings
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* WebSocket Network Status Connection Beacon */}
            <div className="flex items-center gap-2 bg-[#11161D] border border-[#1F2936] px-4 py-2 rounded-xl">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#33e1cc] animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
                {isConnected ? 'Live WebSockets Active' : 'Connecting Data Pipeline...'}
              </span>
            </div>
            
            {/* Sign-out Interactive Control Trigger */}
            <button 
              onClick={logout}
              className="px-4 py-2 bg-[#171e26] border border-red-900/40 text-red-400 hover:bg-red-950/20 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-colors"
            >
              Logout 🚪
            </button>
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <DashboardHeader name={restaurantName} isLive={isLive} onToggleLive={() => setIsLive(!isLive)} />
        </div>
      </div>
      
      {/* Core Adaptive Main View Content Grid */}
      <div className="flex-1 w-full overflow-y-auto px-4 sm:px-8 pb-32">
        <div className="w-full">
          {activeTab === 'floor' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              <div className="space-y-6 lg:col-span-1">
                <ActivityLog reservations={reservations} />
                <OccupancyMeter occupancyData={occupancyData} />
              </div>
              
              <div className="lg:col-span-3 space-y-6">
                <TableGrid 
                  tables={filteredTables} 
                  onOpen={handleOpenOverlay}
                  activeZones={activeZones}
                  activeZone={activeZone}
                  setActiveZone={setActiveZone}
                  isConfigOpen={isConfigOpen}
                  setIsConfigOpen={setIsConfigOpen}
                  roomConfig={roomConfig}
                  onUpdateName={handleUpdateRoomName}
                  onRemoveRoom={handleRemoveRoom}
                  onAddRoom={handleAddRoom}
                  onAddTable={handleAllotNewTable}
                  onRemoveTable={handleRemoveTable}
                  onAdjustCapacity={handleAdjustTableCapacity}
                  onUpdateTableLabel={handleUpdateTableLabel}
                  activeFlashDeals={activeFlashDeals}
                />
              </div>
            </div>
          )}
          
          {activeTab === 'bookings' && (
            <div className="w-full max-w-7xl mx-auto">
              <BookingsView reservations={reservations} setReservations={setReservations} />
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className={`w-full max-w-7xl mx-auto transition-opacity duration-300 ${isAnalyticsLoading ? 'opacity-50' : 'opacity-100'}`}>
              <AnalyticsView 
                analyticsTimeframe={analyticsTimeframe} 
                setAnalyticsTimeframe={setAnalyticsTimeframe} 
                timeframeMetrics={timeframeMetrics} 
              />
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="w-full max-w-7xl mx-auto">
              <SettingsPanel 
                uploadedMenu={uploadedMenu} 
                setUploadedMenu={setUploadedMenu} 
                accessibility={accessibility} 
                setAccessibility={setAccessibility} 
                allergenMeta={ALLERGEN_META} 
                allergens={allergens} 
                setAllergens={setAllergens} 
                onSaveSettings={handleSaveVenueSettings}
              />
            </div>
          )}
        </div>
      </div>

      {/* Advanced Drawer Grid Overlay Management Control Panel */}
      {selectedTable && (
        <TableControl 
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          overlayActiveTab={overlayActiveTab}
          setOverlayActiveTab={setOverlayActiveTab}
          discountPercent={discountPercent}
          setDiscountPercent={setDiscountPercent}
          timeWindow={timeWindow}
          setTimeWindow={setTimeWindow}
          handleBroadcastFlashDiscount={handleBroadcastFlashDiscount}
          activeTableSchedule={activeTableSchedule}
          toggleSlotStatus={toggleSlotStatus}
          handleSaveTableDetails={handleSaveTableDetails}
          editLabel={editLabel}
          setEditLabel={setEditLabel}
          editType={editType}
          setEditType={setEditType}
          editCapacity={editCapacity}
          setEditCapacity={setEditCapacity}
        />
      )}
    </div>
  );
}