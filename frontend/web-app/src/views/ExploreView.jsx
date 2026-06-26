import React from 'react';
import MerchantRadar from '../components/MerchantRadar';

export default function ExploreView() {
  return (
    <div className="flex flex-col w-full h-[calc(100vh-90px)] max-h-[calc(100vh-90px)] p-6 bg-[#0A0A0A] text-white font-sans overflow-hidden box-border">
      
      {/* Administrative Header Node */}
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-100">
            Merchant Radar
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Target nearby diners with real-time flash deals.
          </p>
        </div>
      </div>

      {/* Core Merchant Viewport Component */}
      <div className="flex-1 overflow-hidden">
        <MerchantRadar />
      </div>

    </div>
  );
}