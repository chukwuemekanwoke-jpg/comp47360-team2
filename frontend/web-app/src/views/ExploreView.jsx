<<<<<<< HEAD:frontend/web/src/views/ExploreView.jsx
import React from 'react';
import MerchantRadar from '../components/MerchantRadar';

export default function ExploreView() {
=======
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MapCanvasWrapper, { MapMarker } from "../components/MapCanvasComponent";

const DEFAULT_CENTER = { lat: 40.7580, lng: -73.9855 };

export default function ExploreView() {
  const location = useLocation();
  const [nearbyCustomers, setNearbyCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealDiscount, setDealDiscount] = useState(15);
  const [dealDuration, setDealDuration] = useState(30);

  // Synchronize initial coordinates safely if redirected from external dispatch routes
  const [currentCenter] = useState(() => {
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

  // Fetch and poll your active mobile user positions
  useEffect(() => {
    const fetchNearbyGPSUsers = async () => {
      const mockManhattanUsers = [
        { id: 'u1', name: 'Alex M.', lat: 40.7590, lng: -73.9845, distance: '0.1 mi' }, 
        { id: 'u2', name: 'Sarah T.', lat: 40.7565, lng: -73.9870, distance: '0.3 mi' }, 
        { id: 'u3', name: 'Jordan K.', lat: 40.7542, lng: -73.9820, distance: '0.6 mi' }, 
        { id: 'u4', name: 'Sam R.', lat: 40.7615, lng: -73.9780, distance: '0.5 mi' },  
      ];
      setNearbyCustomers(mockManhattanUsers);

      // Contextually auto-select a specific targeted user if routed directly via state telemetry strings
      if (location.state?.customerName) {
        const matchedUser = mockManhattanUsers.find(u => u.name === location.state.customerName);
        if (matchedUser) setSelectedCustomer(matchedUser);
      }
    };

    fetchNearbyGPSUsers();
    const interval = setInterval(fetchNearbyGPSUsers, 15000); 
    return () => clearInterval(interval);
  }, [location.state]);

  const handleSendFlashDeal = () => {
    setIsDealModalOpen(false);
    setSelectedCustomer(null);
    alert(`⚡ Flash Deal broadcasted straight to ${selectedCustomer.name}'s mobile device!`);
  };

>>>>>>> 00a820b358e60eea0b0a20b87720b9a595d4019e:frontend/web-app/src/views/ExploreView.jsx
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