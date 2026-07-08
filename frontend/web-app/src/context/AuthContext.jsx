import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// --- DEVELOPMENT BYPASS FORCE INJECTION ---
// ⚡ Real Postgres database credentials synchronized from your pgAdmin4 tables
const DEV_USER_ID = '550e8400-e29b-41d4-a716-446655440002'; 
const DEV_RESTAURANT_ID = '550e8400-e29b-41d4-a716-446655441001'; 

export function AuthProvider({ children }) {
  // Initialize state instantly from local storage or drop into the Postgres defaults.
  // This approach ensures layout hooks fetch clean data profiles on mount without relying on window reloads.
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('table_user_id') || DEV_USER_ID;
  });
  
  const [restaurantId, setRestaurantId] = useState(() => {
    return localStorage.getItem('table_restaurant_id') || DEV_RESTAURANT_ID;
  });
  
  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('table_merchant_token') || 'future-jwt-placeholder';
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to true for local testing speed

  // Keep LocalStorage structure updated on initial render cycle if clean
  useEffect(() => {
    if (!localStorage.getItem('table_restaurant_id')) {
      localStorage.setItem('table_user_id', DEV_USER_ID);
      localStorage.setItem('table_restaurant_id', DEV_RESTAURANT_ID);
      localStorage.setItem('table_merchant_token', 'future-jwt-placeholder');
    }
  }, []);

  // Dummy auth per docs/user-stories/01-onboarding.md — there is no real login
  // endpoint; the backend identifies users/managers via the seeded UUIDs below
  // (see database/seeds/001_demo_manhattan.sql).
  const login = async () => {
    localStorage.setItem('table_user_id', DEV_USER_ID);
    localStorage.setItem('table_restaurant_id', DEV_RESTAURANT_ID);
    localStorage.setItem('table_merchant_token', 'future-jwt-placeholder');

    setUserId(DEV_USER_ID);
    setRestaurantId(DEV_RESTAURANT_ID);
    setAuthToken('future-jwt-placeholder');
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
    <AuthContext.Provider value={{ isAuthenticated, userId, restaurantId, authToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook pair is the standard React context file shape
export const useAuth = () => useContext(AuthContext);