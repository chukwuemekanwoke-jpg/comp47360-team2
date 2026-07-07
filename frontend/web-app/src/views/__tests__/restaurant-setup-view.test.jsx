import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RestaurantSetupView from '../RestaurantSetupView';
import { AuthProvider } from '../../context/AuthContext';

const navigateMock = vi.hoisted(() => vi.fn());
const createRestaurantMock = vi.hoisted(() =>
  vi.fn(() => ({ unwrap: () => Promise.resolve({ id: 'r1' }) }))
);

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('../../../../packages/shared/src/apiSlice.ts', () => ({
  useCreateRestaurantMutation: () => [createRestaurantMock, { isLoading: false }],
}));

function renderView() {
  return render(
    <AuthProvider>
      <RestaurantSetupView />
    </AuthProvider>
  );
}

const VALID = {
  name: 'Osteria Example',
  phone: '(212) 555-0100',
  latitude: '40.7589',
  longitude: '-73.9851',
  cuisine: 'Italian',
};

async function fillForm(user, overrides = {}) {
  const values = { ...VALID, ...overrides };
  await user.type(screen.getByLabelText(/restaurant name/i), values.name);
  await user.type(screen.getByLabelText(/^phone$/i), values.phone);
  if (values.latitude) await user.type(screen.getByLabelText(/latitude/i), values.latitude);
  if (values.longitude) await user.type(screen.getByLabelText(/longitude/i), values.longitude);
  await user.type(screen.getByLabelText(/^cuisine$/i), values.cuisine);
  await user.click(screen.getByRole('button', { name: /create restaurant/i }));
}

describe('RestaurantSetupView validation', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    createRestaurantMock.mockClear();
  });

  it('rejects an invalid phone number without calling the API', async () => {
    const user = userEvent.setup();
    renderView();

    await fillForm(user, { phone: '123' });

    expect(screen.getByText(/enter a valid phone number/i)).toBeInTheDocument();
    expect(createRestaurantMock).not.toHaveBeenCalled();
  });

  it('rejects a blank latitude instead of silently treating it as 0', async () => {
    const user = userEvent.setup();
    renderView();

    await fillForm(user, { latitude: '' });

    expect(screen.getByText(/latitude must be a number between -90 and 90/i)).toBeInTheDocument();
    expect(createRestaurantMock).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range longitude without calling the API', async () => {
    const user = userEvent.setup();
    renderView();

    await fillForm(user, { longitude: '200' });

    expect(screen.getByText(/longitude must be a number between -180 and 180/i)).toBeInTheDocument();
    expect(createRestaurantMock).not.toHaveBeenCalled();
  });

  it('submits when every field is valid', async () => {
    const user = userEvent.setup();
    renderView();

    await fillForm(user);

    expect(createRestaurantMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Osteria Example',
        phone: '(212) 555-0100',
        latitude: 40.7589,
        longitude: -73.9851,
        cuisine: 'Italian',
      })
    );
  });
});
