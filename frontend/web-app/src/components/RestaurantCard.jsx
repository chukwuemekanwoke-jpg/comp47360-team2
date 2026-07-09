// eslint-disable-next-line no-unused-vars
import React from 'react';

export default function RestaurantCard({ restaurant }) {
  const { 
    name, 
    cuisine, 
    neighborhood, 
    distance, 
    hasLullDeal, 
    accessibility 
  } = restaurant;

  return (
    <div className="bg-[#1A1A1E] rounded-xl border border-zinc-800 overflow-hidden shadow-lg flex flex-col transition-transform hover:-translate-y-1 hover:shadow-2xl cursor-pointer h-full">
      
      {/* Top Half: Image Placeholder & Badges */}
      <div className="h-32 bg-[#2A2A30] relative w-full">
        {/* Conditional Lull Match Badge */}
        {hasLullDeal && (
          <div className="absolute top-3 right-3 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center shadow-sm backdrop-blur-sm">
            <span className="mr-1">⚡</span> Lull Match
          </div>
        )}
      </div>

      {/* Bottom Half: Restaurant Details */}
      <div className="p-5 flex flex-col flex-1 justify-between bg-[#151518]">
        
        {/* Header Row: Title/Location and Distance */}
        <div className="flex justify-between items-start w-full">
          <div>
            <h3 className="text-lg font-bold text-slate-100 leading-tight">
              {name}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {cuisine} • {neighborhood}
            </p>
          </div>
          
          {/* Distance Indicator */}
          <div className="text-xs font-mono font-bold text-[#33e1cc] shrink-0 ml-2 mt-1">
            {distance}
          </div>
        </div>

        {/* Accessibility Pills */}
        {accessibility && accessibility.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {accessibility.map((feature, index) => (
              <span 
                key={index} 
                className="px-2 py-1 bg-[#0A0A0A] border border-zinc-700 rounded text-[10px] text-zinc-300 font-medium flex items-center"
              >
                <span className="mr-1.5 text-zinc-500">✓</span>
                {feature}
              </span>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}