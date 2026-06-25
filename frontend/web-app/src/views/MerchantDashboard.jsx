import { useState, useMemo } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import ActivityLog from '../components/ActivityLog';
import TableGrid from '../components/TableGrid';
import AnalyticsView from '../components/AnalyticsView';
import SettingsPanel from '../components/SettingsPanel';
import TableControl from '../components/TableControl';

const ALLERGEN_META = [
  { key: 'nuts', label: 'Tree Nuts & Peanuts', icon: '🥜', desc: 'Food may contain nuts' },
  { key: 'gluten', label: 'Gluten / Wheat', icon: '🌾', desc: 'Food may contain wheat, barley or rye.' },
  { key: 'dairy', label: 'Dairy', icon: '🥛', desc: 'Food may contain dairy products.' },
  { key: 'shellfish', label: 'Crustaceans & Shellfish', icon: '🦞', desc: 'Food may contain shellfish.' }
];

export default function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState('floor');
  const [isLive, setIsLive] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [restaurantName] = useState("Restaurant Control Panel");

  const [reservations] = useState([
    { id: 1, guest: 'Marcus Aurelius', time: '19:30', covers: 4, status: 'Checked In', notes: 'Anniversary celebration. Prefer window node.' },
    { id: 2, guest: 'Senecca Elder', time: '20:00', covers: 2, status: 'Seated', notes: 'Severe tree nut allergy registry alert.' },
    { id: 3, guest: 'Hypatia Alexandria', time: '20:45', covers: 6, status: 'Confirmed', notes: null }
  ]);

  const [roomConfig, setRoomConfig] = useState([
    { id: 1, defaultLabel: 'Zone Alpha', customLabel: 'Main Dining Floor', tableCount: 5, isActive: true },
    { id: 2, defaultLabel: 'Zone Beta', customLabel: 'Outer Patio Cover', tableCount: 3, isActive: true },
    { id: 3, defaultLabel: 'Zone Gamma', customLabel: 'Speakeasy Mezzanine', tableCount: 4, isActive: false }
  ]);

  const [activeZone, setActiveZone] = useState('Main Dining Floor');

  const [tables, setTables] = useState([
    { id: 1, label: 'T-1', type: 'Square', capacity: 2, status: 'Available', room: 'Main Dining Floor' },
    { id: 2, label: 'T-2', type: 'Round', capacity: 4, status: 'Reserved', room: 'Main Dining Floor' },
    { id: 3, label: 'T-3', type: 'Rectangular', capacity: 6, status: 'Unavailable', room: 'Main Dining Floor' },
    { id: 4, label: 'P-1', type: 'Square', capacity: 2, status: 'Available', room: 'Outer Patio Cover' },
    { id: 5, label: 'P-2', type: 'Booth', capacity: 4, status: 'Reserved', room: 'Outer Patio Cover' }
  ]);

  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('Today');
  
  const [timeframeMetrics] = useState({
    covers: "142",
    growth: "▲ +12.4%",
    revenue: "$4,850.00",
    newDiners: "38%",
    returnDiners: "62%"
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
    assistanceDogs: true
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

  const activeZones = useMemo(() => {
    return roomConfig.filter(room => room.isActive).map(room => room.customLabel || room.defaultLabel);
  }, [roomConfig]);

  const filteredTables = useMemo(() => {
    return tables.filter(table => table.room === activeZone);
  }, [tables, activeZone]);

  const handleUpdateRoomStatus = (id) => {
    setRoomConfig(roomConfig.map(room => room.id === id ? { ...room, isActive: !room.isActive } : room));
  };

  const handleUpdateRoomName = (id, newName) => {
    setRoomConfig(roomConfig.map(room => room.id === id ? { ...room, customLabel: newName } : room));
  };

  const handleUpdateRoomTableCount = (id, change) => {
    setRoomConfig(roomConfig.map(room => {
      if (room.id === id) {
        const newCount = Math.max(1, Math.min(10, room.tableCount + change));
        return { ...room, tableCount: newCount };
      }
      return room;
    }));
  };

  const handleRemoveRoom = (id) => {
    const targets = roomConfig.filter(room => room.id !== id);
    setRoomConfig(targets);
    if (targets.length > 0) {
      setActiveZone(targets[0].customLabel || targets[0].defaultLabel);
    }
  };

  const handleAddRoom = () => {
    const nextId = roomConfig.length > 0 ? Math.max(...roomConfig.map(r => r.id)) + 1 : 1;
    const newRoomName = `Zone ${String.fromCharCode(65 + (roomConfig.length % 26))}`;
    setRoomConfig([
      ...roomConfig, 
      { id: nextId, defaultLabel: newRoomName, customLabel: '', tableCount: 2, isActive: true }
    ]);
    setActiveZone(newRoomName);
  };

  const handleAllotNewTable = (roomName) => {
    const nextId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    const prefix = roomName.toLowerCase().includes('patio') ? 'P' : 'T';
    const tableIndex = tables.filter(t => t.room === roomName).length + 1;
    setTables([
      ...tables, 
      { id: nextId, label: `${prefix}-${tableIndex}`, type: 'Square', capacity: 4, status: 'Available', room: roomName }
    ]);
  };

  const handleAdjustTableCapacity = (tableId, change) => {
    setTables(tables.map(t => 
      t.id === tableId ? { ...t, capacity: Math.max(1, t.capacity + change) } : t
    ));
  };

  const handleOpenOverlay = (table) => {
    setSelectedTable(table);
    setEditLabel(table.label);
    setEditType(table.type);
    setEditCapacity(table.capacity);
    setOverlayActiveTab('discount');
  };

  const handleBroadcastFlashDiscount = () => {
    alert(`⚡ SUCCESS: Broadcasted an active ${discountPercent}% flash voucher for Table ${selectedTable.label} across mobile feeds valid for ${timeWindow} minutes.`);
    setSelectedTable(null);
  };

  const toggleSlotStatus = (timeSlot) => {
    setActiveTableSchedule(activeTableSchedule.map(slot => 
      slot.time === timeSlot ? { ...slot, status: slot.status === 'Available' ? 'Blocked' : 'Available' } : slot
    ));
  };

  const handleSaveTableDetails = (e) => {
    e.preventDefault();
    setTables(tables.map(t => t.id === selectedTable.id ? { ...t, label: editLabel, type: editType, capacity: editCapacity } : t));
    setSelectedTable(null);
  };

  return (
    <div className="h-screen w-full bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-amber-400 selection:text-black antialiased flex flex-col overflow-hidden">
      
      {/* FROZEN HEADER AREA */}
      <div className="flex-none p-4 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/30 border border-zinc-850 p-2 rounded-2xl backdrop-blur-xl">
          <div className="flex gap-1 bg-zinc-950 p-1.5 rounded-xl border border-zinc-850 w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('floor')} 
              className={`flex-1 sm:flex-none px-6 py-3 rounded-lg text-sm font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'floor' ? 'bg-zinc-900 text-amber-400 border border-zinc-800 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              🗺️ Floor
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`flex-1 sm:flex-none px-6 py-3 rounded-lg text-sm font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'analytics' ? 'bg-zinc-900 text-[#00f2fe] border border-zinc-800 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              📊 Analytics
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`flex-1 sm:flex-none px-6 py-3 rounded-lg text-sm font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-zinc-900 text-purple-400 border border-zinc-800 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
        <DashboardHeader name={restaurantName} isLive={isLive} onToggleLive={() => setIsLive(!isLive)} />
      </div>

      {/* INDEPENDENT SCROLLING CONTENT PORTAL */}
      <div className="flex-1 w-full overflow-y-auto px-4 sm:px-8 pb-12">
        <div className="w-full">
          {activeTab === 'floor' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start animate-fadeIn">
              <div className="space-y-6 lg:col-span-1">
                <ActivityLog reservations={reservations} />
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
                  onUpdateStatus={handleUpdateRoomStatus}
                  onUpdateName={handleUpdateRoomName}
                  onUpdateTableCount={handleUpdateRoomTableCount}
                  onRemoveRoom={handleRemoveRoom}
                  onAddRoom={handleAddRoom}
                  onAddTable={handleAllotNewTable}
                  onAdjustCapacity={handleAdjustTableCapacity}
                />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="w-full max-w-7xl mx-auto animate-fadeIn">
              <AnalyticsView 
                analyticsTimeframe={analyticsTimeframe} 
                setAnalyticsTimeframe={setAnalyticsTimeframe} 
                timeframeMetrics={timeframeMetrics} 
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="w-full max-w-7xl mx-auto animate-fadeIn">
              <SettingsPanel 
                uploadedMenu={uploadedMenu} 
                setUploadedMenu={setUploadedMenu} 
                accessibility={accessibility} 
                setAccessibility={setAccessibility} 
                allergenMeta={ALLERGEN_META} 
                allergens={allergens} 
                setAllergens={setAllergens} 
              />
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY CONTROL MODALS */}
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