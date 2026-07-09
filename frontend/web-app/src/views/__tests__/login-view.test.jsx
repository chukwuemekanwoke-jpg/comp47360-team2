import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginView from '../LoginView';
import { AuthProvider } from '../../context/AuthContext';

const navigateMock = vi.hoisted(() => vi.fn());
const loginMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('../../../../packages/shared/src/apiSlice.ts', () => ({
  useLoginMutation: () => [loginMock, { isLoading: false }],
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
    loginMock.mockClear();
  });

  it('rejects an invalid email format without calling the API', async () => {
    const user = userEvent.setup();
    renderLoginView();

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in to tablé/i }));

    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('shows the server error message for invalid credentials', async () => {
    loginMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { error: { message: 'Invalid email or password' } } }),
    });
    const user = userEvent.setup();
    renderLoginView();

    await user.type(screen.getByLabelText(/email address/i), 'manager@demo.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in to tablé/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('routes to the dashboard on a real successful login', async () => {
    loginMock.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ userId: 'u1', token: 't1', restaurantId: 'r1' }),
    });
    const user = userEvent.setup();
    renderLoginView();

    await user.type(screen.getByLabelText(/email address/i), 'manager@demo.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in to tablé/i }));

    expect(loginMock).toHaveBeenCalledWith({ email: 'manager@demo.com', password: 'password123' });
    expect(navigateMock).toHaveBeenCalledWith('/merchant');
  });
});
