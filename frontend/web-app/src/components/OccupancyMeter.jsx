// eslint-disable-next-line no-use-before-define
import React from 'react';

export default function OccupancyMeter({ occupancyData }) {
  return (
    <div className="bg-[#11161D] border border-[#1F2936] rounded-xl p-5">
      <div className="mb-5 border-b border-[#1F2936] pb-4">
        <h2 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2 uppercase tracking-wider">
          🍩 Restaurant Occupancy
        </h2>
        <p className="text-[11px] font-mono text-slate-400 mt-1">
          Real-time visual breakdown by zone.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {Object.entries(occupancyData).map(([zone, data]) => {
          const percentage = data.total > 0 ? (data.available / data.total) * 100 : 0;
          const radius = 22;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (percentage / 100) * circumference;

          let colorClass = "text-[#33e1cc]";
          if (data.total > 0 && data.available === 0) colorClass = "text-red-400";
          if (percentage === 100 && data.total > 0) colorClass = "text-[#e29c36]";

          return (
            <div key={zone} className="bg-[#0E1318] border border-[#1F2936] rounded-lg p-3 flex items-center justify-between hover:border-[#2A3644] transition-colors">
              <div className="flex flex-col">
                <span className="text-sm font-bold font-mono text-slate-100">{zone}</span>
                <span className="text-[11px] font-mono text-slate-500 mt-0.5">
                  <span className="text-slate-300 font-bold">{data.available}</span> / {data.total} Available
                </span>
              </div>
              
              <div className="relative flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24" cy="24" r={radius}
                    stroke="currentColor" strokeWidth="4" fill="transparent"
                    className="text-[#1F2936]"
                  />
                  <circle
                    cx="24" cy="24" r={radius}
                    stroke="currentColor" strokeWidth="4" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`${colorClass} transition-all duration-700 ease-in-out`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                   <span className="text-[9px] font-bold font-mono text-slate-200">
                     {Math.round(percentage)}%
                   </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {Object.keys(occupancyData).length === 0 && (
          <div className="py-6 text-center border border-[#1F2936] border-dashed rounded-lg">
            <p className="text-xs font-mono text-slate-500">No zones configured.</p>
          </div>
        )}
      </div>
    </div>
  );
}