import React from 'react';

export default function AnalyticsView({ analyticsTimeframe, setAnalyticsTimeframe, timeframeMetrics }) {
  const metrics = timeframeMetrics || {
    covers: "142",
    growth: "▲ +12.4%",
    revenue: "$4,850.00",
    newDiners: "38%",
    returnDiners: "62%"
  };

  return (
    <div className="space-y-8 animate-fadeIn w-full mx-auto">
      
      {/* TIME-STRIP SELECTOR CONTROLS */}
      <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 w-fit">
        {['Today', 'Week', 'Month'].map((t) => (
          <button 
            key={t} 
            onClick={() => setAnalyticsTimeframe(t)} 
            className={`px-5 py-2.5 text-sm font-mono font-bold rounded-lg transition-all ${
              analyticsTimeframe === t ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            This {t}
          </button>
        ))}
      </div>

      {/* METRICS DISCOVERY ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80 shadow-xl">
          <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl lg:text-3xl font-serif font-bold text-emerald-400 mt-2">{metrics.revenue}</p>
        </div>
        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80 shadow-xl">
          <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Total Covers</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl lg:text-3xl font-serif font-bold text-zinc-100">{metrics.covers}</p>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">{metrics.growth}</span>
          </div>
        </div>
        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80 shadow-xl">
          <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">New Diners</p>
          <p className="text-2xl lg:text-3xl font-serif font-bold text-[#00f2fe] mt-2">{metrics.newDiners}</p>
        </div>
        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80 shadow-xl">
          <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Returning</p>
          <p className="text-2xl lg:text-3xl font-serif font-bold text-purple-400 mt-2">{metrics.returnDiners}</p>
        </div>
      </div>

      {/* GRAPH WORKSPACE GRID - COMPLETELY DYNAMIC FLUID SIZE */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch w-full">
        
        {/* COVERS OVER TIME */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between h-full">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h4 className="text-base font-serif font-bold text-zinc-100">Covers Over Time</h4>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00f2fe] bg-[#00f2fe]/10 px-2 py-0.5 rounded border border-[#00f2fe]/20">Live Feed</span>
          </div>
          
          <div className="w-full bg-zinc-950/60 rounded-xl border border-zinc-850 flex flex-col justify-between overflow-hidden aspect-[16/10] sm:aspect-[16/8] md:aspect-[21/9]">
            <div className="flex-1 w-full p-2 relative">
              <svg 
                className="w-full h-full" 
                viewBox="0 0 500 100" 
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M 0 90 Q 125 80, 250 50 T 500 20 L 500 100 L 0 100 Z" 
                  fill="url(#chartGrad)" 
                />
                <path 
                  d="M 0 90 Q 125 80, 250 50 T 500 20" 
                  fill="none" 
                  stroke="#00f2fe" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />
              </svg>
            </div>
            
            {/* Axis Labels */}
            <div className="flex justify-between items-center px-6 border-t border-zinc-800/60 py-2.5 bg-zinc-950/40">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <span key={day} className="text-[10px] font-mono font-bold text-zinc-400">{day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* REVENUE DISTRIBUTION */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between h-full">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h4 className="text-base font-serif font-bold text-zinc-100">Revenue Distribution</h4>
            <div className="flex gap-3 text-[10px] font-mono font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-[#00f2fe]">
                <span className="w-2 h-2 bg-[#00f2fe] rounded-full" /> Current
              </span>
              <span className="flex items-center gap-1.5 text-zinc-500">
                <span className="w-2 h-2 bg-zinc-700 rounded-full" /> Previous
              </span>
            </div>
          </div>
          
          <div className="w-full flex items-end justify-around bg-zinc-950/60 rounded-xl border border-zinc-850 p-4 pt-8 aspect-[16/10] sm:aspect-[16/8] md:aspect-[21/9]">
            {[
              { label: '6am-11am', curr: 30, prev: 20 },
              { label: '11am-4pm', curr: 75, prev: 60 },
              { label: '4pm-9pm', curr: 95, prev: 80 },
              { label: '9pm-12am', curr: 55, prev: 40 },
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center justify-end gap-2 flex-1 h-full max-w-[120px]">
                <div className="w-full flex justify-center items-end gap-1.5 h-full border-b border-zinc-800/60 pb-1">
                  <div className="w-3 sm:w-4 bg-zinc-700/80 rounded-t-sm transition-all duration-300 hover:bg-zinc-600" style={{ height: `${bar.prev}%` }} />
                  <div className="w-3 sm:w-4 bg-[#00f2fe] rounded-t-sm transition-all duration-300 hover:brightness-125 shadow-[0_0_8px_rgba(0,242,254,0.15)]" style={{ height: `${bar.curr}%` }} />
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-zinc-400 truncate w-full text-center">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}