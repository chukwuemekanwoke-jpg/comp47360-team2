import React, { useState } from 'react';
import MerchantRadar from '../components/MerchantRadar';
import DinerExplore from '../components/DinerExplore';

export default function ExploreView() {
  const [activePersona, setActivePersona] = useState('diner'); // 'diner' or 'merchant'

  return (
    <div className="flex flex-col w-full h-[calc(100vh-90px)] max-h-[calc(100vh-90px)] p-6 bg-[#0A0A0A] text-white font-sans overflow-hidden box-border">
      
      {/* Top Navigation Toggle */}
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-100">
            {activePersona === 'diner' ? 'Find a Table' : 'Merchant Radar'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {activePersona === 'diner' 
              ? 'Spontaneous reservations, verified accessibility.' 
              : 'Target nearby diners with real-time flash deals.'}
          </p>
        </div>
        
        {/* View Switcher */}
        <div className="bg-[#1C1C1E] p-1 rounded-xl border border-zinc-700 flex gap-1 shadow-sm">
          <button
            onClick={() => setActivePersona('diner')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
              activePersona === 'diner' ? 'bg-[#33e1cc] text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Diner View
          </button>
          <button
            onClick={() => setActivePersona('merchant')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
              activePersona === 'merchant' ? 'bg-emerald-400 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Merchant View
          </button>
        </div>
      </div>

      {/* Render Active Component */}
      <div className="flex-1 overflow-hidden">
        {activePersona === 'diner' ? <DinerExplore /> : <MerchantRadar />}
      </div>

    </div>
  );
}