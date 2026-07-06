import { useState } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import OccupancyMeter from '../components/OccupancyMeter';
import AccessibilityPanel from '../components/AccessibilityPanel';
import BusynessMeter from '../components/BusynessMeter';
import CampaignHistory from '../components/CampaignHistory';
import BookingsList from '../components/BookingsList';
import { useAuth } from '../context/AuthContext';

import {
  useGetRestaurantDetailQuery,
  useGetActiveCampaignQuery,
  useCreateCampaignMutation,
  useCancelCampaignMutation,
} from '../../../packages/shared/src/apiSlice.ts';

const MIN_DISCOUNT = 10;
const MAX_DISCOUNT = 50;

export default function MerchantDashboard() {
  const { restaurantId, logout } = useAuth() || {};

  const { data: restaurant, isLoading: isRestaurantLoading } = useGetRestaurantDetailQuery(restaurantId, {
    skip: !restaurantId,
  });

  const { data: activeCampaignData, isFetching: isCampaignLoading } = useGetActiveCampaignQuery(restaurantId, {
    skip: !restaurantId,
    pollingInterval: 5000,
  });
  const activeCampaign = activeCampaignData?.campaign ?? null;

  const [createCampaign, { isLoading: isCreatingCampaign }] = useCreateCampaignMutation();
  const [cancelCampaign, { isLoading: isCancellingCampaign }] = useCancelCampaignMutation();

  const [tableQuota, setTableQuota] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(15);
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

    try {
      await createCampaign({ restaurantId, tableQuota, discountPercent }).unwrap();
    } catch (err) {
      setFormError(err?.data?.error?.message || 'Failed to create campaign');
    }
  };

  const handleCancelCampaign = async () => {
    setCancelError('');
    try {
      await cancelCampaign({ restaurantId, campaignId: activeCampaign.id }).unwrap();
    } catch (err) {
      // Expected to 404 until the backend adds the cancel route.
      setCancelError(err?.data?.error?.message || 'Could not cancel yet — pending backend support.');
    }
  };

  if (!restaurantId) {
    return (
      <div className="h-screen w-full bg-table-canvas flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-table-offer border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs tracking-widest text-table-textMuted uppercase">Validating merchant workspace credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-table-canvas text-table-text font-sans antialiased">
      <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-end">
          <button
            onClick={logout}
            className="px-4 py-2 bg-table-surface border border-table-danger/40 text-table-danger hover:bg-table-danger/10 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-colors"
          >
            Logout
          </button>
        </div>

        <DashboardHeader name={isRestaurantLoading ? 'Loading...' : restaurant?.name ?? 'Restaurant Control Panel'} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Restaurant details */}
          <div className="space-y-6">
            <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-table-textMuted">
                Venue Details
              </h2>
              {restaurant ? (
                <dl className="grid grid-cols-2 gap-y-3 text-sm font-mono">
                  <dt className="text-table-textSubtle">Cuisine</dt>
                  <dd className="text-table-text">{restaurant.cuisine}</dd>
                  <dt className="text-table-textSubtle">Neighborhood</dt>
                  <dd className="text-table-text">{restaurant.neighborhood}</dd>
                  <dt className="text-table-textSubtle">Reservation Hold Window</dt>
                  <dd className="text-table-text">{restaurant.holdWindowMinutes} min</dd>
                </dl>
              ) : (
                <p className="text-xs text-table-textSubtle font-mono">Loading venue details...</p>
              )}
            </section>

            {restaurant && (
              <>
                <OccupancyMeter available={restaurant.availableTableCount} capacity={restaurant.capacity} />
                <BusynessMeter busynessScore={restaurant.busynessScore} />
                <AccessibilityPanel restaurantId={restaurantId} restaurant={restaurant} />
              </>
            )}
          </div>

          {/* Active campaign + flash deal creation */}
          <div className="space-y-6">
            <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-table-textMuted mb-3">
                  Active Lull-Mitigation Campaign
                </h2>
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
                    </dl>

                    {cancelError && (
                      <div className="p-2.5 bg-table-danger/10 border border-table-danger/30 text-table-danger rounded-lg text-[11px] font-mono">
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

              <form onSubmit={handleCreateCampaign} className="space-y-4 border-t border-table-border pt-6">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-table-textMuted">
                  Trigger Flash Deal
                </h3>

                {formError && (
                  <div className="p-3 bg-table-danger/10 border border-table-danger/30 text-table-danger rounded-lg text-xs font-mono">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5">
                      Tables to Release
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={tableQuota}
                      onChange={(e) => setTableQuota(Number(e.target.value))}
                      disabled={!!activeCampaign || isCreatingCampaign}
                      className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-2.5 text-sm text-table-text focus:outline-none focus:border-table-offer transition-colors disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5">
                      Discount % ({MIN_DISCOUNT}-{MAX_DISCOUNT})
                    </label>
                    <input
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

                <button
                  type="submit"
                  disabled={!!activeCampaign || isCreatingCampaign}
                  className="w-full py-3 bg-table-offer hover:bg-table-offer/90 text-table-canvas font-bold font-mono text-xs rounded-xl transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activeCampaign
                    ? 'Campaign Already Active'
                    : isCreatingCampaign
                      ? 'Launching...'
                      : 'Launch Flash Deal'}
                </button>
              </form>
            </section>

            <CampaignHistory restaurantId={restaurantId} />
            <BookingsList restaurantId={restaurantId} />
          </div>
        </div>
      </div>
    </div>
  );
}
