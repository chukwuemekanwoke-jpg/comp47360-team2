import React, { useState } from 'react';
import SearchBar from './SearchBar';
import FilterSidebar from './FilterSidebar';
import RestaurantCard from './RestaurantCard';

export default function DinerExplore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFallback, setLocationFallback] = useState('');

  const mockRestaurants = [
    { id: 1, name: "Osteria Morini", cuisine: "Italian", neighborhood: "SoHo", distance: "0.8 mi", hasLullDeal: true, accessibility: ["Step-Free Entry", "Spacious Restroom"] },
    { id: 2, name: "L'Artusi", cuisine: "Italian", neighborhood: "West Village", distance: "1.2 mi", hasLullDeal: false, accessibility: ["Low Noise Level"] },
    { id: 3, name: "Sugarfish", cuisine: "Sushi", neighborhood: "Flatiron", distance: "0.5 mi", hasLullDeal: true, accessibility: ["Step-Free Entry"] }
  ];

  return (
    <div className="w-full flex flex-col h-full space-y-6">
      <SearchBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        locationFallback={locationFallback} 
        setLocationFallback={setLocationFallback} 
      />
      <div className="flex flex-col md:flex-row items-start gap-6 flex-1 overflow-hidden">
        <FilterSidebar />
        <div className="flex-1 w-full overflow-y-auto h-full pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRestaurants.map(rest => (
              <RestaurantCard key={rest.id} restaurant={rest} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}