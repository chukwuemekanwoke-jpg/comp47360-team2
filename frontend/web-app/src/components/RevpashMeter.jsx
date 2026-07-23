import { useGetRevpashQuery } from '../../../packages/shared/src/apiSlice.ts';

function formatCurrency(value) {
  if (typeof value !== 'number') return '—';
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function RevpashMeter({ restaurantId }) {
  const { data, isLoading, isError, error } = useGetRevpashQuery(
    { restaurantId, window: 'today' },
    { skip: !restaurantId }
  );

  return (
    <div className="bg-table-surface border border-table-border rounded-2xl p-6 shadow-xl w-full">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-table-text uppercase">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--table-primary)" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5" aria-hidden="true">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          RevPASH
        </h3>
        <p className="text-[11px] font-mono text-table-textSubtle mt-1">
          Revenue per available seat-hour, today.
        </p>
      </div>

      {isLoading ? (
        <p className="text-xs text-table-textSubtle font-mono">Loading RevPASH...</p>
      ) : isError ? (
        <p role="alert" className="text-xs text-table-danger font-mono">
          {error?.data?.error?.message || 'Failed to load RevPASH.'}
        </p>
      ) : (
        <>
          <div
            className="text-2xl font-mono font-black text-table-primary tracking-wider"
            style={{ textShadow: '0 0 18px color-mix(in srgb, var(--table-primary) 40%, transparent)' }}
          >
            {formatCurrency(data?.revpash)}
            <span className="text-sm font-normal text-table-textSubtle"> /seat-hr</span>
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] font-mono uppercase tracking-widest text-table-textSubtle">
            <span>{formatCurrency(data?.revenue)} revenue</span>
            <span>{data?.availableSeatHours ?? '—'} seat-hrs</span>
          </div>
        </>
      )}
    </div>
  );
}
