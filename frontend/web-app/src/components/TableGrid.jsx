// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import RoomConfigPanel from './RoomConfigPanel';
import TableNode from './TableNode';

export default function TableGrid({ 
  tables, onOpen, activeZones, activeZone, setActiveZone, isConfigOpen, setIsConfigOpen,
  roomConfig, onUpdateName, onRemoveRoom, onAddRoom,
  onAddTable, onRemoveTable, onAdjustCapacity, onUpdateTableLabel, activeFlashDeals
}) {
  // Restored the missing state for the remove panel
  const [isRemovePanelOpen, setIsRemovePanelOpen] = useState(false);

  return (
    <div className="bg-[#11161D] border border-[#1F2936] rounded-xl p-6 pb-8 mb-12 space-y-6">
      <div className="flex justify-between items-center border-b border-[#1F2936] pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            📖 Room and Table Layout
          </h2>
          <p className="text-sm font-mono text-slate-400 mt-0.5">
            Select a table to issue flash discounts or alter labels.
          </p>
        </div>
        <button 
          onClick={() => setIsConfigOpen(!isConfigOpen)} 
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-xs font-mono font-bold uppercase tracking-wider text-slate-950 rounded-lg transition-all"
        >
          {isConfigOpen ? '✕ Close Room Configuration' : '🛠️ Configure Rooms'}
        </button>
      </div>

      {isConfigOpen && (
        <div className="border border-[#1F2936] rounded-xl p-4 bg-[#121820]">
          <RoomConfigPanel 
            roomConfig={roomConfig}
            onUpdateName={onUpdateName}
            onRemoveRoom={onRemoveRoom}
            onAddRoom={onAddRoom}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-[#1F2936] pb-4">
        {activeZones.map(zone => (
          <button
            key={zone}
            onClick={() => {
              setActiveZone(zone);
              setIsRemovePanelOpen(false);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeZone === zone 
                ? 'bg-[#33e1cc] text-slate-950 font-black' 
                : 'bg-[#121820] text-slate-400 hover:text-slate-200 border border-[#1F2936]'
            }`}
          >
            {zone}
          </button>
        ))}
        
        {/* Restored the dedicated Add / Remove buttons section */}
        <div className="flex gap-2 ml-2 pl-2 border-l border-[#1F2936]">
          <button
            onClick={() => onAddTable(activeZone)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-xs font-mono font-bold uppercase tracking-wider text-slate-950 rounded-lg transition-all"
          >
            ＋ Add Table
          </button>
          <button
            onClick={() => setIsRemovePanelOpen(!isRemovePanelOpen)}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
              isRemovePanelOpen 
                ? 'bg-[#1A222C] text-red-400 border border-red-500/30' 
                : 'bg-[#121820] text-slate-300 hover:text-white border border-[#2A3644] border-dashed'
            }`}
          >
            {isRemovePanelOpen ? '✕ Cancel' : '－ Remove Table'}
          </button>
        </div>
      </div>

      {/* Restored the conditional Remove Panel UI block */}
      {isRemovePanelOpen && (
        <div className="border border-red-500/20 rounded-xl p-4 bg-[#121820] mt-2 mb-6">
          <div className="flex justify-between items-center border-b border-[#1F2936] pb-3 mb-3">
            <h3 className="text-sm font-bold font-mono text-slate-100">
              Remove Tables in {activeZone}
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Data is deleted permanently on confirmation.
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {tables.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 col-span-full py-4 text-center">
                No tables available to remove in this zone.
              </p>
            ) : (
              tables.map(t => (
                <div key={t.id} className="flex justify-between items-center bg-[#0E1318] border border-[#1F2936] p-3 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-sm font-mono font-bold text-slate-200">{t.label}</span>
                    <span className="text-[11px] font-mono text-slate-500">{t.type} • {t.capacity} Chairs</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to permanently remove ${t.label}?`)) {
                        onRemoveTable(t.id);
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded bg-[#1A222C] text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map(table => (
          <TableNode 
            key={table.id}
            table={table}
            onOpen={onOpen}
            onUpdateTableLabel={onUpdateTableLabel}
            onAdjustCapacity={onAdjustCapacity}
            activeFlashDeals={activeFlashDeals}
          />
        ))}
        {tables.length === 0 && !isRemovePanelOpen && (
          <div className="col-span-full py-12 text-center text-slate-500 font-mono text-sm border border-dashed border-[#1F2936] rounded-xl">
            No physical configurations registered to this zone layout segment.
          </div>
        )}
      </div>
    </div>
  );
}