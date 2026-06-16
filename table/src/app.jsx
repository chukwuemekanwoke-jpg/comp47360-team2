import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import ExploreView from './views/ExploreView';
import MerchantDashboard from './views/MerchantDashboard';
import LoginView from './views/LoginView';

// Helper component to dynamically toggle layout classes based on the current active view route
function AppLayout({ children }) {
  const location = useLocation();
  const isExplorePage = location.pathname === '/explore';

  return (
    <div className={`min-h-screen text-table-cream font-sans transition-colors duration-350 ${
      isExplorePage ? 'bg-transparent' : 'bg-table-canvas'
    }`}>
      {children}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout>
        
        {/* --- STICKY NAVIGATION HEADER --- */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-zinc-800/80 bg-[#0A0A0A]/95 backdrop-blur-md">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-serif font-bold text-table-gold tracking-tight">
              Tablé
            </Link>
            
            <nav className="flex space-x-6 text-sm font-medium">
              <NavLink 
                to="/explore" 
                className={({ isActive }) => 
                  `transition-colors duration-200 ${isActive ? 'text-table-gold' : 'text-zinc-400 hover:text-zinc-200'}`
                }
              >
                Explore
              </NavLink>

              {/* Old Live Map NavLink has been safely removed from this position */}

              <NavLink 
                to="/merchant" 
                className={({ isActive }) => 
                  `transition-colors duration-200 ${isActive ? 'text-table-gold' : 'text-zinc-400 hover:text-zinc-200'}`
                }
              >
                Merchant Dashboard
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="px-4 py-1.5 border border-table-border rounded-lg text-xs font-medium text-table-cream hover:bg-zinc-900 transition"
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
            {/* MapView Route node has been deleted */}
            <Route path="/merchant" element={<MerchantDashboard />} />
          </Routes>
        </main>

      </AppLayout>
    </Router>
  );
}

export default App;