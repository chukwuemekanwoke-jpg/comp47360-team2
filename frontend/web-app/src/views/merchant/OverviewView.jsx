import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import BusynessMeter from '../../components/BusynessMeter';
import RevpashMeter from '../../components/RevpashMeter';
import OccupancyMeter from '../../components/OccupancyMeter';
import CampaignHistory from '../../components/CampaignHistory';
import LiveOfferTracker from '../../components/LiveOfferTracker';
import BookingsList from '../../components/BookingsList';
import {
  useGetActiveCampaignQuery,
  useCreateCampaignMutation,
  useCancelCampaignMutation,
} from '../../../../packages/shared/src/apiSlice.ts';

const MIN_DISCOUNT = 10;
const MAX_DISCOUNT = 50;
const MIN_TTL_MINUTES = 10;
const MAX_TTL_MINUTES = 60;
const DEFAULT_TTL_MINUTES = 15;

export default function OverviewView() {
  const { restaurantId, restaurant } = useOutletContext();

  const { data: activeCampaignData, isFetching: isCampaignLoading } = useGetActiveCampaignQuery(restaurantId, {
    skip: !restaurantId,
    pollingInterval: 5000,
  });
  const activeCampaign = activeCampaignData?.campaign ?? null;

  const [createCampaign, { isLoading: isCreatingCampaign }] = useCreateCampaignMutation();
  const [cancelCampaign, { isLoading: isCancellingCampaign }] = useCancelCampaignMutation();

  const [tableQuota, setTableQuota] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(15);
  const [ttlMinutes, setTtlMinutes] = useState(DEFAULT_TTL_MINUTES);
  const [formError, setFormError] = useState('');
  const [cancelError, setCancelError] = useState('');

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setFormError('');

    if (discountPercent < MIN_DISCOUNT || discountPercent > MAX_DISCOUNT) {
      setFormError(`Discount must be between ${MIN_DISCOUNT}% and ${MAX_DISCOUNT}%`);
      return;
    }

    if (!Number.isInteger(tableQuota) || tableQuota <= 0) {
      setFormError('Table quota must be a positive whole number');
      return;
    }

    if (restaurant?.capacity != null && tableQuota > restaurant.capacity) {
      setFormError(`Cannot release more than ${restaurant.capacity} tables (restaurant capacity)`);
      return;
    }

    if (!Number.isInteger(ttlMinutes) || ttlMinutes < MIN_TTL_MINUTES || ttlMinutes > MAX_TTL_MINUTES) {
      setFormError(`Deal duration must be between ${MIN_TTL_MINUTES} and ${MAX_TTL_MINUTES} minutes`);
      return;
    }

    try {
      await createCampaign({ restaurantId, tableQuota, discountPercent, ttlMinutes }).unwrap();
    } catch (err) {
      setFormError(err?.data?.error?.message || 'Failed to create campaign');
    }
  };

  const handleCancelCampaign = async () => {
    setCancelError('');
    try {
      await cancelCampaign({ restaurantId, campaignId: activeCampaign.id }).unwrap();
    } catch (err) {
      // 404 means the route doesn't exist yet, not a real error from the
      // request itself — the generic Express "Route not found" message
      // isn't useful to show.
      setCancelError(
        err?.status === 404
          ? 'Could not cancel yet — pending backend support.'
          : err?.data?.error?.message || 'Failed to cancel campaign.'
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="space-y-6">
        {restaurant && (
          <>
            <OccupancyMeter available={restaurant.availableTableCount} capacity={restaurant.capacity} />
            <BusynessMeter busynessScore={restaurant.busynessScore} />
            <RevpashMeter restaurantId={restaurantId} />
          </>
        )}
        <BookingsList restaurantId={restaurantId} />
      </div>

      <div className="space-y-6">
        <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-table-textMuted mb-3">
              Active Lull-Mitigation Campaign
            </h2>
            {/* aria-live: this section updates on its own via 5s polling
                (e.g. active -> completed), not just user action, so screen
                reader users need to be notified without navigating here. */}
            <div aria-live="polite">
              {isCampaignLoading && !activeCampaign ? (
                <p className="text-xs text-table-textSubtle font-mono">Checking for an active campaign...</p>
              ) : activeCampaign ? (
                <div className="space-y-4">
                  <dl className="grid grid-cols-2 gap-y-3 text-sm font-mono">
                    <dt className="text-table-textSubtle">Status</dt>
                    <dd className="text-table-offer font-bold uppercase">{activeCampaign.status}</dd>
                    <dt className="text-table-textSubtle">Discount</dt>
                    <dd className="text-table-text">{activeCampaign.discountPercent}%</dd>
                    <dt className="text-table-textSubtle">Tables Claimed</dt>
                    <dd className="text-table-text">{activeCampaign.tablesClaimed} / {activeCampaign.tableQuota}</dd>
                    <dt className="text-table-textSubtle">Time Left</dt>
                    <dd className="text-table-text">
                      {typeof activeCampaign.secondsRemaining === 'number'
                        ? `${Math.ceil(activeCampaign.secondsRemaining / 60)} min`
                        : '—'}
                    </dd>
                  </dl>

                  {cancelError && (
                    <div role="alert" className="p-2.5 bg-table-danger/10 border border-table-danger/30 text-table-danger rounded-lg text-[11px] font-mono">
                      {cancelError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCancelCampaign}
                    disabled={isCancellingCampaign}
                    className="w-full py-2.5 bg-transparent border border-table-danger/40 text-table-danger hover:bg-table-danger/10 font-bold font-mono text-xs rounded-xl transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancellingCampaign ? 'Cancelling...' : 'Cancel Campaign'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-table-textSubtle font-mono">No active campaign right now.</p>
              )}
            </div>
          </div>

          {/* noValidate: native browser validation would block onSubmit
              before our own styled, consistent error messages ever run —
              see LoginView for the same reasoning. Matters here since the
              tableQuota field now carries a real max constraint. */}
          <form onSubmit={handleCreateCampaign} noValidate className="space-y-4 border-t border-table-border pt-6">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-table-textMuted">
              Trigger Flash Deal
            </h3>

            {formError && (
              <div role="alert" className="p-3 bg-table-danger/10 border border-table-danger/30 text-table-danger rounded-lg text-xs font-mono">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tableQuota" className="block text-[10px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5">
                  Tables to Release
                </label>
                <input
                  id="tableQuota"
                  type="number"
                  min={1}
                  max={restaurant?.capacity ?? undefined}
                  value={tableQuota}
                  onChange={(e) => setTableQuota(Number(e.target.value))}
                  disabled={!!activeCampaign || isCreatingCampaign}
                  className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-2.5 text-sm text-table-text focus:outline-none focus:border-table-offer transition-colors disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="discountPercent" className="block text-[10px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5">
                  Discount % ({MIN_DISCOUNT}-{MAX_DISCOUNT})
                </label>
                <input
                  id="discountPercent"
                  type="number"
                  min={MIN_DISCOUNT}
                  max={MAX_DISCOUNT}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  disabled={!!activeCampaign || isCreatingCampaign}
                  className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-2.5 text-sm text-table-text focus:outline-none focus:border-table-offer transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ttlMinutes" className="block text-[10px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5">
                Deal Duration (minutes, {MIN_TTL_MINUTES}-{MAX_TTL_MINUTES})
              </label>
              <input
                id="ttlMinutes"
                type="number"
                min={MIN_TTL_MINUTES}
                max={MAX_TTL_MINUTES}
                value={ttlMinutes}
                onChange={(e) => setTtlMinutes(Number(e.target.value))}
                disabled={!!activeCampaign || isCreatingCampaign}
                className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-2.5 text-sm text-table-text focus:outline-none focus:border-table-offer transition-colors disabled:opacity-50"
              />
              <p className="mt-1.5 text-[10px] font-mono text-table-textSubtle">
                Applies to both the campaign and each flash-deal offer.
              </p>
            </div>

            <button
              type="submit"
              disabled={!!activeCampaign || isCreatingCampaign}
              className="w-full py-3 bg-table-offer hover:bg-table-offer/90 text-table-canvas font-bold font-mono text-xs rounded-xl transition-all uppercase tracking-wider shadow-lg shadow-table-offer/40 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {activeCampaign
                ? 'Campaign Already Active'
                : isCreatingCampaign
                  ? 'Launching...'
                  : 'Launch Flash Deal'}
            </button>
          </form>
        </section>

        {activeCampaign && (
          <LiveOfferTracker restaurantId={restaurantId} campaignId={activeCampaign.id} />
        )}

        <CampaignHistory restaurantId={restaurantId} />
      </div>
    </div>
  );
}
