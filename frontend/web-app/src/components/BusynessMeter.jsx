export default function BusynessMeter({ busynessScore }) {
  const hasScore = typeof busynessScore === 'number';
  const percentage = hasScore ? Math.round(busynessScore * 100) : 0;

  let colorClass = 'bg-[#33e1cc]';
  let label = 'Quiet';
  if (percentage >= 70) {
    colorClass = 'bg-red-400';
    label = 'Very Busy';
  } else if (percentage >= 40) {
    colorClass = 'bg-[#e29c36]';
    label = 'Moderate';
  }

  return (
    <div className="bg-[#11161D] border border-[#1F2936] rounded-2xl p-6 shadow-xl w-full">
      <div className="mb-4">
        <h3 className="text-xs font-bold font-mono tracking-wider text-slate-200 uppercase">
          Predicted Busyness
        </h3>
        <p className="text-[11px] font-mono text-slate-500 mt-1">
          Live signal from the ML matching pipeline.
        </p>
      </div>

      {hasScore ? (
        <>
          <div className="w-full h-3 bg-[#0B0F14] border border-[#1F2936] rounded-full overflow-hidden">
            <div
              className={`h-full ${colorClass} transition-all duration-700 ease-in-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
              {label}
            </span>
            <span className="text-sm font-mono font-black text-slate-200">{percentage}%</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-500 font-mono">No busyness signal available yet.</p>
      )}
    </div>
  );
}
