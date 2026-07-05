import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import ActivityLog from '../components/ActivityLog';
import TableGrid from '../components/TableGrid';
import AnalyticsView from '../components/AnalyticsView';
import SettingsPanel from '../components/SettingsPanel';
import TableControl from '../components/TableControl';
import OccupancyMeter from '../components/OccupancyMeter';
import BookingsView from '../components/BookingsView';
import { useAuth } from '../context/AuthContext';

// --- RTK Query Imports (Corrected to 3-level relative path with explicit extension) ---
import { 
  useGetRestaurantDetailQuery,
  useGetFloorPlanQuery,
  useGetRestaurantCampaignsQuery,
  useGetLiveBookingsQuery,
  useGetAnalyticsQuery,
  useUpdateRestaurantSettingsMutation,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
  useCreateCampaignMutation
} from '../../../packages/shared/src/apiSlice.ts';

const ALLERGEN_META = [
  { key: 'nuts', label: 'Tree Nuts & Peanuts', icon: '🥜', desc: 'Food may contain nuts' },
  { key: 'gluten', label: 'Gluten / Wheat', icon: '🌾', desc: 'Food may contain wheat, barley or rye.' },
  { key: 'dairy', label: 'Dairy', icon: '🥛', desc: 'Food may contain dairy products.' },
  { key: 'shellfish', label: 'Crustaceans & Shellfish', icon: '🦞', desc: 'Food may contain shellfish.' }
];

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, restaurantId, logout } = useAuth() || {};

  useEffect(() => {
    if (!isAuthenticated || !restaurantId) {
      console.warn("⚠️ [DEV NOTICE]: No active production session token discovered.");
    }
  }, [isAuthenticated, restaurantId, navigate]);

  const [activeTab, setActiveTab] = useState('floor');
  const [isLive, setIsLive] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState("Restaurant Control Panel");
  // activeCampaign value is not yet consumed by the UI; kept for the pending campaign-banner work.
  const [, setActiveCampaign] = useState(null);

  // 100% Clean state initializations — No local fallback values
  const [reservations, setReservations] = useState([]);
  const [roomConfig, setRoomConfig] = useState([]);
  const [activeZone, setActiveZone] = useState('');
  const [tables, setTables] = useState([]);
  const [activeTableSchedule, setActiveTableSchedule] = useState([]);

  const [activeFlashDeals, setActiveFlashDeals] = useState({});
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('Today');
  
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

  // --- RTK Query Hooks ---
  const { data: detailsData } = useGetRestaurantDetailQuery(restaurantId, { skip: !restaurantId });
  const { data: floorPlanData } = useGetFloorPlanQuery(restaurantId, { skip: !restaurantId });
  const { data: campaignsData } = useGetRestaurantCampaignsQuery(restaurantId, { skip: !restaurantId });
  const { data: liveBookingsData } = useGetLiveBookingsQuery(restaurantId, { skip: !restaurantId });
  
  // Extracted refetch allows us to trigger pipeline updates when timeframe UI switch occurs
  const { data: analyticsData, isFetching: isAnalyticsLoading, refetch: refetchAnalytics } = useGetAnalyticsQuery(restaurantId, { 
    skip: !restaurantId || activeTab !== 'analytics' 
  });

  // --- RTK Mutation Hooks ---
  const [updateSettings] = useUpdateRestaurantSettingsMutation();
  const [createRoom] = useCreateRoomMutation();
  const [updateRoom] = useUpdateRoomMutation();
  const [deleteRoom] = useDeleteRoomMutation();
  const [createTable] = useCreateTableMutation();
  const [updateTable] = useUpdateTableMutation();
  const [deleteTable] = useDeleteTableMutation();
  const [createCampaign] = useCreateCampaignMutation();

  // Real-Time Socket Streams
  // const handleIncomingBookingStream = useCallback((updatedBooking) => {
  //   setReservations(prev => {
  //     const exists = prev.some(b => b.id === updatedBooking.id);
  //     if (exists) {
  //       return prev.map(b => b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b);
  //     }
  //     return [updatedBooking, ...prev];
  //   });
  // }, []);

  // const handleIncomingTableStream = useCallback((updatedTable) => {
  //   setTables(prev => prev.map(t => t.id === updatedTable.id ? { ...t, ...updatedTable } : t));
  // }, []);

  // const { isConnected } = useMerchantSocket(restaurantId, {
  //   onBookingUpdate: handleIncomingBookingStream,
  //   onTableStateUpdate: handleIncomingTableStream
  // });
  const isConnected = false;

  // --- Data Seeding Effects ---
  useEffect(() => {
    if (detailsData?.name) {
      setRestaurantName(detailsData.name);
      setAccessibility(prev => ({
        ...prev,
        wheelchairEntrance: detailsData.is_wheelchair_accessible ?? prev.wheelchairEntrance,
        sensoryFriendly: detailsData.sensory_friendly ?? prev.sensoryFriendly
      }));
    }
  }, [detailsData]);

  useEffect(() => {
    if (floorPlanData) {
      if (floorPlanData.rooms) setRoomConfig(floorPlanData.rooms);
      if (floorPlanData.tables) setTables(floorPlanData.tables);
      if (floorPlanData.rooms?.length > 0 && !activeZone) {
        setActiveZone(floorPlanData.rooms[0].customLabel || floorPlanData.rooms[0].defaultLabel);
      }
    }
  }, [floorPlanData, activeZone]);

  useEffect(() => {
    if (campaignsData?.campaigns?.length > 0) {
      setActiveCampaign(campaignsData.campaigns[0]);
    }
  }, [campaignsData]);

  useEffect(() => {
    if (liveBookingsData?.bookings) {
      setReservations(liveBookingsData.bookings);
    } else if (Array.isArray(liveBookingsData)) {
      setReservations(liveBookingsData);
    }
  }, [liveBookingsData]);

  useEffect(() => {
    if (analyticsData) {
      setTimeframeMetrics(analyticsData);
    }
  }, [analyticsData]);

  // Forces database load matching original dependency sequence when user toggles timeframe options
  useEffect(() => {
    if (restaurantId && activeTab === 'analytics') {
      refetchAnalytics();
    }
  }, [analyticsTimeframe, activeTab, restaurantId, refetchAnalytics]);


  // Operational Action Handlers 
  const handleSaveVenueSettings = async () => {
    try {
      await updateSettings({
        restaurantId,
        settings: {
          is_wheelchair_accessible: accessibility.wheelchairEntrance,
          sensory_friendly: accessibility.sensoryFriendly
        }
      }).unwrap();
      alert("⚡ Operational parameters committed to Postgres.");
    } catch (err) {
      console.error("Configuration persistence fault:", err);
      alert(`⚠️ Database save error: ${err.message || 'Unknown Error'}`);
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
    activeZones.forEach(zone => { data[zone] = { available: 0, total: 0 }; });

    tables.forEach(table => {
      const roomName = table.room;
      if (data[roomName]) {
        data[roomName].total += 1;
        if (table.status === 'Available') data[roomName].available += 1;
      }
    });
    return data;
  }, [tables, activeZones]);

  const handleUpdateRoomName = async (id, newName) => {
    try {
      await updateRoom({ roomId: id, roomData: { customLabel: newName } }).unwrap();
      setRoomConfig(roomConfig.map(room => room.id === id ? { ...room, customLabel: newName } : room));
    } catch (err) {
      console.error("DB room update failed:", err);
      alert("Could not synchronize new room name with database.");
    }
  };

  const handleRemoveRoom = async (id) => {
    try {
      await deleteRoom(id).unwrap();
      const targets = roomConfig.filter(room => room.id !== id);
      setRoomConfig(targets);
      if (targets.length > 0) setActiveZone(targets[0].customLabel || targets[0].defaultLabel);
    } catch (err) {
      console.error("DB room elimination failed:", err);
      alert("Could not delete room record from the database.");
    }
  };

  const handleAddRoom = async () => {
    const payload = { defaultLabel: `Room ${roomConfig.length + 1}`, customLabel: '', tableCount: 0 };
    try {
      const committedRoom = await createRoom({ restaurantId, roomData: payload }).unwrap();
      setRoomConfig([...roomConfig, committedRoom]);
      setActiveZone(committedRoom.customLabel || committedRoom.defaultLabel);
    } catch (err) {
      console.error("DB room allocation failed:", err);
      alert("Failed to insert new room record into your database.");
    }
  };

  const handleAllotNewTable = async (roomName) => {
    const tableIndex = tables.filter(t => t.room === roomName).length + 1;
    const payload = { label: `Table-${tableIndex}`, type: 'Square', capacity: 4, status: 'Available', room: roomName };
    try {
      const committedTable = await createTable({ restaurantId, tableData: payload }).unwrap();
      setTables([...tables, committedTable]);
    } catch (err) {
      console.error("DB table creation failed:", err);
      alert("Failed to allocate new table record within database.");
    }
  };

  const handleRemoveTable = async (tableId) => {
    try {
      await deleteTable(tableId).unwrap();
      setTables(prevTables => prevTables.filter(t => t.id !== tableId));
    } catch (err) {
      console.error("DB table dropping error:", err);
      alert("Failed to drop table row from database context.");
    }
  };

  const handleAdjustTableCapacity = async (tableId, change) => {
    const targetTable = tables.find(t => t.id === tableId);
    if (!targetTable) return;
    const targetCapacity = Math.max(1, targetTable.capacity + change);
    try {
      await updateTable({ tableId, tableData: { ...targetTable, capacity: targetCapacity } }).unwrap();
      setTables(prevTables => prevTables.map(t => t.id === tableId ? { ...t, capacity: targetCapacity } : t));
    } catch (err) {
      console.error("DB table capacity alignment error:", err);
      alert("Capacity modification failed on the database server.");
    }
  };

  const handleUpdateTableLabel = async (tableId, newLabel) => {
    const targetTable = tables.find(t => t.id === tableId);
    try {
      await updateTable({ tableId, tableData: { ...targetTable, label: newLabel } }).unwrap();
      setTables(tables.map(t => t.id === tableId ? { ...t, label: newLabel } : t));
    } catch (err) {
      console.error("DB label mutation error:", err);
      alert("Failed to record structural layout rename in database.");
    }
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
      const databaseCampaign = await createCampaign({ 
        restaurantId, 
        tableQuota: 1, 
        discountPercent 
      }).unwrap();
      
      setActiveCampaign(databaseCampaign);
      const expiry = new Date(Date.now() + timeWindow * 60000);
      setActiveFlashDeals(prev => ({ ...prev, [selectedTable.id]: expiry }));
      alert(`⚡ SUCCESS: Marketing entity mapped to database! ID: ${databaseCampaign.id || 'N/A'}`);
      setSelectedTable(null);
    } catch (err) {
      console.error("Campaign integration workflow rejected:", err);
      alert(`⚠️ Campaign initialization blocked: ${err.message || 'Unknown Error'}`);
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
      await updateTable({ 
        tableId: selectedTable.id, 
        tableData: { ...selectedTable, ...updatedProperties } 
      }).unwrap();
      
      setTables(tables.map(t => t.id === selectedTable.id ? { ...t, ...updatedProperties } : t));
      setSelectedTable(null);
    } catch (err) {
      console.error("Advanced configurations upload halted:", err);
      alert("Failed to commit physical dimensions adjustments to database grid.");
    }
  };

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
      {/* Upper Navigation Row */}
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
            <div className="flex items-center gap-2 bg-[#11161D] border border-[#1F2936] px-4 py-2 rounded-xl">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#33e1cc] animate-pulse' : 'bg-red-500'}`} />
              {/* <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
                {isConnected ? 'Live WebSockets Active' : 'Connecting Data Pipeline...'}
              </span> */}
            </div>
            <button onClick={logout} className="px-4 py-2 bg-[#171e26] border border-red-900/40 text-red-400 hover:bg-red-950/20 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-colors">
              Logout 🚪
            </button>
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <DashboardHeader name={restaurantName} isLive={isLive} onToggleLive={() => setIsLive(!isLive)} />
        </div>
      </div>
      
      {/* Component Core Dynamic Grid Content Panels */}
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

      {/* Slide-out Table Management Drawer Component overlay */}
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