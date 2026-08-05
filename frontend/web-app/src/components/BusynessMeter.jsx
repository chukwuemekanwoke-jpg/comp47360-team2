export default function BusynessMeter({ busynessScore }) {
  const hasScore = typeof busynessScore === 'number';
  const percentage = hasScore ? Math.round(busynessScore * 100) : 0;

  let colorClass = 'bg-table-primary';
  let glowVar = 'var(--table-primary)';
  let label = 'Quiet';
  if (percentage >= 70) {
    colorClass = 'bg-table-danger';
    glowVar = 'var(--table-danger)';
    label = 'Very Busy';
  } else if (percentage >= 40) {
    colorClass = 'bg-table-offer';
    glowVar = 'var(--table-offer)';
    label = 'Moderate';
  }

  return (
    <div className="bg-table-surface border border-table-border rounded-2xl p-6 shadow-xl w-full">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-table-text uppercase">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--table-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
            <path d="M3 3v18h18M7 15l4-6 3 3 5-8" />
          </svg>
          Predicted Busyness
        </h3>
        <p className="text-[11px] font-mono text-table-textSubtle mt-1">
          Live signal from the ML matching pipeline.
        </p>
      </div>

      {hasScore ? (
        <>
          <div
            className="w-full h-3 bg-table-canvas border border-table-border rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Predicted busyness"
          >
            <div
              className={`h-full ${colorClass} transition-all duration-700 ease-in-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-table-textSubtle">
              {label}
            </span>
            <span
              className="text-sm font-mono font-black text-table-text"
              style={{ textShadow: `0 0 14px color-mix(in srgb, ${glowVar} 45%, transparent)` }}
            >
              {percentage}%
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-table-textSubtle font-mono">No busyness signal available yet.</p>
      )}
    </div>
  );
}
