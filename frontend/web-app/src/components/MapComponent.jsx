import React from 'react';


export function MarkerPin({ onClick, isActive }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`w-4 h-4 rounded-full border-2 transition-all transform hover:scale-125 ${
        isActive 
          ? 'bg-amber-400 border-white scale-125 shadow-[0_0_12px_#fbbf24]' 
          : 'bg-emerald-400 border-zinc-900 shadow-[0_0_8px_#34d399]'
      }`}
    />
  );
}

export default function MapComponent({ children }) {
  return (
    <div className="w-full h-full min-h-[400px] bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-6 shadow-xl relative">
      {/* Background Grid Pattern to look like a canvas layout radar */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Visual Workspace Pin Wrapper */}
      <div className="z-10 flex gap-6 items-center justify-center bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800/80 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center space-y-2">
          <span className="text-3xl animate-pulse">📡</span>
          <h4 className="text-base font-serif font-bold text-white">Interactive Live Map Workspace</h4>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Geospatial tracking engine linked. Click a radar node pin below to map targeted walk-in incentives.
          </p>
          
          {/* Render the clickable marker children right here */}
          <div className="flex gap-4 pt-4 justify-center items-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}