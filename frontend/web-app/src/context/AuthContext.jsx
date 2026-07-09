import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

// --- DEVELOPMENT BYPASS FORCE INJECTION ---
// ⚡ Real Postgres database credentials synchronized from your pgAdmin4 tables
const DEV_USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const DEV_RESTAURANT_ID = '550e8400-e29b-41d4-a716-446655441001';

// Seed the dummy dev session into localStorage synchronously at module load —
// NOT in a useEffect. A useEffect runs after the first render/commit, which
// is already too late: RTK Query fires its query-on-mount before that effect
// executes, so apiSlice's prepareHeaders (which reads localStorage directly)
// would send the very first request of a fresh session with no X-User-Id
// header at all, producing a real 401 that pending-backend UI mistakenly
// displayed as "not built yet".
//
// Deliberately NOT setting table_merchant_token here: apiSlice sends
// `Authorization: Bearer <token>` for ANY truthy token, and the backend's
// requireUser middleware checks Bearer *before* falling back to X-User-Id —
// so a fake placeholder token would get parsed as a real JWT, fail
// verification, and 401 with "Invalid or expired token" before X-User-Id is
// ever consulted. The dummy session is X-User-Id-only by design; leaving no
// token in storage is what makes that fallback path actually engage.
//
// Gated on table_user_id specifically, NOT table_restaurant_id: a real user
// who registered but hasn't created a restaurant yet (setSession clears
// table_restaurant_id for exactly that case, since POST /restaurants isn't
// built yet) must NOT be silently reset to the demo identity here — that
// previously left their real JWT in storage while table_user_id/
// table_restaurant_id pointed at the seeded demo manager/restaurant, so
// every authenticated request 401'd with "Not authorized to manage this
// restaurant" (real token's subject didn't match the demo restaurant).
if (typeof window !== 'undefined' && !localStorage.getItem('table_user_id')) {
  localStorage.setItem('table_user_id', DEV_USER_ID);
  localStorage.setItem('table_restaurant_id', DEV_RESTAURANT_ID);
}

export function AuthProvider({ children }) {
  // Initialize state instantly from local storage (already seeded above, so
  // this is always populated by the time any component reads it).
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('table_user_id') || DEV_USER_ID;
  });

  // No DEV_RESTAURANT_ID fallback here (unlike userId below) — a real user
  // who hasn't created a restaurant yet must read as restaurantId=null, not
  // silently borrow the demo restaurant's id. See the module-level comment
  // above for why that mismatch is actively harmful, not just inaccurate.
  const [restaurantId, setRestaurantId] = useState(() => {
    return localStorage.getItem('table_restaurant_id') || null;
  });

  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('table_merchant_token') || null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to true for local testing speed

  // Real auth session from POST /auth/register or /auth/login — writes to
  // the same localStorage keys as the dummy login() above, so everything
  // downstream (apiSlice headers, MerchantDashboard) works unchanged
  // regardless of which path set the session.
  const setSession = ({ userId: newUserId, token, restaurantId: newRestaurantId }) => {
    localStorage.setItem('table_user_id', newUserId);
    localStorage.setItem('table_merchant_token', token);
    if (newRestaurantId) {
      localStorage.setItem('table_restaurant_id', newRestaurantId);
    } else {
      localStorage.removeItem('table_restaurant_id');
    }

    setUserId(newUserId);
    setRestaurantId(newRestaurantId ?? null);
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('table_user_id');
    localStorage.removeItem('table_restaurant_id');
    localStorage.removeItem('table_merchant_token');
    
    setUserId(null);
    setRestaurantId(null);
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, restaurantId, authToken, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook pair is the standard React context file shape
export const useAuth = () => useContext(AuthContext);