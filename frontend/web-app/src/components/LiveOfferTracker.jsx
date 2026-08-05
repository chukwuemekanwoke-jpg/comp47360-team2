import { useEffect, useState } from 'react';
import { useGetCampaignOffersQuery } from '../../../packages/shared/src/apiSlice.ts';

const STATUS_STYLE = {
  pending: 'bg-table-warning/10 text-table-warning border-table-warning/20',
  accepted: 'bg-table-success/10 text-table-success border-table-success/20',
  expired: 'bg-table-textMuted/10 text-table-textMuted border-table-textMuted/20',
  revoked: 'bg-table-danger/10 text-table-danger border-table-danger/20',
};

function formatCountdown(seconds) {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function LiveOfferTracker({ restaurantId, campaignId }) {
  const { data, isLoading, isError, error } = useGetCampaignOffersQuery(
    { restaurantId, campaignId },
    { skip: !restaurantId || !campaignId, pollingInterval: 10000 }
  );
  const offers = data?.offers ?? [];

  // Ticks every second so pending offers' countdowns move smoothly between
  // the 10s server polls, mirroring the 900s TTL countdown from story 4.1.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!campaignId) return null;

  return (
    <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-4">
      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-table-textMuted">
        Live Offer Tracker
      </h2>

      {isLoading ? (
        <p className="text-xs text-table-textSubtle font-mono">Loading offers...</p>
      ) : isError ? (
        <p role="alert" className="text-xs text-table-danger font-mono">
          {error?.data?.error?.message || 'Failed to load offers.'}
        </p>
      ) : offers.length === 0 ? (
        <p className="text-xs text-table-textSubtle font-mono">No offers sent for this campaign yet.</p>
      ) : (
        <ul className="divide-y divide-table-border">
          {offers.map((offer) => {
            const expiresAtMs = new Date(offer.expiresAt).getTime();
            const liveSecondsRemaining = Math.max(0, Math.round((expiresAtMs - now) / 1000));

            return (
              <li key={offer.id} className="py-3 flex items-center justify-between gap-4 text-xs font-mono">
                <span className="text-table-text font-bold">{offer.userDisplayName}</span>
                <div className="flex items-center gap-3">
                  {offer.status === 'pending' && (
                    <span className="text-table-offer font-bold tracking-wider">
                      {formatCountdown(liveSecondsRemaining)}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                      STATUS_STYLE[offer.status] || 'bg-table-interactive text-table-textMuted border-table-border'
                    }`}
                  >
                    {offer.status}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
