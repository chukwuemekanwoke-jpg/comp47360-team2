import RoomConfigPanel from './RoomConfigPanel';

export default function TableGrid({ 
  tables, onOpen, activeZones, activeZone, setActiveZone, isConfigOpen, setIsConfigOpen, roomConfig,
  onUpdateStatus, onUpdateName, onUpdateTableCount, onRemoveRoom,
  onAddRoom, onAddTable, onAdjustCapacity
}) {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-white">🗺️ Room and Table Layout</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Select a table node to issue flash discounts or alter labels.</p>
          </div>
          <button 
            onClick={() => setIsConfigOpen(!isConfigOpen)} 
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all border ${isConfigOpen ? 'bg-amber-400 text-black border-transparent' : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'}`}
          >
            {isConfigOpen ? '✕ Close Room Matrix' : '🛠️ Configure Rooms'}
          </button>
        </div>

        {isConfigOpen && (
          <div className="space-y-4">
            <button 
              onClick={onAddRoom} 
              className="text-xs font-mono font-bold uppercase text-amber-400 hover:text-amber-300 transition-colors"
            >
              ＋ Add New Room
            </button>
            <RoomConfigPanel 
              roomConfig={roomConfig}
              onUpdateStatus={onUpdateStatus}
              onUpdateName={onUpdateName}
              onUpdateTableCount={onUpdateTableCount}
              onRemoveRoom={onRemoveRoom}
              onClose={() => setIsConfigOpen(false)}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-zinc-850 pb-4">
          {activeZones.map((zone) => (
            <button
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all border ${activeZone === zone ? 'bg-zinc-100 text-black border-transparent shadow-md' : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300'}`}
            >
              {zone}
            </button>
          ))}
          <button 
            onClick={() => onAddTable(activeZone)} 
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
          >
            ＋ Add Table
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {tables.map((table) => {
            const isAvail = table.status === 'Available';
            const isRes = table.status === 'Reserved';
            return (
              <button
                key={table.id}
                onClick={() => onOpen(table)}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 relative group transition-all duration-200 ${isAvail ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-400' : isRes ? 'bg-amber-950/10 border-amber-500/20 hover:border-amber-400' : 'bg-zinc-950 border-zinc-850 opacity-40 hover:opacity-70'}`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="text-base font-mono font-bold text-zinc-200">{table.label}</span>
                  <span className={`w-2 h-2 rounded-full ${isAvail ? 'bg-emerald-400 animate-pulse' : isRes ? 'bg-amber-400' : 'bg-zinc-600'}`} />
                </div>
                <div className="flex justify-between items-end w-full text-zinc-500 font-mono text-[11px]">
                  <span>{table.type}</span>
                  
                  <div className="flex items-center gap-1">
                    <div 
                      onClick={(e) => { e.stopPropagation(); onAdjustCapacity(table.id, -1); }} 
                      className="text-zinc-400 hover:text-white cursor-pointer px-1 text-base leading-none"
                    >
                      －
                    </div>
                    {/* Updated Pax to Chair(s) here */}
                    <span className="text-zinc-400 font-bold">{table.capacity} {table.capacity === 1 ? 'Chair' : 'Chairs'}</span>
                    <div 
                      onClick={(e) => { e.stopPropagation(); onAdjustCapacity(table.id, 1); }} 
                      className="text-zinc-400 hover:text-white cursor-pointer px-1 text-base leading-none"
                    >
                      ＋
                    </div>
                  </div>

                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}