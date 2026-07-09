// eslint-disable-next-line no-unused-vars
import React from 'react';

export default function DashboardHeader({ name }) {
  return (
    <div className="w-full flex items-center py-2">
      <div className="flex flex-col items-start">
        <div className="text-[10px] font-mono font-bold tracking-widest text-table-offer uppercase">
          TABLÉ
        </div>
        <h1 className="text-2xl font-black text-table-text mt-1 tracking-tight">
          {name}
        </h1>
      </div>
    </div>
  );
}