import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginView from '../LoginView';
import { AuthProvider } from '../../context/AuthContext';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

function renderLoginView() {
  return render(
    <AuthProvider>
      <LoginView />
    </AuthProvider>
  );
}

describe('LoginView', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('shows an authentication error for invalid credentials', async () => {
    const user = userEvent.setup();
    renderLoginView();

    await user.type(screen.getByLabelText(/email address/i), 'guest@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in to tablé/i }));

    expect(
      screen.getByText(/invalid credentials\. use the demo manager credentials to continue\./i)
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('routes merchants into the dashboard with staging credentials', async () => {
    const user = userEvent.setup();
    renderLoginView();

    await user.type(screen.getByLabelText(/email address/i), 'merchant@table.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /sign in to tablé/i }));

    expect(navigateMock).toHaveBeenCalledWith('/merchant');
  });
});
