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

  it('should explain why the alias is unconfirmed in a tooltip when the info button gets keyboard focus', async () => {
    const user = userEvent.setup();
    render(<EmailAddressRow email="alias@test.com" isAlias isConfirmed={false} />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.tab();

    expect(screen.getByRole('button', { name: 'unconfirmedInfoAria' })).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('unconfirmedTooltip');
  });

  it('should not show the resend action when no resend handler is provided', () => {
    render(<EmailAddressRow email="alias@test.com" isAlias isConfirmed={false} />);

    expect(screen.getByText('unconfirmedBadge')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'btnResendVerification' })).not.toBeInTheDocument();
  });

  it('should call the resend handler and show a disabled sending label until it finishes', async () => {
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

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'btnResendVerification' }));
    });

    expect(resendConfirmation).toHaveBeenCalledWith('alias@test.com');
    const busyButton = screen.getByRole('button', { name: 'btnResendingVerification' });
    expect(busyButton).toBeDisabled();

    await act(async () => {
      finishResend();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'btnResendVerification' })).toBeEnabled();
    });
  });

  it('should pass axe accessibility test with the unconfirmed tooltip open', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <EmailAddressRow email="alias@test.com" isAlias isConfirmed={false} resendConfirmation={jest.fn()} />
    );

    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(screen.getByRole('button', { name: 'unconfirmedInfoAria' })).toHaveAttribute('aria-describedby', tooltip.id);

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
      expect(await axe(tooltip)).toHaveNoViolations();
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
