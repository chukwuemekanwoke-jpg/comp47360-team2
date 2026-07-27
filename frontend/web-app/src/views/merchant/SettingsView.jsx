import { useOutletContext } from 'react-router-dom';
import AccessibilityPanel from '../../components/AccessibilityPanel';
import { useTheme } from '../../context/ThemeContext';

function AppearancePanel() {
  const { theme, toggleTheme } = useTheme() || {};
  const isLight = theme === 'light';

  return (
    <section className="bg-table-surface border border-table-border rounded-2xl p-6 space-y-4">
      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-table-textMuted">
        Appearance
      </h2>
      <button
        type="button"
        role="switch"
        aria-checked={isLight}
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-mono font-medium transition-colors ${
          isLight
            ? 'bg-table-primary/10 border-table-primary/30 text-table-primary'
            : 'bg-table-canvas border-table-border text-table-textSubtle'
        }`}
      >
        <span>Light Mode</span>
        <span
          aria-hidden="true"
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            isLight ? 'bg-table-primary' : 'bg-table-interactive'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-table-canvas transition-transform ${
              isLight ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </span>
      </button>
    </section>
  );
}

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

      <div className="space-y-6">
        <AppearancePanel />
        {restaurant && <AccessibilityPanel restaurantId={restaurantId} restaurant={restaurant} />}
      </div>
    </div>
  );
}
