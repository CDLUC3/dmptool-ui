import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ErrorMessages from '..';
import { scrollToTop } from '@/utils/general';

expect.extend(toHaveNoViolations);

// Mock the scrollToTop function
jest.mock('@/utils/general', () => ({
  scrollToTop: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

describe('ErrorMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should render no errors when errors prop is empty', () => {
    const { container } = render(<ErrorMessages errors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render error messages from an array', async () => {
    const errors = ['Error 1', 'Error 2'];
    await act(async () => {
      render(
        <ErrorMessages errors={errors} />
      );
    });
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
  });

  it('should render error messages from an object', async () => {
    const errors = {
      error1: 'Error 1',
      error2: 'Error 2',
    };
    await act(async () => {
      render(
        <ErrorMessages errors={errors} />
      );
    });
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
  });

  it('should call scrollToTop when errors are present', async () => {
    const errors = ['Error 1'];
    const ref = { current: document.createElement('div') };
    await act(async () => {
      render(
        <ErrorMessages errors={errors} ref={ref} />
      );
    });
    expect(scrollToTop).toHaveBeenCalledWith(ref);
  });

  it('should not call scrollToTop when no errors are present', async () => {
    const ref = { current: document.createElement('div') };
    await act(async () => {
      render(
        <ErrorMessages errors={[]} ref={ref} />
      );
    });
    expect(scrollToTop).not.toHaveBeenCalled();
  });

  it('should pass accessibility tests', async () => {
    const errors = ['Error 1'];
    const ref = { current: document.createElement('div') };
    const { container } = render(<ErrorMessages errors={errors} ref={ref} />);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('errors with links', () => {
    const errorWithLinks = {
      message: 'This section contains questions used in display logic.',
      linksHeading: 'Edit the display logic on:',
      links: [
        { href: '/template/123/q/10?tab=logic&trigger=3', label: 'Do you have pets?' },
        { href: '/template/123/q/11?tab=logic&trigger=3', label: 'Which pets?' },
      ],
    };

    it('should render the message, links heading and links', () => {
      render(<ErrorMessages errors={[errorWithLinks]} />);

      const errorMessages = screen.getByTestId('error-messages');
      expect(errorMessages).toHaveAttribute('role', 'alert');
      expect(errorMessages).toHaveTextContent('This section contains questions used in display logic.');
      expect(errorMessages).toHaveTextContent('Edit the display logic on:');
      expect(screen.getByRole('link', { name: 'Do you have pets?' })).toHaveAttribute('href', '/template/123/q/10?tab=logic&trigger=3');
      expect(screen.getByRole('link', { name: 'Which pets?' })).toHaveAttribute('href', '/template/123/q/11?tab=logic&trigger=3');
    });

    it('should render errors with links alongside plain string errors in one alert', () => {
      render(<ErrorMessages errors={['A plain error', errorWithLinks]} />);

      expect(screen.getAllByRole('alert')).toHaveLength(1);
      expect(screen.getByText('A plain error')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Which pets?' })).toBeInTheDocument();
    });

    it('should render an error without links as just its message', () => {
      render(<ErrorMessages errors={[{ message: 'Just a message', linksHeading: 'Unused heading' }]} />);

      expect(screen.getByText('Just a message')).toBeInTheDocument();
      expect(screen.queryByText('Unused heading')).not.toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should not render an error with an empty message', () => {
      const { container } = render(<ErrorMessages errors={[{ message: '  ' }]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should pass axe accessibility test', async () => {
      const { container } = render(<ErrorMessages errors={[errorWithLinks]} />);
      await act(async () => {
        expect(await axe(container)).toHaveNoViolations();
      });
    });
  });
});
