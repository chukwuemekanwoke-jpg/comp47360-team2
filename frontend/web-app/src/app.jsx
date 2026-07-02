import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 

import ExploreView from './views/ExploreView';
import MerchantDashboard from './views/MerchantDashboard';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import ProfileSetupView from './views/ProfileSetupView';
import FlashDealBookingView from './views/FlashDealBookingView';

// Helper component to dynamically toggle layout classes based on the current active view route
function AppLayout({ children }) {
  const location = useLocation();
  const isExplorePage = location.pathname === '/explore';

  return (
    <div className={`min-h-screen text-table-text font-sans transition-colors duration-300 ${
      isExplorePage ? 'bg-transparent' : 'bg-[#0A0A0A]'
    }`}>
      {children}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          
          {/* --- STICKY NAVIGATION HEADER --- */}
          <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-zinc-800/50 bg-[#0A0A0A]/95 backdrop-blur-md">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-serif font-bold text-table-primary tracking-tight">
                Tablé
              </Link>
              
              <nav className="flex space-x-6 text-sm font-medium">
                <NavLink 
                  to="/explore" 
                  className={({ isActive }) => 
                    `transition-colors duration-200 ${isActive ? 'text-table-primary' : 'text-table-textMuted hover:text-table-text'}`
                  }
                >
                  Explore
                </NavLink>

                <NavLink 
                  to="/merchant" 
                  className={({ isActive }) => 
                    `transition-colors duration-200 ${isActive ? 'text-table-primary' : 'text-table-textMuted hover:text-table-text'}`
                  }
                >
                  Merchant Dashboard
                </NavLink>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="px-4 py-1.5 border border-zinc-800 rounded-lg text-xs font-medium text-table-text hover:bg-zinc-900 transition"
              >
                Sign In
              </Link>
            </div>
          </header>

          {/* --- DYNAMIC ROUTING WORKSPACE --- */}
          <main>
            <Routes>
              <Route path="/" element={<LoginView />} />
              <Route path="/explore" element={<ExploreView />} />
              <Route path="/book-deal" element={<FlashDealBookingView />} />
              <Route path="/merchant" element={<MerchantDashboard />} />
              <Route path="/register" element={<RegisterView />} />
              <Route path="/setup-profile" element={<ProfileSetupView />} />
            </Routes>
          </main>

        </AppLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;