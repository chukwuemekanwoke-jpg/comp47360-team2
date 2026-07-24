import { useGetCampaignHistoryQuery, useGetCampaignRevpashLiftQuery } from '../../../packages/shared/src/apiSlice.ts';

const STATUS_STYLE = {
  active: 'bg-table-offer/10 text-table-offer border-table-offer/30',
  completed: 'bg-table-primary/10 text-table-primary border-table-primary/30',
  cancelled: 'bg-table-danger/10 text-table-danger border-table-danger/30',
  expired: 'bg-table-interactive text-table-textMuted border-table-border',
};

function formatDate(iso) {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value) {
  if (typeof value !== 'number') return '—';
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function CampaignRevpashLiftBadge({ restaurantId, campaignId }) {
  const { data, isLoading, isError, error } = useGetCampaignRevpashLiftQuery(
    { restaurantId, campaignId },
    { skip: !restaurantId || !campaignId }
  );

  if (isLoading) {
    return <p className="text-[11px] text-table-textSubtle font-mono">Loading RevPASH lift...</p>;
  }

  if (isError) {
    return (
      <p className="text-[11px] text-table-textSubtle font-mono italic">
        {error?.status === 404
          ? 'RevPASH lift pending backend support (TABL-118).'
          : error?.data?.error?.message || 'Failed to load RevPASH lift.'}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
      <span className="text-table-textMuted">
        Organic {formatCurrency(data?.organicRevpash)} → Deal {formatCurrency(data?.dealRevpash)}
      </span>
      <span className={`font-bold ${data?.liftPercent >= 0 ? 'text-table-success' : 'text-table-danger'}`}>
        {data?.liftPercent >= 0 ? '+' : ''}{data?.liftPercent}% lift
      </span>
      {data?.offPeak && (
        <span className="px-2 py-0.5 rounded border border-table-border text-table-textSubtle uppercase tracking-wide">
          Off-peak
        </span>
      )}
    </div>
  );
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
            <li key={campaign.id} className="py-3 flex flex-col gap-2 text-xs font-mono">
              <div className="flex items-center justify-between gap-4">
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
              </div>
              <CampaignRevpashLiftBadge restaurantId={restaurantId} campaignId={campaign.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
