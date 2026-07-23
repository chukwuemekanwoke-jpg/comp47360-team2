// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isValidEmail } from '../utils/validation';
import { useForgotPasswordMutation } from '../../../packages/shared/src/apiSlice.ts';

export default function ForgotPasswordView() {
  const [forgotPassword, { isLoading: isSubmitting }] = useForgotPasswordMutation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    try {
      await forgotPassword({ email }).unwrap();
      // Always show the generic success state on a real success — the
      // backend intentionally responds the same way whether or not the
      // email matches an account, to avoid leaking who has one.
      setSubmitted(true);
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to send reset instructions.');
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
          <p className="text-table-textMuted font-sans text-sm tracking-wide">Reset Your Password</p>
        </div>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div role="status" className="p-4 bg-table-success/10 border border-table-success/30 text-table-success rounded-xl text-xs font-mono leading-relaxed">
              If an account exists for that email, we&apos;ve sent instructions to reset your password.
            </div>
            <Link
              to="/"
              className="inline-block text-xs font-mono font-bold text-table-primary hover:text-table-primaryHover transition-colors uppercase tracking-wider"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <p className="text-table-textMuted font-sans text-xs text-center mb-6 leading-relaxed">
              Enter the email address on your account and we&apos;ll send you a link to reset your password.
            </p>

            {error && (
              <div role="alert" className="mb-6 p-4 bg-red-950/45 border border-red-500/30 text-red-400 rounded-xl text-xs font-mono leading-relaxed text-left">
                ⚠️ {error}
              </div>
            )}

            {/* noValidate: native browser validation would block onSubmit
                before our own styled, consistent error messages ever run —
                see LoginView for the same reasoning. */}
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
                  className="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-table-text font-sans placeholder:text-table-textSubtle focus:ring-2 focus:ring-table-primary/50 focus:border-table-primary transition-all outline-none disabled:opacity-50"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-table-primary text-table-canvas font-sans font-bold rounded-xl hover:bg-table-primaryHover transition-all duration-300 shadow-lg shadow-table-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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
