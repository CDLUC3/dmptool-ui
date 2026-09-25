import React from 'react';
import { fireEvent, render, screen, waitFor } from '@/utils/test-utils';
import '@testing-library/jest-dom';
import { useRouter } from '@/i18n/routing';
import TemplateCreatePage from '../page';
import { useQueryStep } from '../useQueryStep';
import { mockScrollTo } from '@/__mocks__/common';

// Mock the useQueryStep hook
jest.mock('@/app/[locale]/template/create/useQueryStep', () => ({
  useQueryStep: jest.fn(),
}));

// Mock the debounce function
jest.mock('@/hooks/debounce', () => ({
  debounce: (fn: (..._args: unknown[]) => unknown) => fn,
}));

// Mock the Next.js router

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/template/create'),
}));

jest.mock('@/components/SelectExistingTemplate', () => ({
  __esModule: true,
  default: () => <div data-testid="select-existing-template">Mocked TemplateSelectTemplatePage Component</div>,
}));

describe('TemplateCreatePage', () => {
  let pushMock: jest.Mock;

  beforeEach(() => {
    pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    mockScrollTo();
  });

  it('should render loading state initially', () => {
    (useQueryStep as jest.Mock).mockReturnValue(null); // No step in query initially

    render(<TemplateCreatePage />);
    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
  });

  it('should render step 1 form when step is 1', () => {
    (useQueryStep as jest.Mock).mockReturnValue(1);

    render(<TemplateCreatePage />);
    expect(screen.getByLabelText('nameOfYourTemplate')).toBeInTheDocument();
  });

  it('should render error message when "Next" is clicked with invalid input', async () => {
    (useQueryStep as jest.Mock).mockReturnValue(1);

    render(<TemplateCreatePage />);
    const button = screen.getByText('buttons.next');
    fireEvent.click(button);

    await waitFor(() =>
      expect(
        screen.getByText('messages.templateNameError')
      ).toBeInTheDocument()
    );
  });

  it('should navigate to step 2 when "Next" is clicked with valid input', async () => {
    (useQueryStep as jest.Mock).mockReturnValue(2);

    render(<TemplateCreatePage />);
    expect(screen.getByText(/Mocked TemplateSelectTemplatePage Component/i)).toBeInTheDocument();
  });
});
