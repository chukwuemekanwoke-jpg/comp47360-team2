import React, { useState } from 'react';
import { OnboardingService } from '../services/OnboardingService';

export default function RegisterView() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    restaurantAddress: '',
    cuisineType: ''
  });

  const [uiState, setUiState] = useState({
    error: '',
    success: '',
    isSubmitting: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setUiState({ error: '', success: '', isSubmitting: true });

    // Client-side structural validations
    if (formData.password !== formData.confirmPassword) {
      setUiState({
        error: 'Password mismatch. Ensure both entry vectors match perfectly.',
        success: '',
        isSubmitting: false
      });
      return;
    }

    if (
      !formData.email ||
      !formData.password ||
      !formData.restaurantName ||
      !formData.restaurantAddress ||
      !formData.cuisineType
    ) {
      setUiState({
        error: 'All fields are mandatory to establish restaurant database indexes.',
        success: '',
        isSubmitting: false
      });
      return;
    }

    try {
      // Execute the database persistence layer connection
      await OnboardingService.registerRestaurant({
        email: formData.email,
        password: formData.password,
        restaurantName: formData.restaurantName,
        restaurantAddress: formData.restaurantAddress,
        cuisineType: formData.cuisineType
      });

      setUiState({
        error: '',
        success: 'Account initialized! Redirecting to structural profile configuration wizard...',
        isSubmitting: false
      });

      // Forward administrative email to profile setup view state context
      setTimeout(() => {
        window.location.href = `/setup-profile?email=${encodeURIComponent(formData.email)}`;
      }, 1500);

    } catch (err) {
      setUiState({
        error: err.message || 'Database connection timeout. Failed to persist account structures.',
        success: '',
        isSubmitting: false
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] flex items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-lg bg-[#12171E] border border-[#1F2936] rounded-2xl p-8 shadow-2xl">
        
        {/* Branding Header Block */}
        <div className="mb-8 text-center">
          <span className="text-[11px] font-mono font-bold tracking-widest text-[#e29c36] uppercase block">
            Create an account with Tablé
          </span>
          <h2 className="text-2xl font-black text-slate-100 mt-2 tracking-tight">
            Create Merchant Account
          </h2>
        </div>

        {/* Dynamic State Alerts */}
        {uiState.error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-xs font-mono leading-relaxed">
            ⚠️ {uiState.error}
          </div>
        )}

        {uiState.success && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono leading-relaxed">
            🎉 {uiState.success}
          </div>
        )}

        {/* Core Entry Form */}
        <form onSubmit={handleFormSubmit} className="space-y-5 text-left">
          
          {/* Section Heading: Administrative Credentials */}
          <div className="border-b border-[#1F2936] pb-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
              Administrative Credentials
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wide mb-1.5 font-bold">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="manager@restaurant.com"
              className="w-full bg-[#0B0F14] border border-[#1F2936] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e29c36] transition-colors"
              disabled={uiState.isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wide mb-1.5 font-bold">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full bg-[#0B0F14] border border-[#1F2936] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e29c36] transition-colors"
                disabled={uiState.isSubmitting}
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wide mb-1.5 font-bold">
                Re-enter Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full bg-[#0B0F14] border border-[#1F2936] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e29c36] transition-colors"
                disabled={uiState.isSubmitting}
              />
            </div>
          </div>

          {/* Section Heading: Restaurant information */}
          <div className="border-b border-[#1F2936] pb-1 pt-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
              Restaurant information
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wide mb-1.5 font-bold">
              Restaurant Name
            </label>
            <input
              type="text"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleInputChange}
              placeholder="Osteria Example"
              className="w-full bg-[#0B0F14] border border-[#1F2936] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e29c36] transition-colors"
              disabled={uiState.isSubmitting}
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wide mb-1.5 font-bold">
              Restaurant Physical Address
            </label>
            <input
              type="text"
              name="restaurantAddress"
              value={formData.restaurantAddress}
              onChange={handleInputChange}
              placeholder="123 Manhattan Ave, New York, NY"
              className="w-full bg-[#0B0F14] border border-[#1F2936] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e29c36] transition-colors"
              disabled={uiState.isSubmitting}
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wide mb-1.5 font-bold">
              Type of Cuisine
            </label>
            <input
              type="text"
              name="cuisineType"
              value={formData.cuisineType}
              onChange={handleInputChange}
              placeholder="Italian, Sushi, French Bistro..."
              className="w-full bg-[#0B0F14] border border-[#1F2936] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e29c36] transition-colors"
              disabled={uiState.isSubmitting}
            />
          </div>

          {/* Execution Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={uiState.isSubmitting}
              className={`w-full py-3.5 bg-[#e29c36] hover:bg-[#d18b25] text-slate-950 font-bold font-mono text-sm rounded-xl transition-all uppercase tracking-wider shadow-md focus:outline-none ${
                uiState.isSubmitting ? 'opacity-50 cursor-not-allowed saturate-50' : ''
              }`}
            >
              {uiState.isSubmitting ? 'Creating an account...' : 'Create Account'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}