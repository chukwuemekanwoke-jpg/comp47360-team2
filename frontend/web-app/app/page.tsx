"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useState } from "react";

import { flashDeals, imageAssets, navItems, restaurants } from "./data";
import type { FlashDeal, RestaurantId, ViewId } from "./types";

const spring = { type: "spring", stiffness: 260, damping: 28 } as const;

function CursorGlow() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 90, damping: 28 });
  const smoothY = useSpring(y, { stiffness: 90, damping: 28 });

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    x.set(event.clientX - 220);
    y.set(event.clientY - 220);
  }

  return (
    <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" onMouseMove={handleMove}>
      <motion.div
        className="h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.13),transparent_68%)] blur-3xl"
        style={{ x: smoothX, y: smoothY }}
      />
    </motion.div>
  );
}

function Sidebar({ active, setActive }: { active: ViewId; setActive: (id: ViewId) => void }) {
  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[280px] flex-col justify-between border-r border-white/10 bg-[#0a0a0a]/95 px-7 py-8 backdrop-blur-xl">
      <div>
        <button
          type="button"
          onClick={() => setActive("discovery")}
          className="font-serif text-[42px] leading-none text-[#f5efe2] transition-colors hover:text-[#D4AF37]"
        >
          Tablé
        </button>
        <p className="mt-3 text-xs uppercase tracking-[0.32em] text-gray-600">Fine dining access</p>
      </div>

      <nav className="grid gap-3">
        {navItems.map((item) => (
          <motion.button
            type="button"
            key={item.id}
            onClick={() => setActive(item.id)}
            whileHover={{ x: 6 }}
            transition={spring}
            className={`group relative overflow-hidden border px-5 py-4 text-left transition ${
              active === item.id
                ? "border-[#D4AF37]/50 text-[#f5efe2] shadow-[0_0_34px_rgba(212,175,55,0.08)]"
                : "border-white/10 text-stone-500 hover:border-[#D4AF37]/30 hover:text-[#f5efe2]"
            }`}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center brightness-125 saturate-110"
              style={{ backgroundImage: `url(${item.backgroundImage})` }}
            />
            <div className="absolute inset-0 bg-[#0a0a0a]/74 transition-colors duration-500 group-hover:bg-[#0a0a0a]/64" />
            <span className="pointer-events-none absolute inset-y-0 -right-14 z-10 w-28 bg-[#D4AF37]/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
            <span className="relative z-10 text-xs text-[#D4AF37]">{item.index}</span>
            <span className="relative z-10 mt-2 block font-serif text-2xl">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      <div>
        <div className="border border-white/10 bg-white/[0.025] p-5">
          <p className="font-mono text-2xl text-[#D4AF37] tabular-nums">19:42</p>
          <p className="mt-2 text-sm text-stone-500">Manhattan service window</p>
        </div>
        <button type="button" className="mt-5 text-xs text-gray-600 transition-colors hover:text-[#D4AF37]">
          Merchant Portal
        </button>
      </div>
    </aside>
  );
}

function RadarMap({ hovered, setHovered }: { hovered: RestaurantId | null; setHovered: (id: RestaurantId | null) => void }) {
  return (
    <section className="sticky top-8 h-[calc(100vh-4rem)] overflow-hidden border border-white/10 bg-[#0f0f0e] shadow-2xl shadow-black/50">
      <div
        aria-hidden="true"
        className="absolute -inset-8 bg-cover bg-center blur-md brightness-125 saturate-110"
        style={{ backgroundImage: `url(${imageAssets.discoveryRadar})` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center opacity-55 brightness-110 saturate-110"
        style={{ backgroundImage: `url(${imageAssets.discoveryRadar})` }}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(30deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:72px_72px,96px_96px]" />

      <div className="absolute inset-12 border border-white/10 bg-white/[0.025] backdrop-blur-[1px]" />
      <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-white/[0.025] backdrop-blur-[1px]" />
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-white/[0.02] backdrop-blur-[1px]" />
      <div className="absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-white/[0.015] backdrop-blur-[1px]" />

      {restaurants.map((restaurant) => {
        const active = hovered === restaurant.id;
        return (
          <motion.button
            type="button"
            key={restaurant.id}
            onMouseEnter={() => setHovered(restaurant.id)}
            onMouseLeave={() => setHovered(null)}
            animate={{
              scale: active ? 1.45 : [1, 1.15, 1],
              boxShadow: active
                ? "0 0 0 18px rgba(212,175,55,0.16), 0 0 52px rgba(212,175,55,0.62)"
                : "0 0 0 8px rgba(212,175,55,0.08), 0 0 28px rgba(212,175,55,0.28)"
            }}
            transition={{ duration: active ? 0.24 : 2.4, repeat: active ? 0 : Infinity }}
            className="absolute z-10 grid h-8 w-8 place-items-center rounded-full border border-[#D4AF37]/70 bg-[#D4AF37] font-mono text-xs font-bold text-black tabular-nums"
            style={{ left: restaurant.mapX, top: restaurant.mapY }}
            aria-label={restaurant.name}
          >
            {restaurant.availableTables}
          </motion.button>
        );
      })}

      <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#D4AF37]">Live radius</p>
          <h2 className="mt-3 font-serif text-7xl font-normal text-[#f5efe2]">1.5 km</h2>
        </div>
        <p className="font-mono text-sm text-stone-500 tabular-nums">3 rooms available</p>
      </div>
    </section>
  );
}

function Discovery({ setActive }: { setActive: (id: ViewId) => void }) {
  const [hovered, setHovered] = useState<RestaurantId | null>(restaurants[0].id);

  return (
    <div className="grid grid-cols-[minmax(360px,40%)_minmax(0,60%)] gap-8">
      <section className="min-h-screen pb-10">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.34em] text-[#D4AF37]">Discovery</p>
          <h1 className="mt-5 max-w-xl font-serif text-7xl font-normal leading-[0.9] text-[#f5efe2]">
            Tonight, nearby.
          </h1>
        </header>

        <div className="grid gap-5">
          {restaurants.map((restaurant) => (
            <motion.button
              type="button"
              key={restaurant.id}
              onMouseEnter={() => setHovered(restaurant.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setActive("booking")}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.985 }}
              transition={spring}
              className={`group relative overflow-hidden border bg-white/[0.025] p-5 text-left backdrop-blur-xl ${
                hovered === restaurant.id
                  ? "border-[#D4AF37]/50 shadow-[0_0_44px_rgba(212,175,55,0.12)]"
                  : "border-white/10"
              }`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(212,175,55,0.15),transparent_32%),linear-gradient(135deg,#15120f,#050505_72%)] opacity-35" />
              <div className="relative z-10 flex items-end justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{restaurant.distance}</p>
                  <h2 className="mt-4 font-serif text-4xl font-normal text-[#f5efe2]">{restaurant.name}</h2>
                  <p className="mt-2 text-sm text-stone-400">{restaurant.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg text-[#D4AF37] tabular-nums">ETA {restaurant.etaMinutes}</p>
                  <p className="mt-2 text-sm text-stone-300">✓ {restaurant.availableTables} tables</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <RadarMap hovered={hovered} setHovered={setHovered} />
    </div>
  );
}

function Booking() {
  const [eta, setEta] = useState<"success" | "danger">("success");
  const success = eta === "success";

  return (
    <section>
      <div className="relative h-[430px] overflow-hidden border border-white/10 bg-[#11100e]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center brightness-90 saturate-95"
          style={{ backgroundImage: `url(${imageAssets.bookingHero})` }}
        />
        <div className="absolute inset-0 bg-black/18" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/78 to-transparent" />
        <div className="absolute bottom-8 left-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Mercer Room</p>
          <h1 className="mt-4 font-serif text-8xl font-normal leading-[0.88] text-[#f5efe2]">Counter for two.</h1>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)_420px] gap-8">
        <div className="grid content-start gap-8">
          <div className="border border-white/10 bg-white/[0.025] p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Omakase Bar</p>
            <h2 className="mt-5 font-serif text-6xl font-normal leading-none text-[#f5efe2]">
              Private counter, low light, two seats.
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {["0.9 km", "15 min hold", "2 seats"].map((item) => (
              <div key={item} className="border border-white/10 bg-white/[0.025] p-6">
                <p className="font-mono text-2xl text-[#D4AF37] tabular-nums">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.aside
          layout
          className="sticky top-8 overflow-hidden border border-white/10 bg-white/[0.045] p-7 shadow-2xl shadow-black/40 backdrop-blur-2xl"
        >
          <div className="mb-7 flex gap-3">
            <button
              type="button"
              onClick={() => setEta("success")}
              className={`flex-1 border px-4 py-3 font-mono text-sm tabular-nums ${
                success ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/10 text-stone-500"
              }`}
            >
              ETA 12
            </button>
            <button
              type="button"
              onClick={() => setEta("danger")}
              className={`flex-1 border px-4 py-3 font-mono text-sm tabular-nums ${
                !success ? "border-red-400/40 bg-red-950/20 text-red-300" : "border-white/10 text-stone-500"
              }`}
            >
              ETA 25
            </button>
          </div>

          <motion.div
            key={eta}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={spring}
            className={`mb-7 rounded-full border px-6 py-5 text-center ${
              success
                ? "border-[#D4AF37]/45 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_48px_rgba(212,175,55,0.16)]"
                : "border-red-400/35 bg-red-950/20 text-red-300 shadow-inner"
            }`}
          >
            <p className="font-mono text-6xl tabular-nums">{success ? "12" : "25"}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.28em] text-stone-500">mins</p>
          </motion.div>

          <motion.button
            type="button"
            disabled={!success}
            whileTap={success ? { scale: 0.96 } : {}}
            className={`h-14 w-full font-semibold ${
              success
                ? "bg-[#D4AF37] text-black shadow-[0_0_36px_rgba(212,175,55,0.22)]"
                : "cursor-not-allowed bg-stone-900 text-stone-600 shadow-inner"
            }`}
          >
            Confirm Booking
          </motion.button>
        </motion.aside>
      </div>
    </section>
  );
}

function QRPanel() {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 220, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={spring}
      className="relative mt-6 overflow-hidden border border-[#D4AF37]/30 bg-[#0f0f0e]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(212,175,55,0.12)_1px,transparent_1px),linear-gradient(180deg,rgba(212,175,55,0.12)_1px,transparent_1px)] bg-[length:24px_24px]" />
      <motion.div
        className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#D4AF37]/30 to-transparent"
        animate={{ y: [0, 180, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative z-10 grid h-full place-items-center">
        <div className="text-center">
          <p className="font-mono text-4xl text-[#D4AF37] tabular-nums">TBL-4821</p>
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-stone-500">Scan to redeem</p>
        </div>
      </div>
    </motion.div>
  );
}

function DealCard({ deal }: { deal: FlashDeal }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <motion.article
      layout
      whileHover={{ scale: 1.025 }}
      transition={spring}
      className="group relative overflow-hidden border border-white/10 bg-white/[0.025] p-6 hover:border-[#D4AF37]/45 hover:shadow-[0_0_48px_rgba(212,175,55,0.12)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(212,175,55,0.12),transparent_28%)] opacity-0 transition group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">{deal.venue}</p>
            <h2 className="mt-4 font-serif text-4xl font-normal leading-none text-[#f5efe2]">{deal.title}</h2>
            <p className="mt-4 text-sm text-stone-500">{deal.seats}</p>
          </div>
          <motion.p
            animate={{
              opacity: [1, 0.48, 1],
              textShadow: [
                "0 0 0 rgba(212,175,55,0)",
                "0 0 22px rgba(212,175,55,0.55)",
                "0 0 0 rgba(212,175,55,0)"
              ]
            }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="font-mono text-4xl text-[#D4AF37] tabular-nums"
          >
            {deal.countdown}
          </motion.p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setAccepted((value) => !value)}
          className="mt-8 h-12 w-full bg-[#D4AF37] font-semibold text-black"
        >
          {accepted ? "Cancel Deal" : "Accept Deal"}
        </motion.button>

        <AnimatePresence>{accepted ? <QRPanel /> : null}</AnimatePresence>
      </div>
    </motion.article>
  );
}

function Deals() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden border border-white/10 p-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center brightness-110 saturate-110"
        style={{ backgroundImage: `url(${imageAssets.flashDeals})` }}
      />
      <div className="absolute inset-0 bg-black/72" />
      <div className="relative z-10">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.34em] text-[#D4AF37]">Flash Deal Inbox</p>
          <h1 className="mt-5 font-serif text-7xl font-normal leading-[0.9] text-[#f5efe2]">Limited rooms.</h1>
        </header>
        <div className="grid grid-cols-2 gap-6 xl:grid-cols-3">
          {flashDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ActivePage({ active, setActive }: { active: ViewId; setActive: (id: ViewId) => void }) {
  if (active === "booking") return <Booking />;
  if (active === "deals") return <Deals />;
  return <Discovery setActive={setActive} />;
}

export default function TableDesktopApp() {
  const [active, setActive] = useState<ViewId>("discovery");

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f5efe2]">
      <CursorGlow />
      <Sidebar active={active} setActive={setActive} />
      <section className="relative z-10 ml-[280px] min-h-screen px-10 py-8">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={spring}
            >
              <ActivePage active={active} setActive={setActive} />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
