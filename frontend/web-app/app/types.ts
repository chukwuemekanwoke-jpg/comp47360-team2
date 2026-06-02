export type ViewId = "discovery" | "booking" | "deals";

export type RestaurantId = "mercer" | "juniper" | "orchard";

export type NavItem = {
  id: ViewId;
  label: string;
  index: string;
  backgroundImage: string;
};

export type Restaurant = {
  id: RestaurantId;
  name: string;
  category: string;
  distance: string;
  availableTables: number;
  etaMinutes: number;
  mapX: string;
  mapY: string;
};

export type FlashDeal = {
  id: string;
  venue: string;
  title: string;
  countdown: string;
  seats: string;
};
