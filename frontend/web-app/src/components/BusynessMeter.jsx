export default function BusynessMeter({ busynessScore }) {
  const hasScore = typeof busynessScore === 'number';
  const percentage = hasScore ? Math.round(busynessScore * 100) : 0;

  let colorClass = 'bg-table-primary';
  let label = 'Quiet';
  if (percentage >= 70) {
    colorClass = 'bg-table-danger';
    label = 'Very Busy';
  } else if (percentage >= 40) {
    colorClass = 'bg-table-offer';
    label = 'Moderate';
  }

  return (
    <div className="bg-table-surface border border-table-border rounded-2xl p-6 shadow-xl w-full">
      <div className="mb-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-table-text uppercase">
          Predicted Busyness
        </h3>
        <p className="text-[11px] font-mono text-table-textSubtle mt-1">
          Live signal from the ML matching pipeline.
        </p>
      </div>

      {hasScore ? (
        <>
          <div className="w-full h-3 bg-table-canvas border border-table-border rounded-full overflow-hidden">
            <div
              className={`h-full ${colorClass} transition-all duration-700 ease-in-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-table-textSubtle">
              {label}
            </span>
            <span className="text-sm font-mono font-black text-table-text">{percentage}%</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-table-textSubtle font-mono">No busyness signal available yet.</p>
      )}
    </div>
  );
}
