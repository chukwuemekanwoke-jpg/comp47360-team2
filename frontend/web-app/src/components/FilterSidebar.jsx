// eslint-disable-next-line no-unused-vars
import React from 'react';

export default function FilterSidebar() {
  return (
    <div className="w-full md:w-64 bg-[#12171E] border border-[#1F2936] rounded-xl p-5 flex flex-col gap-6 flex-shrink-0">
      
      {/* Standard Filters */}
      <div>
        <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider mb-3">Vibe & Cuisine</h3>
        <div className="space-y-2">
          {['Italian', 'Sushi', 'Speakeasy', 'Tapas'].map(filter => (
            <label key={filter} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-[#1F2936] bg-[#0B0F14] checked:bg-[#33e1cc] text-[#33e1cc] focus:ring-0 focus:ring-offset-0" />
              <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{filter}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-[#1F2936]" />

      {/* The Accessibility Moat */}
      <div>
        <h3 className="text-xs font-mono font-bold text-[#e29c36] uppercase tracking-wider mb-3 flex items-center gap-2">
           Accessibility
        </h3>
        <p className="text-[10px] text-slate-500 mb-3 leading-tight">Verified manually to ensure zero surprises on arrival.</p>
        <div className="space-y-2">
          {[
            { id: 'step-free', label: 'Step-Free Entry' },
            { id: 'restroom', label: 'Spacious Restroom' },
            { id: 'quiet', label: 'Low Noise Level' },
            { id: 'braille', label: 'Braille Menu Available' }
          ].map(acc => (
            <label key={acc.id} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-[#1F2936] bg-[#0B0F14] checked:bg-[#e29c36] text-[#e29c36] focus:ring-0 focus:ring-offset-0" />
              <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{acc.label}</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}