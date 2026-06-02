import type { FlashDeal, NavItem, Restaurant } from "./types";

export const imageAssets = {
  bookingHero: "/images/booking-hero-bg.jpg",
  discoveryRadar: "/images/discovery-radar-bg.jpg",
  flashDeals: "/images/flash-deals-bg.jpg"
} as const;

export const navItems: NavItem[] = [
  {
    id: "discovery",
    label: "Discovery",
    index: "01",
    backgroundImage: "/images/sidebar-discovery-bg.jpg"
  },
  {
    id: "booking",
    label: "Booking",
    index: "02",
    backgroundImage: "/images/sidebar-booking-bg.jpg"
  },
  {
    id: "deals",
    label: "Flash Deals",
    index: "03",
    backgroundImage: "/images/sidebar-deals-bg.jpg"
  }
];

// Backend handoff: these arrays mirror the shape expected from future API responses.
export const restaurants: Restaurant[] = [
  {
    id: "mercer",
    name: "Mercer Room",
    category: "Omakase Bar",
    distance: "0.9 km",
    availableTables: 2,
    etaMinutes: 12,
    mapX: "67%",
    mapY: "34%"
  },
  {
    id: "juniper",
    name: "Juniper House",
    category: "Wine Table",
    distance: "0.4 km",
    availableTables: 3,
    etaMinutes: 8,
    mapX: "38%",
    mapY: "54%"
  },
  {
    id: "orchard",
    name: "Orchard & Rye",
    category: "Dining Room",
    distance: "1.2 km",
    availableTables: 1,
    etaMinutes: 14,
    mapX: "58%",
    mapY: "72%"
  }
];

export const flashDeals: FlashDeal[] = [
  {
    id: "counter",
    venue: "Mercer Room",
    title: "30% OFF Counter",
    countdown: "14:32",
    seats: "2 seats"
  },
  {
    id: "wine",
    venue: "Juniper House",
    title: "Wine Table Release",
    countdown: "08:10",
    seats: "3 seats"
  },
  {
    id: "late",
    venue: "Orchard & Rye",
    title: "Late Seating",
    countdown: "21:00",
    seats: "1 table"
  },
  {
    id: "window",
    venue: "Aster Hall",
    title: "Window Table",
    countdown: "05:44",
    seats: "2 seats"
  }
];
