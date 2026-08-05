export default function OccupancyMeter({ available, capacity }) {
  const total = capacity ?? 0;
  const percentage = total > 0 ? (available / total) * 100 : 0;

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColorClass = 'text-table-primary';
  let glowVar = 'var(--table-primary)';
  if (total > 0 && available === 0) {
    strokeColorClass = 'text-table-danger';
    glowVar = 'var(--table-danger)';
  }
  if (percentage === 100 && total > 0) {
    strokeColorClass = 'text-table-offer';
    glowVar = 'var(--table-offer)';
  }

  return (
    <div className="bg-table-surface border border-table-border rounded-2xl p-6 shadow-xl w-full">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-table-text uppercase">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--table-primary)" strokeWidth="2" className="w-3.5 h-3.5" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Table Occupancy
        </h3>
        <p className="text-[11px] font-mono text-table-textSubtle mt-1">
          Live availability from the venue record.
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg aria-hidden="true" className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-table-interactive"
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
              style={{ filter: 'drop-shadow(0 0 5px currentColor)' }}
            />
          </svg>
        </div>

        <div>
          <div
            className="text-2xl font-mono font-black text-table-text tracking-wider"
            style={{ textShadow: `0 0 18px color-mix(in srgb, ${glowVar} 40%, transparent)` }}
          >
            {available} <span className="text-sm font-normal text-table-textSubtle">/</span> {total}
          </div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-table-textSubtle mt-0.5">
            Tables Available
          </div>
        </div>
      </div>
    </div>
  );
}
