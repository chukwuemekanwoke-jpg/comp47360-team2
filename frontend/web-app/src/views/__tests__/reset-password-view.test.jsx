import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordView from '../ResetPasswordView';
import { AuthProvider } from '../../context/AuthContext';

const resetPasswordMock = vi.hoisted(() => vi.fn());
const useSearchParamsMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock('../../../../packages/shared/src/apiSlice.ts', () => ({
  useResetPasswordMutation: () => [resetPasswordMock, { isLoading: false }],
}));

function renderView() {
  return render(
    <AuthProvider>
      <ResetPasswordView />
    </AuthProvider>
  );
}

function withToken(token) {
  useSearchParamsMock.mockReturnValue([
    { get: (key) => (key === 'token' ? token : null) },
  ]);
}

describe('ResetPasswordView', () => {
  beforeEach(() => {
    resetPasswordMock.mockClear();
    withToken('valid-token-123');
  });

  it('shows an invalid-link message when no token is present in the URL', () => {
    withToken(null);
    renderView();

    expect(screen.getByText(/reset link is missing or invalid/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  it('rejects a password under 8 characters without calling the API', async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText(/new password/i), 'short1');
    await user.type(screen.getByLabelText(/re-enter password/i), 'short1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords without calling the API', async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/re-enter password/i), 'password456');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('shows the pending-backend message on a 404', async () => {
    resetPasswordMock.mockReturnValue({
      unwrap: () => Promise.reject({ status: 404 }),
    });
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/re-enter password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/pending backend support/i)).toBeInTheDocument();
  });

  it('shows a success message and calls the API with the token on success', async () => {
    resetPasswordMock.mockReturnValue({
      unwrap: () => Promise.resolve({ message: 'ok' }),
    });
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/re-enter password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/password has been reset/i)).toBeInTheDocument();
    expect(resetPasswordMock).toHaveBeenCalledWith({
      token: 'valid-token-123',
      newPassword: 'password123',
    });
  });
});
