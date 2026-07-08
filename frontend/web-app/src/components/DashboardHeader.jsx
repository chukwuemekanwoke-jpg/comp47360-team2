// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';

export default function DashboardHeader({ name }) {
  const [description, setDescription] = useState('');

  return (
    <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 py-2">
      {/* Left Column: Title Block */}
      <div className="flex flex-col items-start flex-shrink-0">
        <div className="text-[10px] font-mono font-bold tracking-widest text-table-offer uppercase">
          TABLÉ
        </div>
        <h1 className="text-2xl font-black text-table-text mt-1 tracking-tight">
          {name}
        </h1>
      </div>

      {/* Center Column: Form-Fillable Restaurant Description */}
      <div className="flex-1 max-w-xl w-full px-4">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Click to add a brief restaurant description or tagline..."
          className="w-full bg-table-surface border border-table-border rounded-xl px-5 py-3 text-xs font-mono text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-offer focus:ring-1 focus:ring-table-offer transition-all text-center tracking-wide"
        />
      </div>
    </div>
  );
}