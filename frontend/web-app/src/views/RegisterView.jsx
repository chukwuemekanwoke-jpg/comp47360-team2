import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRegisterMutation } from '../../../packages/shared/src/apiSlice.ts';
import { isValidEmail, isValidPassword } from '../utils/validation';

export default function RegisterView() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [register, { isLoading: isSubmitting }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(formData.email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!isValidPassword(formData.password)) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const session = await register({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName || undefined,
      }).unwrap();

      setSession(session);
      navigate('/register/restaurant');
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to create account.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-table-canvas flex items-center justify-center p-6 text-table-text font-sans">
      <div className="w-full max-w-lg bg-table-surface border border-table-border rounded-2xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <span className="text-[11px] font-mono font-bold tracking-widest text-table-offer uppercase block">
            Create an account with Tablé
          </span>
          <h1 className="text-2xl font-black text-table-text mt-2 tracking-tight">
            Create Merchant Account
          </h1>
        </div>

        {error && (
          <div role="alert" className="mb-6 p-4 bg-table-danger/10 border border-table-danger/30 text-table-danger rounded-xl text-xs font-mono leading-relaxed">
            {error}
          </div>
        )}

        {/* noValidate: see LoginView for why — our own validation owns the UX. */}
        <form onSubmit={handleFormSubmit} noValidate className="space-y-5 text-left">
          <div>
            <label htmlFor="displayName" className="block text-[11px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5 font-bold">
              Your Name
            </label>
            <input
              id="displayName"
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Jane Doe"
              className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-3 text-sm text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-primary transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-[11px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5 font-bold">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder="manager@restaurant.com"
              className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-3 text-sm text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-primary transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-[11px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5 font-bold">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="At least 8 characters"
                className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-3 text-sm text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-primary transition-colors"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-[11px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5 font-bold">
                Re-enter Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-3 text-sm text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-primary transition-colors"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-table-offer hover:bg-table-offer/90 text-table-canvas font-bold font-mono text-sm rounded-xl transition-all uppercase tracking-wider shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-table-border text-center">
          <Link
            to="/"
            className="text-xs font-mono font-bold text-table-primary hover:text-table-primaryHover transition-colors uppercase tracking-wider"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
