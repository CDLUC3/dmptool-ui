import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import VerificationFailed from '../page';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  useRouter: jest.fn(),
}));

describe('VerificationFailed', () => {
  const mockPush = jest.fn();

  const withReason = (reason?: string) => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(reason ? { reason } : {}));
  };

  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by PageHeader
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    withReason();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['invalid', 'failed.invalid'],
    ['claimedByOther', 'failed.claimedByOther'],
    ['somethingElse', 'failed.generic'],
    [undefined, 'failed.generic'],
  ])('explains the failure for reason %s and links to the profile', async (reason, messageKey) => {
    withReason(reason);
    render(<VerificationFailed />);

    expect(screen.getByRole('heading', { name: 'failed.title' })).toBeInTheDocument();
    expect(screen.getByText(messageKey)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'failed.profileButton' }));
    });
    expect(mockPush).toHaveBeenCalledWith('/account/profile');
  });

  it('tells a user signed in to the wrong account to sign out, without a profile button', () => {
    withReason('wrongAccount');
    render(<VerificationFailed />);

    expect(screen.getByText('failed.wrongAccount')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'failed.profileButton' })).not.toBeInTheDocument();
  });

  it('should pass axe accessibility test', async () => {
    withReason('invalid');
    const { container } = render(<VerificationFailed />);
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
