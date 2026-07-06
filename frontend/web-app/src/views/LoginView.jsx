// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginView() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Dummy auth gate per docs/user-stories/01-onboarding.md — real credential
    // checking is out of scope; this just bypasses into the seeded manager identity.
    if (email === 'merchant@table.com' && password === 'password') {
      await login();
      navigate('/merchant');
    } else {
      setError('Invalid credentials. Use the demo manager credentials to continue.');
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
          <p className="text-table-textMuted font-sans text-sm tracking-wide">Secure User Access</p>
        </div>

        {/* Informative Error Banner Alert UI */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/45 border border-red-500/30 text-red-400 rounded-xl text-xs font-mono leading-relaxed text-left">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
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
              placeholder="your.name@provider.com"
              className="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-table-text font-sans placeholder:text-table-textSubtle focus:ring-2 focus:ring-table-primary/50 focus:border-table-primary transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label htmlFor="password" className="block text-xs font-mono text-table-textMuted uppercase tracking-widest text-left">
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-table-text font-sans placeholder:text-table-textSubtle focus:ring-2 focus:ring-table-primary/50 focus:border-table-primary transition-all outline-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 bg-table-primary text-table-canvas font-sans font-bold rounded-xl hover:bg-table-primaryHover transition-all duration-300 shadow-lg shadow-table-primary/10"
            >
              Sign In to Tablé
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}