import React from 'react';

export default function RoomConfigPanel({ 
  roomConfig, 
  onUpdateName, 
  onRemoveRoom,
  onAddRoom 
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
          🎛️ Rooms and Tables
        </h3>
        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
          Dynamically add zones or customize labels.
        </p>
      </div>

      <div className="space-y-3 max-w-2xl">
        {roomConfig.map((room) => (
          <div 
            key={room.id} 
            className="flex items-center justify-between p-3 rounded-xl border bg-[#0B0F14] border-[#1F2936] transition-all"
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Toggle switch removed, layout adjusted to fill space */}
              <div className="flex flex-col flex-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-0.5">
                  {room.defaultLabel}
                </span>
                <input 
                  type="text"
                  value={room.customLabel || ''}
                  onChange={(e) => onUpdateName(room.id, e.target.value)}
                  className="bg-transparent border-none text-sm font-bold font-mono text-slate-100 focus:outline-none focus:ring-0 p-0 w-full placeholder-slate-600"
                  placeholder={room.defaultLabel}
                />
              </div>
            </div>

            <div className="flex items-center pl-4 ml-4 border-l border-[#1F2936]">
              <button 
                onClick={() => onRemoveRoom(room.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-[#1A222C] hover:text-red-400 transition-all text-xs border border-slate-700 hover:border-red-500/30"
                title="Remove Room"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        
        {roomConfig.length === 0 && (
          <p className="text-xs font-mono text-slate-500 py-4 text-center border border-dashed border-[#1F2936] rounded-xl">
            No rooms configured. Use the button below to add a zone.
          </p>
        )}

        {/* New Add Room Button */}
        <div className="pt-2">
          <button
            onClick={onAddRoom}
            className="px-4 py-2.5 bg-[#12171E] hover:bg-[#1A222C] text-slate-300 border border-[#1F2936] rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors w-full flex items-center justify-center gap-2"
          >
            <span className="text-amber-500 text-lg leading-none">+</span> Add New Room
          </button>
        </div>
      </div>
    </div>
  );
}