// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isValidPassword } from '../utils/validation';
import { useResetPasswordMutation } from '../../../packages/shared/src/apiSlice.ts';
import PasswordInput from '../components/PasswordInput';

export default function ResetPasswordView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [resetPassword, { isLoading: isSubmitting }] = useResetPasswordMutation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidPassword(newPassword)) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await resetPassword({ token, newPassword }).unwrap();
      setSubmitted(true);
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to reset your password.');
    }
  };

  return (
    <div
      className="h-[calc(100svh-73px)] w-full flex items-center justify-center bg-table-canvas relative overflow-hidden"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2000&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-md p-10 bg-table-surface/80 border border-table-border/80 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-5xl font-serif font-bold text-table-primary tracking-tighter">Tablé</h1>
          <p className="text-table-textMuted font-sans text-sm tracking-wide">Choose a New Password</p>
        </div>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div role="status" className="p-4 bg-table-success/10 border border-table-success/30 text-table-success rounded-xl text-xs font-mono leading-relaxed">
              Your password has been reset. You can now sign in with your new password.
            </div>
            <Link
              to="/"
              className="inline-block text-xs font-mono font-bold text-table-primary hover:text-table-primaryHover transition-colors uppercase tracking-wider"
            >
              Go to Sign In
            </Link>
          </div>
        ) : !token ? (
          <div className="space-y-6 text-center">
            <div role="alert" className="p-4 bg-red-950/45 border border-red-500/30 text-red-400 rounded-xl text-xs font-mono leading-relaxed">
              ⚠️ This reset link is missing or invalid. Request a new one below.
            </div>
            <Link
              to="/forgot-password"
              className="inline-block text-xs font-mono font-bold text-table-primary hover:text-table-primaryHover transition-colors uppercase tracking-wider"
            >
              Request a New Link
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div role="alert" className="mb-6 p-4 bg-red-950/45 border border-red-500/30 text-red-400 rounded-xl text-xs font-mono leading-relaxed text-left">
                ⚠️ {error}
              </div>
            )}

            {/* noValidate: our own validation owns the UX, same reasoning as LoginView. */}
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="block text-xs font-mono text-table-textMuted uppercase tracking-widest text-left">
                  New Password
                </label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  inputClassName="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-table-text font-sans placeholder:text-table-textSubtle focus:ring-2 focus:ring-table-primary/50 focus:border-table-primary transition-all outline-none disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-xs font-mono text-table-textMuted uppercase tracking-widest text-left">
                  Re-enter Password
                </label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  inputClassName="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-table-text font-sans placeholder:text-table-textSubtle focus:ring-2 focus:ring-table-primary/50 focus:border-table-primary transition-all outline-none disabled:opacity-50"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-table-primary text-table-canvas font-sans font-bold rounded-xl hover:bg-table-primaryHover transition-all duration-300 shadow-lg shadow-table-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-table-border/80 text-center">
              <Link
                to="/"
                className="text-xs font-mono font-bold text-table-primary hover:text-table-primaryHover transition-colors uppercase tracking-wider"
              >
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
