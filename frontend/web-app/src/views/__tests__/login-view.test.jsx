import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginView from '../LoginView';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

describe('LoginView', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('shows an authentication error for invalid credentials', async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    await user.type(screen.getByLabelText(/email address/i), 'guest@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in to tablé/i }));

    expect(screen.getByText(/invalid authentication pairing/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('routes merchants into the dashboard with staging credentials', async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    await user.type(screen.getByLabelText(/email address/i), 'merchant@table.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /sign in to tablé/i }));

    expect(navigateMock).toHaveBeenCalledWith('/merchant');
  });

  it('routes users to registration from the secondary action', async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    await user.click(screen.getByRole('button', { name: /create an account/i }));
    expect(navigateMock).toHaveBeenCalledWith('/register');
  });
});
