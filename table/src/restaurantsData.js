// Utility to dynamically serve gorgeous imagery based on your actual database category strings
const getPlaceholderImage = (categories) => {
  const primary = categories[0] || '';
  if (primary.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80';
  if (primary.includes('steak') || primary.includes('boucherie')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
  if (primary.includes('thai') || primary.includes('taiwanese') || primary.includes('asian')) return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80';
  if (primary.includes('italian')) return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
  if (primary.includes('burger') || primary.includes('chicken') || primary.includes('fast_food')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
  if (primary.includes('bagel') || primary.includes('diner')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80';
  if (primary.includes('halal')) return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80';
  if (primary.includes('hotel')) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
};

const rawData = [
  { name: "Joe's Pizza Broadway", full_address: "1435 Broadway, New York, NY 10018, USA", city: "New York", state: "NY", zip: "10018", lat: 40.7546795, lng: -73.9870291, category: ["pizza_restaurant"], price_level: "PRICE_LEVEL_INEXPENSIVE" },
  { name: "Din Tai Fung 鼎泰豐", full_address: "1633 Broadway, New York, NY 10019, USA", city: "New York", state: "NY", zip: "10019", lat: 40.7621135, lng: -73.9840022, category: ["taiwanese_restaurant"], price_level: "PRICE_LEVEL_MODERATE" },
  { name: "Ellen's Stardust Diner", full_address: "1650 Broadway, New York, NY 10019, USA", city: "New York", state: "NY", zip: "10019", lat: 40.7618723, lng: -73.9834356, category: ["diner"], price_level: "PRICE_LEVEL_MODERATE" },
  { name: "LOS TACOS No.1", full_address: "229 W 43rd St, New York, NY 10036, USA", city: "New York", state: "NY", zip: "10036", lat: 40.7573214, lng: -73.9876540, category: ["taco_restaurant"], price_level: "PRICE_LEVEL_INEXPENSIVE" },
  { name: "Raising Cane's Chicken Fingers", full_address: "1501 Broadway, New York, NY 10036, USA", city: "New York", state: "NY", zip: "10036", lat: 40.7573616, lng: -73.9862806, category: ["fast_food_restaurant"], price_level: "PRICE_LEVEL_INEXPENSIVE" },
  { name: "Hotel Riu Plaza Manhattan Times Square", full_address: "145 W 47th St, New York, NY 10036, USA", city: "New York", state: "NY", zip: "10036", lat: 40.7589022, lng: -73.9836073, category: ["hotel"], price_level: "PRICE_LEVEL_UNSPECIFIED" },
  { name: "La Grande Boucherie", full_address: "145 W 53rd St, New York, NY 10019, USA", city: "New York", state: "NY", zip: "10019", lat: 40.7626274, lng: -73.9808411, category: ["french_restaurant"], price_level: "PRICE_LEVEL_MODERATE" },
  { name: "Mitsuwa Marketplace - New Jersey", full_address: "595 River Rd, Edgewater, NJ 07020, USA", city: "New York", state: "NY", zip: "07020", lat: 40.8161915, lng: -73.9802240, category: ["asian_grocery_store"], price_level: "PRICE_LEVEL_UNSPECIFIED" },
  { name: "YOTEL New York Times Square", full_address: "570 Tenth Avenue At, W 42nd St, New York, NY 10036, USA", city: "New York", state: "NY", zip: "10036", lat: 40.7591608, lng: -73.9954657, category: ["hotel"], price_level: "PRICE_LEVEL_UNSPECIFIED" },
  { name: "Carmine's - Times Square", full_address: "200 W 44th St, New York, NY 10036, USA", city: "New York", state: "NY", zip: "10036", lat: 40.7574980, lng: -73.9866540, category: ["italian_restaurant"], price_level: "PRICE_LEVEL_MODERATE" },
  { name: "Liberty Bagels Midtown", full_address: "260 W 35th St, New York, NY 10001, USA", city: "New York", state: "NY", zip: "10001", lat: 40.7524936, lng: -73.9925297, category: ["bagel_shop"], price_level: "PRICE_LEVEL_INEXPENSIVE" },
  { name: "InterContinental New York Barclay by IHG", full_address: "111 E 48th St, New York, NY 10017, USA", city: "New York", state: "NY", zip: "10017", lat: 40.7556629, lng: -73.9735276, category: ["hotel"], price_level: "PRICE_LEVEL_UNSPECIFIED" },
  { name: "Mitr Thai Restaurant", full_address: "37 W 46th St, New York, NY 10036, USA", city: "New York", state: "NY", zip: "10036", lat: 40.7568769, lng: -73.9804147, category: ["thai_restaurant"], price_level: "PRICE_LEVEL_MODERATE" },
  { name: "InterContinental New York Times Square by IHG", full_address: "300 W 44th St, New York, NY 10036, USA", city: "New York", state: "NY", zip: "10036", lat: 40.7586608, lng: -73.9893761, category: ["hotel"], price_level: "PRICE_LEVEL_UNSPECIFIED" },
  { name: "Adel's Famous Halal Food", full_address: "1221 6th Ave, New York, NY 10020, USA", city: "New York", state: "NY", zip: "10020", lat: 40.7591946, lng: -73.9811521, category: ["halal_restaurant"], price_level: "PRICE_LEVEL_INEXPENSIVE" },
  { name: "Junior's Restaurant & Bakery", full_address: "1515 Broadway, W 45th St, New York, NY 10036, USA", city: "New York", state: "NY", zip: "10036", lat: 40.7583331, lng: -73.9866367, category: ["american_restaurant"], price_level: "PRICE_LEVEL_MODERATE" },
  { name: "Gallagher’s Steakhouse NYC", full_address: "228 W 52nd St, New York, NY 10019, USA", city: "New York", state: "NY", zip: "10019", lat: 40.7628486, lng: -73.9838549, category: ["steak_house"], price_level: "PRICE_LEVEL_VERY_EXPENSIVE" },
  { name: "Tavern On the Green", full_address: "Central Park, W 67th St, New York, NY 10023, USA", city: "New York", state: "NY", zip: "10023", lat: 40.7724202, lng: -73.9772631, category: ["american_restaurant"], price_level: "PRICE_LEVEL_EXPENSIVE" },
  { name: "Keens Steakhouse", full_address: "72 W 36th St., New York, NY 10018, USA", city: "New York", state: "NY", zip: "10018", lat: 40.7507861, lng: -73.9864611, category: ["steak_house"], price_level: "PRICE_LEVEL_VERY_EXPENSIVE" },
  { name: "Broad Nosh Bagels Deli & Catering 58th Street", full_address: "314 W 58th St, New York, NY 10019, USA", city: "New York", state: "NY", zip: "10019", lat: 40.7676542, lng: -73.9832955, category: ["bagel_shop"], price_level: "PRICE_LEVEL_INEXPENSIVE" }
];

export const restaurantDatabase = rawData.map((item, index) => ({
  id: index + 1,
  ...item,
  image_url: getPlaceholderImage(item.category)
}));

export default restaurantDatabase;