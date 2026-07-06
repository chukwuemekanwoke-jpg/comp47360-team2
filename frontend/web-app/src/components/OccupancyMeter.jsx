export default function OccupancyMeter({ available, capacity }) {
  const total = capacity ?? 0;
  const percentage = total > 0 ? (available / total) * 100 : 0;

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColorClass = 'text-[#33e1cc]';
  if (total > 0 && available === 0) strokeColorClass = 'text-red-400';
  if (percentage === 100 && total > 0) strokeColorClass = 'text-[#e29c36]';

  return (
    <div className="bg-[#11161D] border border-[#1F2936] rounded-2xl p-6 shadow-xl w-full">
      <div className="mb-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-slate-200 uppercase">
          Table Occupancy
        </h3>
        <p className="text-[11px] font-mono text-slate-500 mt-1">
          Live availability from the venue record.
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-[#1A222C]"
            />
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

        <div>
          <div className="text-2xl font-mono font-black text-white tracking-wider">
            {available} <span className="text-sm font-normal text-slate-600">/</span> {total}
          </div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 mt-0.5">
            Tables Available
          </div>
        </div>
      </div>
    </div>
  );
}
