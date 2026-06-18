import React from 'react';

/**
 * Creates an SVG donut gauge for a specific data point.
 * @param {string} title The title for the gauge (e.g., "Main Dining Floor").
 * @param {number} available Number of available tables.
 * @param {number} total Total number of tables.
 * @returns {JSX.Element} A gauge component.
 */
function DonutGauge({ title, available, total }) {
  const percentageAvailable = (available / total) * 100;
  const radius = 60; // radius of the circle
  const circumference = 2 * Math.PI * radius; // circumference for stroke-dasharray
  const offset = circumference - (percentageAvailable / 100) * circumference; // dash offset for availability

  // Color mapping matching Option 2 aesthetic
  const availableColor = "#33e1cc"; // Cyan/Teal for availability
  const filledColor = "#e29c36"; // Amber/Orange for filled/total
  const gaugeColor = (available / total) > 0.5 ? availableColor : (available / total) > 0.2 ? filledColor : "#ef4444"; // Simple threshold for filled vs warning colors

  return (
    <div className="flex flex-col items-center bg-[#121820] border border-[#1F2936] p-5 rounded-2xl">
      {/* Dynamic Title */}
      <h4 className="text-sm font-mono font-bold text-slate-100 mb-4">{title}</h4>
      
      {/* SVG Donut Chart */}
      <svg width="150" height="150" viewBox="0 0 150 150" className="rotate-[-90deg]">
        {/* Background circle (grey) */}
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="#1F2936" // Dark grey background stroke
          strokeWidth="15"
        />
        {/* Availability slice (cyan) */}
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={gaugeColor} // Dynamic color
          strokeWidth="15"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500" // Simple smooth update
        />
        {/* Optional: Inner text/label could go here, though the mockup keeps it clean with just the number */}
      </svg>
      
      {/* Dynamic numerical stats matching Option 2 monolithic font */}
      <div className="flex flex-col items-center mt-3 text-center">
        <p className="text-3xl font-mono font-bold text-slate-100 tracking-tighter">
          {available} / {total}
        </p>
        <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
          Tables Available
        </p>
      </div>
    </div>
  );
}

// *** Data Structure Placeholder (For future connection) ***
// const occupancyData = {
//   "Main Dining Floor": { available: 15, total: 20 },
//   "Patio": { available: 10, total: 20 },
//   "Speakeasy": { available: 8, total: 20 }
// };

export default function OccupancyMeter({ occupancyData }) {
  // Use provided data, otherwise use this placeholder data for immediate rendering
  const displayData = occupancyData || {
    "Main Dining Floor": { available: 15, total: 20 },
    "Patio": { available: 10, total: 20 },
    "Speakeasy": { available: 8, total: 20 }
  };

  return (
    <div className="bg-[#11161D] border border-[#1F2936] rounded-xl p-6 pb-8 mb-12 space-y-6">
      <div className="flex justify-between items-center border-b border-[#1F2936] pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
            🧭 Restaurant OccupancyOverview
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-time visual breakdown of table availability by zone.
          </p>
        </div>
        {/* Option to add a total percentage card on the left like Option 3 in the future */}
      </div>
      
      {/* Gauge Grid matching Option 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {Object.entries(displayData).map(([roomName, stats]) => (
          <DonutGauge key={roomName} title={roomName} available={stats.available} total={stats.total} />
        ))}
      </div>
    </div>
  );
}