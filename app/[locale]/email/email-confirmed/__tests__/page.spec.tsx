import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useRouter } from '@/i18n/routing';
import EmailConfirmed from '../page';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  useRouter: jest.fn(),
}));

describe('EmailConfirmed', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by PageHeader
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('tells the user their email was confirmed', () => {
    render(<EmailConfirmed />);

    expect(screen.getByRole('heading', { name: 'confirmed.title' })).toBeInTheDocument();
    expect(screen.getByText('confirmed.description')).toBeInTheDocument();
  });

  it('takes the user to their profile', async () => {
    render(<EmailConfirmed />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'confirmed.button' }));
    });

    expect(mockPush).toHaveBeenCalledWith('/account/profile');
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(<EmailConfirmed />);
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
