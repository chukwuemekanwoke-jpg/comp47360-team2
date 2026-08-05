// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/validation';
import { useLoginMutation } from '../../../packages/shared/src/apiSlice.ts';
import PasswordInput from '../components/PasswordInput';
import BrandMark from '../components/BrandMark';

export default function LoginView() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [login, { isLoading: isSubmitting }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    try {
      const session = await login({ email, password }).unwrap();
      setSession(session);
      navigate('/merchant');
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to sign in.');
    }
  };

  return (
    <div className="h-[calc(100svh-73px)] w-full flex items-center justify-center bg-table-canvas relative overflow-hidden">
      {/* Manhattan hero photo, brought back per team request — dark overlay
          keeps the card/text readable over it, glow blobs kept for depth
          consistent with the rest of the dashboard's visual language. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-table-canvas/80 backdrop-blur-[2px] pointer-events-none" />
      <div
        className="absolute w-[420px] h-[420px] rounded-full blur-3xl opacity-20 -top-32 -left-24 pointer-events-none"
        style={{ background: 'var(--table-primary)' }}
      />
      <div
        className="absolute w-[360px] h-[360px] rounded-full blur-3xl opacity-15 -bottom-28 -right-16 pointer-events-none"
        style={{ background: 'var(--table-offer)' }}
      />

      <div className="relative z-10 w-full max-w-md p-10 bg-table-surface/95 border border-table-border rounded-2xl backdrop-blur-sm shadow-2xl">
        <div className="flex flex-col items-center gap-3 mb-10">
          <BrandMark size={40} />
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-display font-black text-table-text tracking-tight">Tablé</h1>
            <p className="text-table-textSubtle font-mono text-[11px] uppercase tracking-[0.2em]">Secure Access</p>
          </div>
        </div>

        {/* Informative Error Banner Alert UI */}
        {error && (
          <div role="alert" className="mb-6 p-4 bg-table-danger/10 border border-table-danger/30 text-table-danger rounded-xl text-xs font-mono leading-relaxed text-left">
            ⚠️ {error}
          </div>
        )}

        {/* noValidate: native browser validation would block onSubmit (and
            thus our styled, consistent error messages) before our own JS
            validation ever runs — required/type=email stay for a11y/mobile
            keyboard hints, but we own the actual validation UX. */}
        <form onSubmit={handleLogin} noValidate className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs font-mono text-table-textMuted uppercase tracking-widest text-left">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="your.name@provider.com"
              className="w-full px-4 py-3 bg-table-canvas border border-table-border rounded-xl text-table-text font-sans placeholder:text-table-textSubtle focus:outline-none focus:border-table-offer transition-colors disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label htmlFor="password" className="block text-xs font-mono text-table-textMuted uppercase tracking-widest text-left">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-mono text-table-textSubtle hover:text-table-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="••••••••"
              autoComplete="current-password"
              inputClassName="w-full px-4 py-3 bg-table-canvas border border-table-border rounded-xl text-table-text font-sans placeholder:text-table-textSubtle focus:outline-none focus:border-table-offer transition-colors disabled:opacity-50"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-table-primary text-table-canvas font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-table-primaryHover transition-colors shadow-lg shadow-table-primary/40 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In to Tablé'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-table-border text-center">
          <Link
            to="/register"
            className="text-xs font-mono font-bold text-table-primary hover:text-table-primaryHover transition-colors uppercase tracking-wider"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}