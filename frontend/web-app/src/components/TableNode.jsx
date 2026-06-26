import React, { useState, useEffect } from 'react';

export default function TableNode({ 
  table, onOpen, onAdjustCapacity, activeFlashDeals 
}) {
  const isRes = table.status === 'Reserved';
  const dealExpiry = activeFlashDeals[table.id];
  const hasActiveDeal = dealExpiry && new Date() < dealExpiry;

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!hasActiveDeal) return;

    const updateCountdown = () => {
      const diffMs = dealExpiry - new Date();
      if (diffMs <= 0) {
        setTimeLeft('0m left');
        return;
      }
      const mins = Math.ceil(diffMs / 60000);
      setTimeLeft(`${mins}m left`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 15000);
    return () => clearInterval(interval);
  }, [dealExpiry, hasActiveDeal]);

  // Keep active flash deals looking like Table 2 (amber theme).
  // Everything else defaults to Table 1 (teal theme).
  const borderColor = hasActiveDeal ? 'border-amber-500' : 'border-[#33e1cc]';
  const dotColor = hasActiveDeal ? 'bg-amber-500' : 'bg-[#33e1cc]';

  const reservationTime = table.reservedTime || "20:00"; 

  return (
    <div
      onClick={() => onOpen(table)}
      className={`bg-[#0E1318] rounded-xl border p-4 flex flex-col justify-between h-36 relative group transition-all duration-200 cursor-pointer ${borderColor}`}
    >
      {/* Upper Title Area - Scaled up by 20% */}
      <div className="flex justify-between items-center w-full">
        <span className="text-lg font-mono font-bold text-slate-200">
          {table.label}
        </span>
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      </div>

      {/* Dynamic Status Conditions */}
      <div className="my-1 min-h-[20px]">
        {isRes ? (
          <p className="text-xs font-mono text-amber-400 font-medium">
            ⚠️ Reserved for {reservationTime}
          </p>
        ) : hasActiveDeal ? (
          <p className="text-xs font-mono text-amber-500 font-medium animate-pulse">
            ⚡ Flash Deal active until {timeLeft}
          </p>
        ) : null}
      </div>

      {/* Parameter Adjustment Row - Scaled up text and triggers */}
      <div className="flex justify-between items-center w-full mt-auto">
        <span className="text-xs font-mono text-slate-400 lowercase">
          {table.type}
        </span>

        <div className="flex items-center space-x-1.5 text-slate-300 font-mono text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdjustCapacity(table.id, -1);
            }}
            className="w-5 h-5 rounded hover:bg-[#1C242F] hover:text-white flex items-center justify-center transition-colors font-bold text-sm"
          >
            -
          </button>
          
          <span className="text-slate-100 bg-[#121820] border border-[#1F2936] px-2.5 py-1 rounded text-xs font-bold min-w-[68px] text-center">
            {table.capacity} {table.capacity === 1 ? 'Chair' : 'Chairs'}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdjustCapacity(table.id, 1);
            }}
            className="w-5 h-5 rounded hover:bg-[#1C242F] hover:text-white flex items-center justify-center transition-colors font-bold text-sm"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}