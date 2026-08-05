import { useEffect, useState } from 'react';
import { useUpdateRestaurantSettingsMutation } from '../../../packages/shared/src/apiSlice.ts';

const FLAGS = [
  { key: 'isWheelchairAccessible', icon: '♿', label: 'Wheelchair Accessible' },
  { key: 'sensoryFriendly', icon: '🧘', label: 'Sensory Friendly' },
];

export default function AccessibilityPanel({ restaurantId, restaurant }) {
  const [values, setValues] = useState({
    isWheelchairAccessible: !!restaurant?.isWheelchairAccessible,
    sensoryFriendly: !!restaurant?.sensoryFriendly,
  });
  const [error, setError] = useState('');
  const [updateSettings, { isLoading: isSaving }] = useUpdateRestaurantSettingsMutation();

  // Re-sync local toggle state whenever the underlying restaurant record changes.
  useEffect(() => {
    setValues({
      isWheelchairAccessible: !!restaurant?.isWheelchairAccessible,
      sensoryFriendly: !!restaurant?.sensoryFriendly,
    });
  }, [restaurant]);

  const isDirty =
    values.isWheelchairAccessible !== !!restaurant?.isWheelchairAccessible ||
    values.sensoryFriendly !== !!restaurant?.sensoryFriendly;

  const handleToggle = (key) => {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setError('');
    try {
      await updateSettings({ restaurantId, ...values }).unwrap();
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to save settings.');
    }
  };

  return (
    <div className="bg-table-surface border border-table-border rounded-2xl p-6 shadow-xl w-full space-y-4">
      <div>
        <h3 className="text-xs font-bold font-mono tracking-wider text-table-text uppercase">
          Accessibility
        </h3>
        <p className="text-[11px] font-mono text-table-textSubtle mt-1">
          Verified access markers shown to diners.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {FLAGS.map(({ key, icon, label }) => (
          <button
            key={key}
            type="button"
            role="switch"
            aria-checked={values[key]}
            onClick={() => handleToggle(key)}
            className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-mono font-medium transition-colors ${
              values[key]
                ? 'bg-table-primary/10 border-table-primary/30 text-table-primary'
                : 'bg-table-canvas border-table-border text-table-textSubtle'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{icon}</span>
              <span>{label}</span>
            </span>
            <span
              aria-hidden="true"
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                values[key] ? 'bg-table-primary' : 'bg-table-interactive'
              }`}
              style={values[key] ? { boxShadow: '0 0 10px color-mix(in srgb, var(--table-primary) 55%, transparent)' } : undefined}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-table-canvas transition-transform ${
                  values[key] ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="p-2.5 bg-table-danger/10 border border-table-danger/30 text-table-danger rounded-lg text-[11px] font-mono">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || isSaving}
        className="w-full py-2.5 bg-table-offer hover:bg-table-offer/90 text-table-canvas font-bold font-mono text-xs rounded-xl transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
