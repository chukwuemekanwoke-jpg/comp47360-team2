/**
 * Cleanly displays database-synced reservations in a live feed view
 */
export default function ActivityLog({ reservations = [] }) {
  
  const getTransportIcon = (mode) => {
    switch (String(mode).toLowerCase()) {
      case 'driving': return '🚗';
      case 'transit': return '🚊';
      case 'walking': 
      default: return '🚶';
    }
  };

  const getStatusStyle = (status) => {
    if (String(status).toLowerCase() === 'pending') {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  };

  return (
    <div className="bg-[#11161D] border border-[#1F2936] rounded-2xl p-5 flex flex-col h-[340px] shadow-xl overflow-hidden">
      {/* Title renamed cleanly from 'Live Intake Stream' to match request criteria */}
      <div className="flex justify-between items-center pb-3 border-b border-[#1F2936] mb-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <span>📅</span> Active Bookings
        </h3>
        <span className="text-[10px] bg-[#171E26] border border-[#2D3748] px-2 py-0.5 rounded-full font-mono text-slate-400">
          {reservations.length} total
        </span>
      </div>

      {/* Main Reservation Data Node Grid Matrix List Container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {reservations.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-center font-mono opacity-40 py-12">
            <span className="text-xl mb-1">📥</span>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">No active covers recorded</p>
          </div>
        ) : (
          reservations.map((booking) => (
            <div 
              key={booking.id || Math.random()} 
              className="p-3 bg-[#171E26] border border-[#222D3D] rounded-xl hover:border-slate-700 transition-all space-y-2 group"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="truncate">
                  <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-[#e29c36] transition-colors">
                    {booking.guest}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                    <span className="text-[#3b82f6] font-bold">{booking.time}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      {getTransportIcon(booking.transport_mode)} ETA {booking.eta_minutes}m
                    </span>
                  </div>
                </div>

                <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-bold shrink-0 ${getStatusStyle(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              {booking.notes && (
                <div className="text-[10px] bg-[#0E1319] text-slate-400 px-2.5 py-1.5 rounded-lg border border-[#1B232E] italic leading-relaxed">
                  📢 {booking.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}