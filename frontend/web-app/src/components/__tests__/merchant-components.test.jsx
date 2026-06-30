import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardHeader from '../DashboardHeader';
import ActivityLog from '../ActivityLog';
import RoomConfigPanel from '../RoomConfigPanel';
import TableNode from '../TableNode';
import TableGrid from '../TableGrid';
import TableControl from '../TableControl';
import AnalyticsView from '../AnalyticsView';
import SettingsPanel from '../SettingsPanel';

describe('merchant dashboard components', () => {
  it('updates the restaurant tagline and toggles live booking state', async () => {
    const user = userEvent.setup();
    const onToggleLive = vi.fn();

    render(<DashboardHeader name="Mercer Room" isLive onToggleLive={onToggleLive} />);

    expect(screen.getByText('Mercer Room')).toBeInTheDocument();
    expect(screen.getByText(/accepting app bookings/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/brief restaurant description/i), 'Counter for two');
    expect(screen.getByDisplayValue('Counter for two')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(onToggleLive).toHaveBeenCalledTimes(1);
  });

  it('renders live reservation activity with notes', () => {
    render(
      <ActivityLog
        reservations={[
          { id: 1, guest: 'Ava Chen', time: '19:30', covers: 2, status: 'Confirmed', notes: 'Window table' },
        ]}
      />
    );

    expect(screen.getByText(/live activity log/i)).toBeInTheDocument();
    expect(screen.getByText('Ava Chen')).toBeInTheDocument();
    expect(screen.getByText(/19:30/)).toBeInTheDocument();
    expect(screen.getByText(/window table/i)).toBeInTheDocument();
  });

  it('edits, removes, and adds rooms from the configuration panel', async () => {
    const user = userEvent.setup();
    const onUpdateName = vi.fn();
    const onRemoveRoom = vi.fn();
    const onAddRoom = vi.fn();

    render(
      <RoomConfigPanel
        roomConfig={[{ id: 1, defaultLabel: 'Room 1', customLabel: 'Main Room' }]}
        onUpdateName={onUpdateName}
        onRemoveRoom={onRemoveRoom}
        onAddRoom={onAddRoom}
      />
    );

    await user.clear(screen.getByDisplayValue('Main Room'));
    await user.type(screen.getByPlaceholderText('Room 1'), 'Counter');
    await user.click(screen.getByTitle(/remove room/i));
    await user.click(screen.getByRole('button', { name: /add new room/i }));

    expect(onUpdateName).toHaveBeenCalled();
    expect(onRemoveRoom).toHaveBeenCalledWith(1);
    expect(onAddRoom).toHaveBeenCalledTimes(1);
  });

  it('opens a table and adjusts capacity without triggering the open handler', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onAdjustCapacity = vi.fn();

    render(
      <TableNode
        table={{ id: 4, label: 'Table-4', type: 'Round', capacity: 2, status: 'Available' }}
        onOpen={onOpen}
        onAdjustCapacity={onAdjustCapacity}
        activeFlashDeals={{}}
      />
    );

    await user.click(screen.getByText('Table-4'));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }));

    await user.click(screen.getByRole('button', { name: '+' }));
    expect(onAdjustCapacity).toHaveBeenCalledWith(4, 1);
  });

  it('shows active flash deal countdowns on tables', async () => {
    render(
      <TableNode
        table={{ id: 2, label: 'Table-2', type: 'Square', capacity: 4, status: 'Available' }}
        onOpen={vi.fn()}
        onAdjustCapacity={vi.fn()}
        activeFlashDeals={{ 2: new Date(Date.now() + 20 * 60000) }}
      />
    );

    expect(await screen.findByText(/flash deal active until/i)).toBeInTheDocument();
  });

  it('supports room switching, adding tables, and confirmed removal', async () => {
    const user = userEvent.setup();
    const onAddTable = vi.fn();
    const onRemoveTable = vi.fn();
    const setActiveZone = vi.fn();
    const setIsConfigOpen = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <TableGrid
        tables={[{ id: 1, label: 'Table-1', type: 'Square', capacity: 2, status: 'Available' }]}
        onOpen={vi.fn()}
        activeZones={['Room 1', 'Room 2']}
        activeZone="Room 1"
        setActiveZone={setActiveZone}
        isConfigOpen={false}
        setIsConfigOpen={setIsConfigOpen}
        roomConfig={[]}
        onUpdateName={vi.fn()}
        onRemoveRoom={vi.fn()}
        onAddRoom={vi.fn()}
        onAddTable={onAddTable}
        onRemoveTable={onRemoveTable}
        onAdjustCapacity={vi.fn()}
        onUpdateTableLabel={vi.fn()}
        activeFlashDeals={{}}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Room 2' }));
    await user.click(screen.getByRole('button', { name: /add table/i }));
    await user.click(screen.getByRole('button', { name: /remove table/i }));
    await user.click(screen.getByRole('button', { name: '✕' }));

    expect(setActiveZone).toHaveBeenCalledWith('Room 2');
    expect(onAddTable).toHaveBeenCalledWith('Room 1');
    expect(onRemoveTable).toHaveBeenCalledWith(1);

    window.confirm.mockRestore();
  });

  it('broadcasts flash deals, edits settings, and toggles slots from the table control', async () => {
    const user = userEvent.setup();
    const setSelectedTable = vi.fn();
    const setOverlayActiveTab = vi.fn();
    const setDiscountPercent = vi.fn();
    const setTimeWindow = vi.fn();
    const handleBroadcastFlashDiscount = vi.fn();
    const toggleSlotStatus = vi.fn();
    const handleSaveTableDetails = vi.fn((event) => event.preventDefault());
    const setEditLabel = vi.fn();
    const setEditType = vi.fn();
    const setEditCapacity = vi.fn();

    const baseProps = {
      selectedTable: { id: 1, label: 'Table-1' },
      setSelectedTable,
      overlayActiveTab: 'discount',
      setOverlayActiveTab,
      discountPercent: 15,
      setDiscountPercent,
      timeWindow: 30,
      setTimeWindow,
      handleBroadcastFlashDiscount,
      activeTableSchedule: [{ time: '7:00 PM - 9:00 PM', status: 'Available' }],
      toggleSlotStatus,
      handleSaveTableDetails,
      editLabel: 'Table-1',
      setEditLabel,
      editType: 'Square',
      setEditType,
      editCapacity: 2,
      setEditCapacity,
    };

    const { rerender } = render(<TableControl {...baseProps} />);
    await user.click(screen.getByRole('button', { name: '20%' }));
    await user.click(screen.getByRole('button', { name: /45 mins/i }));
    await user.click(screen.getByRole('button', { name: /broadcast live deal/i }));
    expect(setDiscountPercent).toHaveBeenCalledWith(20);
    expect(setTimeWindow).toHaveBeenCalledWith(45);
    expect(handleBroadcastFlashDiscount).toHaveBeenCalledTimes(1);

    rerender(<TableControl {...baseProps} overlayActiveTab="slots" />);
    await user.click(screen.getByRole('button', { name: /open/i }));
    expect(toggleSlotStatus).toHaveBeenCalledWith('7:00 PM - 9:00 PM');

    rerender(<TableControl {...baseProps} overlayActiveTab="settings" />);
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: /save table/i }));
    expect(setEditCapacity).toHaveBeenCalledWith(3);
    expect(handleSaveTableDetails).toHaveBeenCalled();
  });

  it('changes analytics timeframe and renders core metrics', async () => {
    const user = userEvent.setup();
    const setAnalyticsTimeframe = vi.fn();

    render(
      <AnalyticsView
        analyticsTimeframe="Today"
        setAnalyticsTimeframe={setAnalyticsTimeframe}
        timeframeMetrics={{
          covers: '40',
          growth: '+8%',
          revenue: '$1,200',
          newDiners: '35%',
          returnDiners: '65%',
        }}
      />
    );

    expect(screen.getByText('$1,200')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /this week/i }));
    expect(setAnalyticsTimeframe).toHaveBeenCalledWith('Week');
  });

  it('updates menu, accessibility, and allergen settings', async () => {
    const user = userEvent.setup();
    const setUploadedMenu = vi.fn();
    const setAccessibility = vi.fn((updater) => updater({ wheelchairEntrance: true }));
    const setAllergens = vi.fn((updater) => updater({ nuts: false }));

    render(
      <SettingsPanel
        uploadedMenu={null}
        setUploadedMenu={setUploadedMenu}
        accessibility={{ wheelchairEntrance: true }}
        setAccessibility={setAccessibility}
        allergenMeta={[{ key: 'nuts', label: 'Tree Nuts & Peanuts', icon: 'N' }]}
        allergens={{ nuts: false }}
        setAllergens={setAllergens}
      />
    );

    const input = screen.getByLabelText(/choose file/i);
    await user.upload(input, new File(['menu'], 'menu.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByText(/wheelchair entrance/i));
    await user.click(screen.getByText(/tree nuts/i));

    expect(setUploadedMenu).toHaveBeenCalledWith('menu.pdf');
    expect(setAccessibility).toHaveBeenCalled();
    expect(setAllergens).toHaveBeenCalled();
  });
});
