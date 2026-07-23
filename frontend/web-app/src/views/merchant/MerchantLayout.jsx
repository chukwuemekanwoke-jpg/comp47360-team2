import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import DashboardHeader from '../../components/DashboardHeader';
import { useAuth } from '../../context/AuthContext';
import {
  useGetRestaurantDetailQuery,
  useLogoutMutation,
  tableApi,
} from '../../../../packages/shared/src/apiSlice.ts';

const TABS = [
  { to: '/merchant', label: 'Overview', end: true },
  { to: '/merchant/tables', label: 'Tables', end: false },
  { to: '/merchant/settings', label: 'Settings', end: false },
];

// Shared shell for the merchant pages (Overview/Tables/Settings) — owns the
// restaurant-detail fetch (polled, so the header name/capacity stay live)
// and passes it down via Outlet context rather than each page re-declaring
// the same query. Pages still call their own additional hooks directly, so
// e.g. the Tables page never triggers the campaign queries and vice versa.
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
    <div className="min-h-screen w-full bg-table-canvas text-table-text font-sans antialiased">
      <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <DashboardHeader name={isRestaurantLoading ? 'Loading...' : restaurant?.name ?? 'Restaurant Control Panel'} />
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-table-surface border border-table-danger/40 text-table-danger hover:bg-table-danger/10 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-colors shrink-0"
          >
            Logout
          </button>
        </div>

        <nav className="flex gap-2 border-b border-table-border">
          {TABS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-table-primary text-table-primary'
                    : 'border-transparent text-table-textSubtle hover:text-table-text'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <Outlet context={{ restaurantId, restaurant, isRestaurantLoading }} />
      </div>
    </div>
  );
}
