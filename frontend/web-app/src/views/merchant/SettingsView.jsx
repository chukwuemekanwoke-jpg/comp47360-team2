import { useOutletContext } from 'react-router-dom';
import AccessibilityPanel from '../../components/AccessibilityPanel';

export default function SettingsView() {
  const { restaurantId, restaurant } = useOutletContext();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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

      {restaurant && <AccessibilityPanel restaurantId={restaurantId} restaurant={restaurant} />}
    </div>
  );
}
