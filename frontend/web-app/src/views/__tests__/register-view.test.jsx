import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterView from '../RegisterView';
import { AuthProvider } from '../../context/AuthContext';

const navigateMock = vi.hoisted(() => vi.fn());
const registerMock = vi.hoisted(() => vi.fn(() => ({ unwrap: () => Promise.resolve({ userId: 'u1', token: 't1', restaurantId: null }) })));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('../../../../packages/shared/src/apiSlice.ts', () => ({
  useRegisterMutation: () => [registerMock, { isLoading: false }],
}));

function renderRegisterView() {
  return render(
    <AuthProvider>
      <RegisterView />
    </AuthProvider>
  );
}

async function fillForm(user, { email = 'manager@restaurant.com', password = 'password123', confirmPassword = 'password123' } = {}) {
  await user.type(screen.getByLabelText(/email address/i), email);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.type(screen.getByLabelText(/re-enter password/i), confirmPassword);
  await user.click(screen.getByRole('button', { name: /create account/i }));
}

describe('RegisterView validation', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    registerMock.mockClear();
  });

  it('rejects an invalid email format without calling the API', async () => {
    const user = userEvent.setup();
    renderRegisterView();

    await fillForm(user, { email: 'not-an-email' });

    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('rejects a password under 8 characters without calling the API', async () => {
    const user = userEvent.setup();
    renderRegisterView();

    await fillForm(user, { password: 'short1', confirmPassword: 'short1' });

    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords without calling the API', async () => {
    const user = userEvent.setup();
    renderRegisterView();

    await fillForm(user, { password: 'password123', confirmPassword: 'password456' });

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('submits when every field is valid', async () => {
    const user = userEvent.setup();
    renderRegisterView();

    await fillForm(user);

    expect(registerMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'manager@restaurant.com', password: 'password123' })
    );
  });
});
