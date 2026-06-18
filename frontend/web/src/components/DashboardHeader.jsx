import React from 'react';

export default function DashboardHeader({ name, isLive, onToggleLive }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl gap-4 shadow-xl">
      <div>
        <span className="text-sm font-mono tracking-widest text-amber-400 uppercase">Tablé Slate // Merchant Desk</span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-1">{name}</h1>
      </div>
      <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
        <div className="text-right">
          <p className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Live Booking Engine</p>
          <p className={`text-sm font-semibold ${isLive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isLive ? 'ACCEPTING APP BOOKINGS' : 'OFFLINE / FULL CAPACITY'}
          </p>
        </div>
        <button 
          onClick={onToggleLive} 
          className={`w-14 h-8 flex items-center rounded-full p-1 transition-all duration-300 ${isLive ? 'bg-emerald-500 justify-end' : 'bg-zinc-700 justify-start'}`}
        >
          <div className="bg-black w-6 h-6 rounded-full shadow-md" />
        </button>
      </div>
    </div>
  );
}