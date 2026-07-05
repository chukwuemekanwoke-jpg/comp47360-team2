import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../SearchBar';
import FilterSidebar from '../FilterSidebar';
import RestaurantCard from '../RestaurantCard';
import OccupancyMeter from '../OccupancyMeter';

describe('discovery components', () => {
  it('updates search and starting point inputs', async () => {
    const user = userEvent.setup();
    const setSearchQuery = vi.fn();
    const setLocationFallback = vi.fn();

    render(
      <SearchBar
        searchQuery=""
        setSearchQuery={setSearchQuery}
        locationFallback=""
        setLocationFallback={setLocationFallback}
      />
    );

    await user.type(screen.getByLabelText(/search/i), 'sushi');
    await user.type(screen.getByLabelText(/starting point/i), 'Manhattan');

    expect(setSearchQuery).toHaveBeenCalled();
    expect(setLocationFallback).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /find tables/i })).toBeInTheDocument();
  });

  it('renders consumer filter groups and accessibility filters', () => {
    render(<FilterSidebar />);

    expect(screen.getByText(/vibe & cuisine/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sushi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/step-free entry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/low noise level/i)).toBeInTheDocument();
  });

  it('shows restaurant summary, distance, lull deal, and accessibility tags', () => {
    render(
      <RestaurantCard
        restaurant={{
          name: 'Mercer Room',
          cuisine: 'Omakase',
          neighborhood: 'SoHo',
          distance: '0.8 km',
          hasLullDeal: true,
          accessibility: ['Step-free', 'Quiet table'],
        }}
      />
    );

    expect(screen.getByText('Mercer Room')).toBeInTheDocument();
    expect(screen.getByText(/omakase .* soho/i)).toBeInTheDocument();
    expect(screen.getByText('0.8 km')).toBeInTheDocument();
    expect(screen.getByText(/lull match/i)).toBeInTheDocument();
    expect(screen.getByText('Step-free')).toBeInTheDocument();
  });

  it('summarizes occupancy percentages and empty state', () => {
    const { rerender } = render(
      <OccupancyMeter
        occupancyData={{
          'Room 1': { available: 2, total: 4 },
          Patio: { available: 0, total: 3 },
        }}
      />
    );

    expect(screen.getByText('Room 1')).toBeInTheDocument();
    expect(screen.getByText('Patio')).toBeInTheDocument();
    expect(
      screen.getByText((_, node) => node?.tagName.toLowerCase() === 'div' && node.textContent.replace(/\s+/g, ' ').trim() === '2 / 4')
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, node) => node?.tagName.toLowerCase() === 'div' && node.textContent.replace(/\s+/g, ' ').trim() === '0 / 3')
    ).toBeInTheDocument();

    rerender(<OccupancyMeter occupancyData={{}} />);
    expect(screen.getByText(/no zones configured/i)).toBeInTheDocument();
  });
});
