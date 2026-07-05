import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

export default function FlashDealBookingView() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // If the user clicked a specific deal, we can pass it through router state. 
  // Otherwise, we provide fallbacks.
  const discount = location.state?.discount || 15;
  const restaurantName = location.state?.restaurantName || "La Grande Boucherie";
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    covers: 2,
    time: '19:30',
    notes: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // This is the EXACT payload structure your MerchantDashboard expects in its 'reservations' state!
    const bookingPayload = {
      id: Math.floor(Math.random() * 10000), // Temp ID until database generates one
      guest: `${formData.firstName} ${formData.lastName}`,
      time: formData.time,
      covers: parseInt(formData.covers, 10),
      status: 'Confirmed', // Automatically confirmed because it's a Flash Deal
      notes: formData.notes ? `[FLASH DEAL ${discount}%] ${formData.notes}` : `[FLASH DEAL ${discount}%]`,
    };

    // Simulate an API call to your future database
    setTimeout(() => {
      console.log("Payload sent to Merchant Database:", bookingPayload);
      setIsSubmitting(false);
      alert(`Success! Your ${discount}% Flash Deal at ${restaurantName} is secured.`);
      navigate('/explore'); // Send them back to the map
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#0A0A0A] p-6 font-sans">
      <div className="w-full max-w-lg bg-[#11161D] border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Flash Deal Banner */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500"></div>

        <div className="mb-8">
          <Link to="/explore" className="text-xs text-zinc-500 hover:text-white transition-colors mb-4 inline-block">
            ← Back to Map
          </Link>
          <h1 className="text-3xl font-serif font-bold text-white mt-2">Claim Your Table</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Securing your <span className="text-amber-500 font-bold">{discount}% OFF</span> Flash Deal at <span className="text-white font-medium">{restaurantName}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase">First Name</label>
              <input 
                required
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-[#0B0F14] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Marcus"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase">Last Name</label>
              <input 
                required
                type="text" 
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-[#0B0F14] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Aurelius"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase">Party Size</label>
              <select 
                name="covers"
                value={formData.covers}
                onChange={handleChange}
                className="w-full bg-[#0B0F14] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase">Est. Arrival</label>
              <input 
                required
                type="time" 
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full bg-[#0B0F14] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase flex justify-between">
              <span>Allergies / Requests</span>
              <span className="text-zinc-600">Optional</span>
            </label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full bg-[#0B0F14] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors resize-none text-sm"
              placeholder="e.g. Severe tree nut allergy, prefer a booth..."
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-bold tracking-wide transition-all ${
              isSubmitting 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
            }`}
          >
            {isSubmitting ? 'Confirming with Merchant...' : 'Lock in Flash Deal'}
          </button>
        </form>
      </div>
    </div>
  );
}