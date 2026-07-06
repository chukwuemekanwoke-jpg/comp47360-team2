import { useState } from 'react';
import {
  useGetRestaurantBookingsQuery,
  useUpdateBookingStatusMutation,
} from '../../../packages/shared/src/apiSlice.ts';

const STATUS_STYLE = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  no_show: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const TRANSPORT_GLYPHS = {
  walking: '🚶',
  driving: '🚗',
  transit: '🚇',
  cycling: '🚴',
};

export default function BookingsList({ restaurantId }) {
  const { data, isLoading, error } = useGetRestaurantBookingsQuery(restaurantId, {
    skip: !restaurantId,
  });
  const [updateStatus] = useUpdateBookingStatusMutation();
  const [actionError, setActionError] = useState('');

  const bookings = data?.bookings ?? [];

  const handleUpdateStatus = async (bookingId, status) => {
    setActionError('');
    try {
      await updateStatus({ bookingId, status }).unwrap();
    } catch (err) {
      // Expected to 404 until the backend adds PATCH /bookings/:id/status.
      setActionError(err?.data?.error?.message || 'Could not update yet — pending backend support.');
    }
  };

  return (
    <section className="bg-[#11161D] border border-[#1F2936] rounded-2xl p-6 space-y-4">
      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
        Reservations
      </h2>

      {actionError && (
        <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg text-[11px] font-mono">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-slate-500 font-mono">Loading reservations...</p>
      ) : error ? (
        <p className="text-xs text-slate-500 font-mono">
          Not available yet — pending backend support (GET /restaurants/:id/bookings).
        </p>
      ) : bookings.length === 0 ? (
        <p className="text-xs text-slate-500 font-mono">No reservations yet.</p>
      ) : (
        <ul className="divide-y divide-[#1F2936]">
          {bookings.map((booking) => (
            <li key={booking.id} className="py-3 flex items-center justify-between gap-4 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <span className="text-slate-200 font-bold">
                  {booking.userDisplayName || `Guest ${booking.userId.slice(0, 8)}`}
                  {booking.campaignId && (
                    <span className="ml-2 text-[10px] text-[#e29c36] uppercase">Flash Deal</span>
                  )}
                </span>
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span>{TRANSPORT_GLYPHS[booking.transportMode] || '⏱️'}</span>
                  {booking.etaMinutes != null ? `${booking.etaMinutes} min ETA` : 'ETA unavailable'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                    STATUS_STYLE[booking.status] || 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {booking.status}
                </span>

                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                    className="px-2 py-1 bg-teal-500 text-slate-950 font-bold rounded hover:bg-teal-400 transition-colors uppercase tracking-wider"
                  >
                    Confirm
                  </button>
                )}
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'completed')}
                      className="px-2 py-1 bg-slate-700 text-slate-100 font-bold rounded hover:bg-slate-600 transition-colors uppercase tracking-wider"
                    >
                      Seat
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                      className="px-2 py-1 bg-red-950 text-red-400 border border-red-800/40 font-bold rounded hover:bg-red-900/60 transition-colors uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'no_show')}
                    className="px-2 py-1 bg-purple-950 text-purple-300 border border-purple-800/40 font-bold rounded hover:bg-purple-900/60 transition-colors uppercase tracking-wider"
                  >
                    No Show
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
