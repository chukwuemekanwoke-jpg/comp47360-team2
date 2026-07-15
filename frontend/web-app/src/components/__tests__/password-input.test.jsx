import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInput from '../PasswordInput';

describe('PasswordInput', () => {
  it('masks the value by default and reveals it on toggle click', async () => {
    const user = userEvent.setup();
    render(
      <PasswordInput
        id="password"
        value="secret123"
        onChange={() => {}}
        inputClassName=""
      />
    );

    const input = screen.getByDisplayValue('secret123');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input).toHaveAttribute('type', 'password');
  });
});
