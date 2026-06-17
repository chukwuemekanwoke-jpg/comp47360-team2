import React from 'react';

export default function TableControl({ 
  selectedTable, setSelectedTable, overlayActiveTab, setOverlayActiveTab, discountPercent, setDiscountPercent, 
  timeWindow, setTimeWindow, handleBroadcastFlashDiscount, activeTableSchedule, toggleSlotStatus, 
  handleSaveTableDetails, editLabel, setEditLabel, editType, setEditType, editCapacity, setEditCapacity 
}) {
  return (
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
  );
}