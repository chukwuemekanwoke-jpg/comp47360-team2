// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';

export default function DashboardHeader({ name, isLive, onToggleLive }) {
  const [description, setDescription] = useState('');

  return (
    <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 py-2">
      {/* Left Column: Title Block */}
      <div className="flex flex-col items-start flex-shrink-0">
        <div className="text-[10px] font-mono font-bold tracking-widest text-[#e29c36] uppercase">
          TABLÉ SLATE // MERCHANT DESK
        </div>
        <h1 className="text-2xl font-black text-slate-100 mt-1 tracking-tight">
          {name}
        </h1>
      </div>

      {/* Center Column: Form-Fillable Restaurant Description */}
      <div className="flex-1 max-w-xl w-full px-4">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Click to add a brief restaurant description or tagline..."
          className="w-full bg-[#12171E] border border-[#1F2936] rounded-xl px-5 py-3 text-xs font-mono text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#e29c36] focus:ring-1 focus:ring-[#e29c36] transition-all text-center tracking-wide"
        />
      </div>

      {/* Right Column: Live Booking Engine Status Toggle */}
      <div className="flex items-center gap-4 bg-[#12171E] border border-[#1F2936] p-3 rounded-xl flex-shrink-0 min-w-[240px] justify-between">
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
            Live Booking Engine
          </span>
          <span className={`text-[11px] font-mono font-bold mt-0.5 ${isLive ? 'text-[#33e1cc]' : 'text-red-400'}`}>
            {isLive ? 'ACCEPTING APP BOOKINGS' : 'OFFLINE // PAUSED'}
          </span>
        </div>
        <button
          onClick={onToggleLive}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isLive ? 'bg-[#33e1cc]' : 'bg-slate-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-[#0B0F14] transition-transform ${
              isLive ? 'translate-x-6' : 'translate-x-1'
                }`}
          />
        </button>
      </div>
    </div>
  );
}