import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordView from '../ForgotPasswordView';
import { AuthProvider } from '../../context/AuthContext';

const forgotPasswordMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('../../../../packages/shared/src/apiSlice.ts', () => ({
  useForgotPasswordMutation: () => [forgotPasswordMock, { isLoading: false }],
}));

function renderView() {
  return render(
    <AuthProvider>
      <ForgotPasswordView />
    </AuthProvider>
  );
}

describe('ForgotPasswordView', () => {
  beforeEach(() => {
    forgotPasswordMock.mockClear();
  });

  it('rejects an invalid email format without calling the API', async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(forgotPasswordMock).not.toHaveBeenCalled();
  });

  it('shows the generic failure message on an error without a message', async () => {
    forgotPasswordMock.mockReturnValue({
      unwrap: () => Promise.reject({ status: 404 }),
    });
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText(/email address/i), 'manager@demo.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/failed to send reset instructions/i)).toBeInTheDocument();
  });

  it('shows the generic success message on a real success', async () => {
    forgotPasswordMock.mockReturnValue({
      unwrap: () => Promise.resolve({ message: 'ok' }),
    });
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText(/email address/i), 'manager@demo.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(
      await screen.findByText(/if an account exists for that email/i)
    ).toBeInTheDocument();
    expect(forgotPasswordMock).toHaveBeenCalledWith({ email: 'manager@demo.com' });
  });
});
