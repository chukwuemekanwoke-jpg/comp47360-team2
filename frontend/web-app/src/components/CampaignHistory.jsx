import { useGetCampaignHistoryQuery } from '../../../packages/shared/src/apiSlice.ts';

const STATUS_STYLE = {
  active: 'bg-[#e29c36]/10 text-[#e29c36] border-[#e29c36]/30',
  completed: 'bg-[#33e1cc]/10 text-[#33e1cc] border-[#33e1cc]/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
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
  const { data, isLoading } = useGetCampaignHistoryQuery(restaurantId, { skip: !restaurantId });
  const campaigns = data?.campaigns ?? [];

  return (
    <section className="bg-[#11161D] border border-[#1F2936] rounded-2xl p-6 space-y-4">
      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
        Campaign History
      </h2>

      {isLoading ? (
        <p className="text-xs text-slate-500 font-mono">Loading campaign history...</p>
      ) : campaigns.length === 0 ? (
        <p className="text-xs text-slate-500 font-mono">No flash deals triggered yet.</p>
      ) : (
        <ul className="divide-y divide-[#1F2936]">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="py-3 flex items-center justify-between gap-4 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <span className="text-slate-200 font-bold">{campaign.discountPercent}% off</span>
                <span className="text-slate-500">{formatDate(campaign.createdAt)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-400">
                  {campaign.tablesClaimed} / {campaign.tableQuota} claimed
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                    STATUS_STYLE[campaign.status] || 'bg-zinc-800 text-zinc-400 border-zinc-700'
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
