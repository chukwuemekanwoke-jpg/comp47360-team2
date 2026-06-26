
export default function TableControl({ 
  selectedTable, setSelectedTable, overlayActiveTab, setOverlayActiveTab, discountPercent, setDiscountPercent, 
  timeWindow, setTimeWindow, handleBroadcastFlashDiscount, activeTableSchedule, toggleSlotStatus, 
  handleSaveTableDetails, editLabel, setEditLabel, editType, setEditType, editCapacity, setEditCapacity 
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#171E26] border border-[#232D3A] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-5 bg-[#0E1318] border-b border-[#232D3A] flex justify-between items-center">
          <div>
            <span className="text-[11.5px] font-mono tracking-widest text-[#e29c36] uppercase block">Yield Control Center</span>
            <h3 className="text-xl font-serif font-bold text-white">Table Asset Control: {selectedTable.label}</h3>
          </div>
          <button onClick={() => setSelectedTable(null)} className="w-8 h-8 rounded-full bg-[#11161D] border border-[#232D3A] text-slate-400 hover:text-white text-sm flex items-center justify-center transition-all">✕</button>
        </div>

        <div className="flex border-b border-[#232D3A] bg-[#0E1318] text-sm font-mono font-bold tracking-wider uppercase">
          <button onClick={() => setOverlayActiveTab('discount')} className={`flex-1 py-3 transition-all border-b-2 text-center ${overlayActiveTab === 'discount' ? 'border-[#e29c36] text-[#e29c36] bg-[#171E26]/40' : 'border-transparent text-slate-500'}`}>⚡ Flash Deal</button>
          <button onClick={() => setOverlayActiveTab('slots')} className={`flex-1 py-3 transition-all border-b-2 text-center ${overlayActiveTab === 'slots' ? 'border-[#e29c36] text-[#e29c36] bg-[#171E26]/40' : 'border-transparent text-slate-500'}`}>🕒 Shift Schedule</button>
          <button onClick={() => setOverlayActiveTab('settings')} className={`flex-1 py-3 transition-all border-b-2 text-center ${overlayActiveTab === 'settings' ? 'border-[#e29c36] text-[#e29c36] bg-[#171E26]/40' : 'border-transparent text-slate-500'}`}>⚙️ Setup</button>
        </div>

        <div className="p-6 bg-[#171E26]">
          {overlayActiveTab === 'discount' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11.5px] font-mono uppercase tracking-wider text-slate-400 block">Select Discount Tier</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 25].map((pct) => (
                    <button key={pct} type="button" onClick={() => setDiscountPercent(pct)} className={`py-3 rounded-xl border font-mono text-base font-bold text-center transition-all ${discountPercent === pct ? 'bg-[#e29c36] border-transparent text-slate-950 shadow-md' : 'bg-[#0E1318] border-[#232D3A] text-slate-400 hover:border-slate-600'}`}>{pct}%</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11.5px] font-mono uppercase tracking-wider text-slate-400 block">Claim Window</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map((mins) => (
                    <button key={mins} type="button" onClick={() => setTimeWindow(mins)} className={`py-2 rounded-xl border font-mono text-sm text-center transition-all ${timeWindow === mins ? 'bg-[#0E1318] border-[#e29c36] text-[#e29c36] shadow-sm' : 'bg-[#0E1318]/40 border-[#232D3A] text-slate-500'}`}>{mins} Mins</button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-[#232D3A]">
                <button type="button" onClick={handleBroadcastFlashDiscount} className="w-full py-3.5 bg-[#e29c36] text-slate-950 rounded-xl text-sm font-mono font-bold uppercase tracking-wider transition-all shadow-md hover:bg-amber-500">Broadcast Live Deal</button>
              </div>
            </div>
          )}

          {overlayActiveTab === 'slots' && (
            <div className="space-y-4">
              <div className="space-y-2 pt-2">
                {activeTableSchedule.map((slot, index) => (
                  <div key={index} className="flex justify-between items-center bg-[#0E1318] border border-[#232D3A] p-3 rounded-xl shadow-inner">
                    <span className="text-base font-mono font-bold text-white">{slot.time}</span>
                    <button type="button" onClick={() => toggleSlotStatus(slot.time)} className={`px-4 py-1.5 rounded-lg text-sm font-mono font-bold transition-all border ${slot.status === 'Available' ? 'bg-[#33e1cc]/10 border-[#33e1cc]/20 text-[#33e1cc] hover:bg-[#33e1cc]/20' : 'bg-[#11161D] border-[#232D3A] text-slate-500 hover:text-slate-400'}`}>{slot.status === 'Available' ? '✓ Open' : '✕ Blocked'}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overlayActiveTab === 'settings' && (
            <form onSubmit={handleSaveTableDetails} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11.5px] font-mono uppercase text-slate-500 block">Label Display</label>
                <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="w-full bg-[#0E1318] border border-[#232D3A] rounded-lg p-2 text-slate-200 focus:outline-none focus:border-[#33e1cc] font-mono shadow-inner text-base" />
              </div>
              <div className="space-y-1">
                <label className="text-[11.5px] font-mono uppercase text-slate-500 block">Layout Archetype</label>
                <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full bg-[#0E1318] border border-[#232D3A] rounded-lg p-2 text-slate-200 focus:outline-none focus:border-[#33e1cc] text-sm shadow-inner">
                  <option value="Round">Round Table</option>
                  <option value="Square">Square Table</option>
                  <option value="Rectangular">Rectangular Table</option>
                  <option value="Booth">Lounge Booth</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11.5px] font-mono uppercase text-slate-500 block">Seating Capacity</label>
                <div className="flex items-center border border-[#232D3A] bg-[#0E1318] rounded-lg overflow-hidden justify-between shadow-inner">
                  <button type="button" onClick={() => setEditCapacity(Math.max(1, editCapacity - 1))} className="px-3 py-1.5 font-bold text-slate-400 hover:bg-[#11161D] text-sm">-</button>
                  <span className="font-mono text-slate-200 text-sm font-bold">{editCapacity} Seats</span>
                  <button type="button" onClick={() => setEditCapacity(editCapacity + 1)} className="px-3 py-1.5 font-bold text-slate-400 hover:bg-[#11161D] text-sm">+</button>
                </div>
              </div>
              <div className="pt-4 border-t border-[#232D3A]">
                <button type="submit" className="w-full py-3 bg-[#33e1cc] text-slate-950 text-sm font-mono font-bold rounded-xl uppercase tracking-wider hover:bg-teal-300 transition-all shadow-md">Save Table</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}