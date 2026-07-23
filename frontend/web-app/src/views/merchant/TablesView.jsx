import { useOutletContext } from 'react-router-dom';
import OccupancyMeter from '../../components/OccupancyMeter';
import BookingsList from '../../components/BookingsList';

export default function TablesView() {
  const { restaurantId, restaurant } = useOutletContext();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="space-y-6">
        {restaurant && (
          <OccupancyMeter available={restaurant.availableTableCount} capacity={restaurant.capacity} />
        )}
      </div>
      <div className="space-y-6">
        <BookingsList restaurantId={restaurantId} />
      </div>
    </div>
  );
}
