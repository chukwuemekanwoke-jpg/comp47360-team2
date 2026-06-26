
export default function ActivityLog({ reservations }) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">⚡ Live Activity Log</h2>
        <p className="text-sm text-zinc-500 mt-1">Real-time trace reporting of client check-ins.</p>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {reservations.map((res) => (
          <div key={res.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-white">{res.guest}</h4>
                <p className="text-zinc-400 font-mono text-xs">{res.time} — {res.covers} Covers</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono border uppercase bg-zinc-900 text-zinc-400 border-zinc-800">{res.status}</span>
            </div>
            {res.notes && <p className="text-zinc-500 bg-zinc-900/40 p-2 rounded italic text-[10px]">&quot;{res.notes}&quot;</p>}
          </div>
        ))}
      </div>
    </div>
  );
}