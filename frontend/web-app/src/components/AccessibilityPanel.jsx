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
      // Expected to 404 until the backend adds PATCH /restaurants/:id/settings.
      setError(err?.data?.error?.message || 'Could not save yet — pending backend support.');
    }
  };

  return (
    <div className="bg-[#11161D] border border-[#1F2936] rounded-2xl p-6 shadow-xl w-full space-y-4">
      <div>
        <h3 className="text-xs font-bold font-mono tracking-wider text-slate-200 uppercase">
          Accessibility
        </h3>
        <p className="text-[11px] font-mono text-slate-500 mt-1">
          Verified access markers shown to diners.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {FLAGS.map(({ key, icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleToggle(key)}
            className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-mono font-medium transition-colors ${
              values[key]
                ? 'bg-[#33e1cc]/10 border-[#33e1cc]/30 text-[#33e1cc]'
                : 'bg-[#0B0F14] border-[#1F2936] text-slate-500'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{icon}</span>
              <span>{label}</span>
            </span>
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                values[key] ? 'bg-[#33e1cc]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[#0B0F14] transition-transform ${
                  values[key] ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg text-[11px] font-mono">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || isSaving}
        className="w-full py-2.5 bg-[#e29c36] hover:bg-[#d18b25] text-slate-950 font-bold font-mono text-xs rounded-xl transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
