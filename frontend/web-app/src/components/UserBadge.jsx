import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGetProfileQuery } from '../../../packages/shared/src/apiSlice.ts';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// Text-initials avatar for the signed-in manager — no photo upload/avatar
// field exists on the user record, so this reads displayName from the same
// profile endpoint the rest of the app uses rather than faking an image.
export default function UserBadge() {
  const { userId } = useAuth() || {};
  const { data: profile } = useGetProfileQuery(userId, { skip: !userId });
  const name = profile?.displayName;

  return (
    <Link
      to="/merchant/settings"
      className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
    >
      <div className="w-8 h-8 rounded-full bg-table-interactive border border-table-border flex items-center justify-center text-[11px] font-mono font-bold text-table-primary shrink-0">
        {initials(name)}
      </div>
      <span className="text-xs font-mono text-table-textMuted truncate max-w-[120px]">
        {name || '…'}
      </span>
    </Link>
  );
}
