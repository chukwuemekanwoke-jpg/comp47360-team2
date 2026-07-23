import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MerchantLayout from './views/merchant/MerchantLayout';
import OverviewView from './views/merchant/OverviewView';
import TablesView from './views/merchant/TablesView';
import SettingsView from './views/merchant/SettingsView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import RestaurantSetupView from './views/RestaurantSetupView';
import ForgotPasswordView from './views/ForgotPasswordView';
import ResetPasswordView from './views/ResetPasswordView';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen text-table-text font-sans transition-colors duration-300 bg-table-canvas">
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
          <header className="sticky top-0 z-50 flex items-center px-8 py-4 border-b border-table-border bg-table-canvas/95 backdrop-blur-md">
            <Link to="/" className="text-2xl font-display font-bold text-table-primary tracking-tight">
              Tablé
            </Link>
          </header>

          {/* --- DYNAMIC ROUTING WORKSPACE --- */}
          <main>
            <Routes>
              <Route path="/" element={<LoginView />} />
              <Route path="/register" element={<RegisterView />} />
              <Route path="/register/restaurant" element={<RestaurantSetupView />} />
              <Route path="/forgot-password" element={<ForgotPasswordView />} />
              <Route path="/reset-password" element={<ResetPasswordView />} />
              <Route path="/merchant" element={<MerchantLayout />}>
                <Route index element={<OverviewView />} />
                <Route path="tables" element={<TablesView />} />
                <Route path="settings" element={<SettingsView />} />
              </Route>
            </Routes>
          </main>

        </AppLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;