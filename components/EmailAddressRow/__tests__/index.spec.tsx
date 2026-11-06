import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import EmailAddressRow from '..';

expect.extend(toHaveNoViolations);

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

describe('EmailAddressRow', () => {
  it('should render the primary email with the primary badge and no status, make primary or delete controls', () => {
    render(<EmailAddressRow email="me@test.com" isAlias={false} deleteDisabled />);

    expect(screen.getByText('me@test.com')).toBeInTheDocument();
    expect(screen.getByText('primaryBadge')).toBeInTheDocument();
    expect(screen.queryByText('confirmedBadge')).not.toBeInTheDocument();
    expect(screen.queryByText('unconfirmedBadge')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'linkMakePrimary' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'deleteEmailAria' })).not.toBeInTheDocument();
  });

  it('should show a confirmed alias with the confirmed badge and the make primary action', () => {
    const makePrimaryEmail = jest.fn();
    render(
      <EmailAddressRow
        email="alias@test.com"
        isAlias
        isConfirmed
        makePrimaryEmail={makePrimaryEmail}
        resendConfirmation={jest.fn()}
      />
    );

    expect(screen.getByText('confirmedBadge')).toBeInTheDocument();
    expect(screen.queryByText('unconfirmedBadge')).not.toBeInTheDocument();
    expect(screen.queryByText('unconfirmedEmailDesc')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'btnResendVerification' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'unconfirmedInfoAria' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'linkMakePrimary' }));
    expect(makePrimaryEmail).toHaveBeenCalledWith('alias@test.com');
  });

  it('should show an unconfirmed alias with the unconfirmed badge, explanation and resend action, but no make primary', () => {
    render(
      <EmailAddressRow
        email="alias@test.com"
        isAlias
        isConfirmed={false}
        makePrimaryEmail={jest.fn()}
        resendConfirmation={jest.fn()}
      />
    );

    expect(screen.getByText('unconfirmedBadge')).toBeInTheDocument();
    expect(screen.getByText('unconfirmedEmailDesc')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'unconfirmedInfoAria' })).toBeInTheDocument();
    expect(screen.queryByText('confirmedBadge')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'linkMakePrimary' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'btnResendVerification' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'deleteEmailAria' })).toBeInTheDocument();
  });

  it('should explain why the alias is unconfirmed in a popover when the info button is pressed', async () => {
    const user = userEvent.setup();
    render(<EmailAddressRow email="alias@test.com" isAlias isConfirmed={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'unconfirmedInfoAria' }));

    expect(await screen.findByRole('dialog', { name: 'unconfirmedBadge' })).toHaveTextContent('unconfirmedTooltip');
  });

  it('should open the unconfirmed popover from the keyboard and close it with Escape, returning focus', async () => {
    const user = userEvent.setup();
    render(<EmailAddressRow email="alias@test.com" isAlias isConfirmed={false} />);

    await user.tab();
    const infoButton = screen.getByRole('button', { name: 'unconfirmedInfoAria' });
    expect(infoButton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(await screen.findByRole('dialog', { name: 'unconfirmedBadge' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(infoButton).toHaveFocus();
    });
  });

  it('should not show the resend action when no resend handler is provided', () => {
    render(<EmailAddressRow email="alias@test.com" isAlias isConfirmed={false} />);

    expect(screen.getByText('unconfirmedBadge')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'btnResendVerification' })).not.toBeInTheDocument();
  });

  it('should call the resend handler, show a pending sending label, and keep focus on the button', async () => {
    const user = userEvent.setup();
    let finishResend!: () => void;
    const resendConfirmation = jest.fn(
      () => new Promise<void>((resolve) => { finishResend = resolve; })
    );
    render(
      <EmailAddressRow
        email="alias@test.com"
        isAlias
        isConfirmed={false}
        resendConfirmation={resendConfirmation}
      />
    );

    const resendButton = screen.getByRole('button', { name: 'btnResendVerification' });
    resendButton.focus();
    await user.keyboard('{Enter}');

    expect(resendConfirmation).toHaveBeenCalledWith('alias@test.com');
    expect(resendButton).toHaveTextContent('btnResendingVerification');
    expect(resendButton).toHaveAttribute('aria-disabled', 'true');
    expect(resendButton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(resendConfirmation).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishResend();
    });

    await waitFor(() => {
      expect(resendButton).toHaveTextContent('btnResendVerification');
    });
    expect(resendButton).not.toHaveAttribute('aria-disabled');
    expect(resendButton).toHaveFocus();
  });

  it('should pass axe accessibility test with the unconfirmed popover open', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <EmailAddressRow email="alias@test.com" isAlias isConfirmed={false} resendConfirmation={jest.fn()} />
    );

    await user.click(screen.getByRole('button', { name: 'unconfirmedInfoAria' }));
    const dialog = await screen.findByRole('dialog', { name: 'unconfirmedBadge' });

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
      expect(await axe(dialog)).toHaveNoViolations();
    });
  });

  it('should pass axe accessibility test for confirmed and unconfirmed aliases', async () => {
    const { container } = render(
      <>
        <EmailAddressRow email="me@test.com" isAlias={false} deleteDisabled />
        <EmailAddressRow email="confirmed@test.com" isAlias isConfirmed makePrimaryEmail={jest.fn()} />
        <EmailAddressRow
          email="unconfirmed@test.com"
          isAlias
          isConfirmed={false}
          resendConfirmation={jest.fn().mockResolvedValue(undefined)}
        />
      </>
    );

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
