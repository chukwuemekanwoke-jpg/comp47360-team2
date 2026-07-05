export default function OccupancyMeter({ occupancyData }) {
  return (
    <div className="bg-[#11161D] border border-[#1F2936] rounded-xl p-6 shadow-xl w-full">
      {/* Header matching original layout */}
      <div className="mb-6">
        <h3 className="text-xs font-bold font-mono tracking-wider text-slate-200 flex items-center gap-2 uppercase">
           Restaurant Occupancy Overview
        </h3>
        <p className="text-[11px] font-mono text-slate-500 mt-1">
          Real-time visual of table availability.
        </p>
      </div>

      {/* Grid Container matching original layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(occupancyData).map(([zone, data]) => {
          const percentage = data.total > 0 ? (data.available / data.total) * 100 : 0;
          
          // Adjusted scale constants for the larger ring matching the original layout style
          const radius = 32;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (percentage / 100) * circumference;

          // Maintain color logic safely
          let strokeColorClass = "text-[#33e1cc]";
          if (data.total > 0 && data.available === 0) strokeColorClass = "text-red-400";
          if (percentage === 100 && data.total > 0) strokeColorClass = "text-[#e29c36]";

          return (
            <div 
              key={zone} 
              className="bg-[#12171E] border border-[#1F2936] rounded-xl p-4 flex flex-col items-center justify-between text-center min-h-[195px] shadow-sm hover:border-zinc-700 transition-colors"
            >
              {/* Zone Label at Top */}
              <span className="text-xs font-mono font-bold tracking-tight text-slate-300 w-full truncate px-1">
                {zone}
              </span>

              {/* Large Donut Graphic matching original layout */}
              <div className="relative w-24 h-24 flex items-center justify-center my-1">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  {/* Track ring */}
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-[#1A222C]"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`${strokeColorClass} transition-all duration-700 ease-in-out`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Fractional Numbers and Labels stacked at bottom */}
              <div className="w-full">
                <div className="text-lg font-mono font-black text-white tracking-wider">
                  {data.available} <span className="text-xs font-normal text-slate-600">/</span> {data.total}
                </div>
                <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                  Tables Available
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State Handler */}
      {Object.keys(occupancyData).length === 0 && (
        <div className="py-8 text-center border border-[#1F2936] border-dashed rounded-xl">
          <p className="text-xs font-mono text-slate-500">No zones configured.</p>
        </div>
      )}
    </div>
  );
}