import React from 'react';

export default function RoomConfigPanel({ roomConfig, onUpdateStatus, onUpdateName, onUpdateTableCount, onRemoveRoom, onClose }) {
  return (
    <div className="p-5 bg-zinc-950/60 border border-zinc-850 rounded-xl space-y-6 animate-fadeIn">
      <div className="flex justify-between items-start border-b border-zinc-850 pb-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-white">🏢 Rooms and Tables</h3>
          <p className="text-sm text-zinc-500 mt-0.5">Dynamically add zones, toggle layout views, or customize table capacity scales (1-10).</p>
        </div>
        <button onClick={onClose} className="px-3 py-1.5 bg-zinc-900/40 border border-zinc-850 hover:text-zinc-200 text-zinc-400 text-sm font-mono rounded-lg transition-all">✕ Dismiss</button>
      </div>
      <div className="space-y-4">
        {roomConfig.map((room) => (
          <div key={room.id} className={`p-4 rounded-xl border transition-all ${room.isActive ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-900/10 border-zinc-900 opacity-50'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(room.id)}
                  className={`w-10 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${room.isActive ? 'bg-amber-400 flex justify-end' : 'bg-zinc-800 flex justify-start'}`}
                >
                  <div className="bg-black w-5 h-5 rounded-full" />
                </button>
                <div>
                  <span className="text-sm font-mono text-zinc-500 block">{room.defaultLabel}</span>
                  <input 
                    type="text" 
                    value={room.customLabel} 
                    disabled={!room.isActive}
                    onChange={(e) => onUpdateName(room.id, e.target.value)}
                    className="bg-transparent text-white text-base font-semibold border-b border-transparent hover:border-zinc-700 focus:border-amber-400 focus:outline-none py-0.5 transition-all w-36 sm:w-48 disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 self-end sm:self-auto">
                <span className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Tables</span>
                <div className={`flex items-center border rounded-lg overflow-hidden mr-2 ${room.isActive ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-900 bg-zinc-950 opacity-40'}`}>
                  <button type="button" disabled={!room.isActive || room.tableCount <= 1} onClick={() => onUpdateTableCount(room.id, -1)} className="px-3 py-1.5 font-bold text-zinc-400 hover:bg-zinc-950 disabled:opacity-50 text-sm">-</button>
                  <span className="font-mono text-white text-sm font-bold px-3 min-w-[32px] text-center">{room.tableCount}</span>
                  <button type="button" disabled={!room.isActive || room.tableCount >= 10} onClick={() => onUpdateTableCount(room.id, 1)} className="px-3 py-1.5 font-bold text-zinc-400 hover:bg-zinc-950 disabled:opacity-50 text-sm">+</button>
                </div>
                <button type="button" onClick={() => onRemoveRoom(room.id)} className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-850 hover:border-rose-500/50 text-zinc-500 hover:text-rose-400 flex items-center justify-center transition-all text-sm">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}