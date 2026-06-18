import React, { useState, useMemo } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import ActivityLog from '../components/ActivityLog';
import TableGrid from '../components/TableGrid';
import AnalyticsView from '../components/AnalyticsView';
import SettingsPanel from '../components/SettingsPanel';
import TableControl from '../components/TableControl';
import OccupancyMeter from '../components/OccupancyMeter';

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
    { id: 1, guest: 'Marcus Aurelius', time: '19:30', covers: 4, status: 'Checked In', notes: 'Anniversary celebration. Prefer window table.' },
    { id: 2, guest: 'Senecca Elder', time: '20:00', covers: 2, status: 'Seated', notes: 'Severe tree nut allergy registry alert.' },
    { id: 3, guest: 'Hypatia Alexandria', time: '20:45', covers: 6, status: 'Confirmed', notes: null }
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

  const handleUpdateRoomName = (id, newName) => {
    setRoomConfig(roomConfig.map(room => room.id === id ? { ...room, customLabel: newName } : room));
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
    const newRoomName = `Room ${nextId}`;
    setRoomConfig([
      ...roomConfig, 
      { id: nextId, defaultLabel: newRoomName, customLabel: '', tableCount: 0 }
    ]);
    setActiveZone(newRoomName);
  };

  const handleAllotNewTable = (roomName) => {
    const nextId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    const tableIndex = tables.filter(t => t.room === roomName).length + 1;
    setTables([
      ...tables, 
      { id: nextId, label: `Table-${tableIndex}`, type: 'Square', capacity: 4, status: 'Available', room: roomName }
    ]);
  };

  const handleRemoveTable = (tableId) => {
    setTables(prevTables => prevTables.filter(t => t.id !== tableId));
  };

  const handleAdjustTableCapacity = (tableId, change) => {
    setTables(prevTables => prevTables.map(t => 
      t.id === tableId ? { ...t, capacity: Math.max(1, t.capacity + change) } : t
    ));
  };

  const handleUpdateTableLabel = (tableId, newLabel) => {
    setTables(tables.map(t =>
      t.id === tableId ? { ...t, label: newLabel } : t
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
    const expiry = new Date(Date.now() + timeWindow * 60000);
    setActiveFlashDeals(prev => ({
      ...prev,
      [selectedTable.id]: expiry
    }));
    alert(`⚡ SUCCESS: Broadcasted an active ${discountPercent}% flash voucher valid for ${timeWindow} minutes.`);
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
    <div className="h-screen w-full bg-[#0B0F14] text-slate-100 font-sans antialiased flex flex-col overflow-hidden">
      <div className="flex-none p-4 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-1 bg-[#12171E] p-1 rounded-xl border border-[#1F2936]">
            <button 
              onClick={() => setActiveTab('floor')} 
              className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'floor' ? 'bg-[#e29c36] text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🗺️ Floor
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'analytics' ? 'bg-[#171E26] text-[#33e1cc]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📊 Analytics
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-[#171E26] text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
        <DashboardHeader name={restaurantName} isLive={isLive} onToggleLive={() => setIsLive(!isLive)} />
      </div>
      
      <div className="flex-1 w-full overflow-y-auto px-4 sm:px-8 pb-32">
        <div className="w-full">
          {activeTab === 'floor' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* Left Column: Activity Log & Occupancy Meter */}
              <div className="space-y-6 lg:col-span-1">
                <ActivityLog reservations={reservations} />
                <OccupancyMeter occupancyData={occupancyData} />
              </div>
              
              {/* Right Column: Table Grid Area */}
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
          {activeTab === 'analytics' && (
            <div className="w-full max-w-7xl mx-auto">
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
              />
            </div>
          )}
        </div>
      </div>
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