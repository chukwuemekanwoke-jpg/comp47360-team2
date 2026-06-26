import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MapCanvasWrapper, { MapMarker } from "./MapCanvasComponent";
import { MapService } from '../services/MapService';

const DEFAULT_CENTER = { lat: 40.7580, lng: -73.9855 };

export default function MerchantRadar() {
  const location = useLocation();
  const [nearbyCustomers, setNearbyCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealDiscount, setDealDiscount] = useState(15);
  const [dealDuration, setDealDuration] = useState(30);

  const [currentCenter, setCurrentCenter] = useState(() => {
    if (location.state?.targetLocation?.lat && location.state?.targetLocation?.lng) {
      return {
        lat: Number(location.state.targetLocation.lat),
        lng: Number(location.state.targetLocation.lng)
      };
    }
    return DEFAULT_CENTER;
  });

  const [currentZoom] = useState(() => {
    return location.state?.targetLocation ? 16 : 15;
  });

  useEffect(() => {
    let isMounted = true;

    const fetchRadarData = async () => {
      setIsLoading(true);
      try {
        const data = await MapService.getNearbyDiners(DEFAULT_CENTER, 1.0);
        
        if (isMounted) {
          setNearbyCustomers(data);
          
          if (location.state?.customerName) {
            const matchedUser = data.find(u => u.name === location.state.customerName);
            if (matchedUser) setSelectedCustomer(matchedUser);
          }
        }
      } catch (error) {
        console.error("Failed to fetch nearby diners:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRadarData();
    
    const interval = setInterval(fetchRadarData, 15000); 
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location.state]);

  const handleSendFlashDeal = () => {
    setIsDealModalOpen(false);
    setSelectedCustomer(null);
    alert(`⚡ Flash Deal broadcasted straight to ${selectedCustomer.name}'s mobile device!`);
  };

  return (
    <div className="flex w-full h-full space-x-6 overflow-hidden box-border">
      
      {/* LEFT AREA: High-Contrast Live Interactive Map Layer */}
      <div className="flex-1 bg-zinc-950 rounded-2xl relative overflow-hidden flex flex-col shadow-2xl border border-zinc-700 h-full">
        {isLoading && (
          <div className="absolute top-4 left-4 z-10 bg-black/60 text-amber-400 text-[10px] font-mono px-3 py-1.5 rounded border border-amber-400/30 backdrop-blur-sm">
            SYNCING SATELLITE DATA...
          </div>
        )}
        <MapCanvasWrapper 
          center={currentCenter} 
          zoom={currentZoom}
          onMarkerSelect={(customerData) => setSelectedCustomer(customerData)}
        >
          {nearbyCustomers.map(customer => (
            <MapMarker
              key={customer.id}
              lat={customer.lat}
              lng={customer.lng}
              isActive={selectedCustomer?.id === customer.id}
              customerData={customer} 
            />
          ))}
        </MapCanvasWrapper>
      </div>

      {/* RIGHT PANEL: Operational Menu Action Board */}
      <div className="w-80 bg-[#1A1A1E] rounded-2xl border border-zinc-600 p-6 flex flex-col justify-between shadow-2xl h-full overflow-y-auto">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Click any blinking user asset node map pin on the street directory layout to contextually route hyper-targeted dining deal offers.
            </p>
          </div>

          {selectedCustomer ? (
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-700 space-y-4 shadow-inner">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">Selected Target</span>
                <span className="font-bold text-xl text-amber-400 mt-1 block">{selectedCustomer.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-y border-zinc-800 py-3 font-mono text-xs">
                <div>
                  <span className="text-zinc-400 block font-bold">PROXIMITY</span>
                  <span className="text-white font-extrabold block mt-0.5">{selectedCustomer.distance}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-bold">DEVICE STATUS</span>
                  <span className="text-emerald-400 font-extrabold block mt-0.5">{selectedCustomer.status || 'Active Walking'}</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsDealModalOpen(true)}
                className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-mono font-bold rounded-xl text-xs transition uppercase tracking-wider shadow-md"
              >
                ⚡ Issue Flash Deal
              </button>
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-400 text-xs border border-dashed border-zinc-700 rounded-2xl font-mono space-y-3 bg-zinc-950/40">
              <span className="text-3xl block filter drop-shadow">🗺️</span>
              <p className="max-w-[200px] mx-auto leading-relaxed">
                No customer selected. Please select a pin on the map if you want to offer them a deal.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PARAMETER PAYLOAD BUILDER DRAWER OVERLAY */}
      {isDealModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="bg-[#1C1C1E] border border-zinc-600 p-6 rounded-2xl w-full max-w-sm space-y-6 shadow-2xl">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">Payload Configurator</span>
              <h3 className="text-xl font-serif font-bold text-white mt-1">Targeted Walk-In Incentive</h3>
            </div>

            <div className="space-y-4 font-mono text-xs text-zinc-200">
              <div>
                <label className="block uppercase tracking-wider mb-2 font-bold">Discount Amount (%)</label>
                <input 
                  type="number" 
                  value={dealDiscount} 
                  onChange={(e) => setDealDiscount(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-600 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 shadow-inner font-bold"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider mb-2 font-bold">Arrival Window Limit</label>
                <select 
                  value={dealDuration} 
                  onChange={(e) => setDealDuration(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-600 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 shadow-inner font-bold"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>1 Hour</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2 pt-2 text-xs font-mono uppercase tracking-wider">
              <button 
                type="button"
                onClick={() => setIsDealModalOpen(false)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSendFlashDeal}
                className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl shadow-md transition"
              >
                Broadcast Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}