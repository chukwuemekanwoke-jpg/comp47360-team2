import React, { useState } from 'react';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Login attempt with:', { email, password });
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

      <div className="relative z-10 w-full max-w-md p-10 bg-table-surface/80 border border-table-border rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-5xl font-serif font-bold text-table-gold tracking-tighter">Tablé</h1>
          <p className="text-table-cream/70 font-sans text-sm tracking-wide">Secure User Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs font-mono text-table-cream/80 uppercase tracking-widest">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.name@provider.com"
              className="w-full px-4 py-3 bg-table-canvas/50 border border-table-border rounded-xl text-table-cream font-sans placeholder:text-zinc-600 focus:ring-2 focus:ring-table-gold/50 focus:border-table-gold transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label htmlFor="password" className="block text-xs font-mono text-table-cream/80 uppercase tracking-widest">
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
              className="w-full px-4 py-3 bg-table-canvas/50 border border-table-border rounded-xl text-table-cream font-sans placeholder:text-zinc-600 focus:ring-2 focus:ring-table-gold/50 focus:border-table-gold transition-all outline-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 bg-table-gold text-table-canvas font-sans font-bold rounded-xl hover:bg-white transition-all duration-300 shadow-lg"
            >
              Sign In to Tablé
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}