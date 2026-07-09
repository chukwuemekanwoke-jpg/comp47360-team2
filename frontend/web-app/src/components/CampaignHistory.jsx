import { useGetCampaignHistoryQuery } from '../../../packages/shared/src/apiSlice.ts';

const STATUS_STYLE = {
  active: 'bg-table-offer/10 text-table-offer border-table-offer/30',
  completed: 'bg-table-primary/10 text-table-primary border-table-primary/30',
  cancelled: 'bg-table-danger/10 text-table-danger border-table-danger/30',
};

function formatDate(iso) {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CampaignHistory({ restaurantId }) {
  const { data, isLoading, isError, error } = useGetCampaignHistoryQuery(restaurantId, { skip: !restaurantId });
  const campaigns = data?.campaigns ?? [];

  return (
    <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-4">
      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-table-textMuted">
        Campaign History
      </h2>

      {isLoading ? (
        <p className="text-xs text-table-textSubtle font-mono">Loading campaign history...</p>
      ) : isError ? (
        <p role="alert" className="text-xs text-table-danger font-mono">
          {error?.data?.error?.message || 'Failed to load campaign history.'}
        </p>
      ) : campaigns.length === 0 ? (
        <p className="text-xs text-table-textSubtle font-mono">No flash deals triggered yet.</p>
      ) : (
        <ul className="divide-y divide-table-border">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="py-3 flex items-center justify-between gap-4 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <span className="text-table-text font-bold">{campaign.discountPercent}% off</span>
                <span className="text-table-textSubtle">{formatDate(campaign.createdAt)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-table-textMuted">
                  {campaign.tablesClaimed} / {campaign.tableQuota} claimed
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                    STATUS_STYLE[campaign.status] || 'bg-table-interactive text-table-textMuted border-table-border'
                  }`}
                >
                  {campaign.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
