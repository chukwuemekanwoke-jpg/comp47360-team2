import React from 'react';

export default function SearchBar({ searchQuery, setSearchQuery, locationFallback, setLocationFallback }) {
  return (
    <div className="bg-[#12171E] border border-[#1F2936] rounded-xl p-4 flex flex-col md:flex-row gap-4 w-full">
      <div className="flex-1">
        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Search</label>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cuisine, restaurant, or dish..." 
          className="w-full bg-[#0B0F14] border border-[#1F2936] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#e29c36] transition-colors"
        />
      </div>
      
      <div className="flex-1 md:max-w-md">
        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Starting Point (Optional)</label>
        <input 
          type="text" 
          value={locationFallback}
          onChange={(e) => setLocationFallback(e.target.value)}
          placeholder="Neighborhood or cross-street..." 
          className="w-full bg-[#0B0F14] border border-[#1F2936] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#e29c36] transition-colors"
        />
      </div>

      <div className="flex items-end">
        <button className="w-full md:w-auto bg-[#e29c36] hover:bg-[#d18b25] text-slate-950 font-bold font-mono text-sm px-8 py-2.5 rounded-lg transition-colors">
          Find Tables
        </button>
      </div>
    </div>
  );
}