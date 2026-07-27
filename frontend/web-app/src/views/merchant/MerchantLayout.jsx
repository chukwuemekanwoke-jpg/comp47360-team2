import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import BrandMark from '../../components/BrandMark';
import UserBadge from '../../components/UserBadge';
import { useAuth } from '../../context/AuthContext';
import {
  useGetRestaurantDetailQuery,
  useLogoutMutation,
  tableApi,
} from '../../../../packages/shared/src/apiSlice.ts';

const ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  ),
};

const TABS = [
  { to: '/merchant', label: 'Overview', icon: 'overview', end: true },
  { to: '/merchant/settings', label: 'Settings', icon: 'settings', end: false },
];

// Shared shell for the merchant pages (Overview/Settings) — owns the
// restaurant-detail fetch (polled, so the header name/capacity stay live)
// and passes it down via Outlet context rather than each page re-declaring
// the same query.
export default function MerchantLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { restaurantId, logout } = useAuth() || {};
  const [logoutRequest] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutRequest().unwrap();
    } catch {
      // ignore — proceed with local logout regardless
    }
    logout();
    dispatch(tableApi.util.resetApiState());
    navigate('/');
  };

  const { data: restaurant, isLoading: isRestaurantLoading } = useGetRestaurantDetailQuery(restaurantId, {
    skip: !restaurantId,
    pollingInterval: 2000,
  });

  if (!restaurantId) {
    return (
      <div className="h-screen w-full bg-table-canvas flex items-center justify-center font-mono">
        <div className="text-center space-y-4 max-w-sm px-6">
          <p className="text-xs tracking-widest text-table-textMuted uppercase">No restaurant linked to this account yet.</p>
          <Link
            to="/register/restaurant"
            className="inline-block text-xs font-bold text-table-primary hover:text-table-primaryHover transition-colors uppercase tracking-wider"
          >
            Set up your restaurant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-table-canvas text-table-text font-sans antialiased flex flex-col md:flex-row">
      <aside className="w-full md:w-[220px] shrink-0 border-b md:border-b-0 md:border-r border-table-border bg-table-surface/60 p-5 flex flex-col gap-5 md:gap-7">
        <Link to="/merchant" className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="text-lg font-display font-black tracking-tight">Tablé</span>
        </Link>

        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto">
          {TABS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-b-2 md:border-b-0 md:border-l-2 font-mono text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-table-primary text-table-primary bg-table-primary/10'
                    : 'border-transparent text-table-textSubtle hover:text-table-text'
                }`
              }
            >
              <span className="w-[15px] h-[15px] shrink-0">{ICONS[icon]}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="md:mt-auto w-full px-4 py-2 bg-transparent border border-table-danger/40 text-table-danger hover:bg-table-danger/10 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-colors"
        >
          Logout
        </button>
      </aside>

      <div className="flex-1 min-w-0 p-4 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-table-success bg-table-success/10 border border-table-success/30 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-table-success motion-safe:animate-pulse" />
              Live
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-table-text mt-2 tracking-tight">
              {isRestaurantLoading ? 'Loading...' : restaurant?.name ?? 'Restaurant Control Panel'}
            </h1>
          </div>
          <UserBadge />
        </div>

        <Outlet context={{ restaurantId, restaurant, isRestaurantLoading }} />
      </div>
    </div>
  );
}
