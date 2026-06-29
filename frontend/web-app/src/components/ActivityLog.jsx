import React from 'react';

const TRANSPORT_GLYPHS = {
  walking: '🚶‍♂️',
  driving: '🚗',
  transit: '🚇',
  cycling: '🚴‍♂️'
};

const STATUS_STYLING = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  confirmed: 'border-[#33e1cc]/30 bg-[#33e1cc]/10 text-[#33e1cc]',
  cancelled: 'border-red-500/30 bg-red-500/10 text-red-400',
  completed: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  no_show: 'border-purple-500/30 bg-purple-500/10 text-purple-400'
};

export default function ActivityLog({ reservations }) {
  return (
    <div className="w-full bg-[#11161D] border border-[#1F2936] rounded-xl p-5 shadow-xl flex flex-col h-[340px]">
      <div className="flex items-center justify-between border-b border-[#1F2936] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <h2 className="text-xs font-mono font-black uppercase tracking-wider text-slate-200">
            Live Intake Stream
          </h2>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#171E26] text-[#33e1cc] border border-[#33e1cc]/20 animate-pulse">
          Live Feed
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {reservations && reservations.length > 0 ? (
          reservations.map((booking) => {
            const transportIcon = TRANSPORT_GLYPHS[booking.transport_mode] || '⏱️';
            const statusClass = STATUS_STYLING[booking.status] || 'border-zinc-700 bg-zinc-800 text-zinc-300';
            
            // Format fallback times cleanly if absolute timestamps are sent down the pipe
            const displayTime = booking.time || (booking.created_at ? new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--');

            return (
              <div 
                key={booking.id} 
                className="bg-[#0B0F14] border border-[#1F2936] hover:border-zinc-700 rounded-xl p-3.5 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-200 truncate">
                      {booking.guest || booking.display_name || "Anonymous Guest"}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusClass} shrink-0`}>
                    {booking.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span>{transportIcon}</span>
                    <span>
                      {booking.eta_minutes !== undefined && booking.eta_minutes !== null
                        ? `ETA: ${booking.eta_minutes} mins`
                        : `Hold Checked`}
                    </span>
                  </div>
                  <span className="text-slate-500 font-bold">{displayTime}</span>
                </div>

                {booking.notes && (
                  <p className="text-[10px] font-mono text-amber-500/90 bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1 mt-1 leading-relaxed">
                    💬 {booking.notes}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1F2936] rounded-xl bg-[#0B0F14]/50">
            <span className="text-xl mb-1">📥</span>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              No active bookings found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}